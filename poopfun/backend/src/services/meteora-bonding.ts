import { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import DLMM, { StrategyType, ActivationType } from '@meteora-ag/dlmm';
import BN from 'bn.js';
import { BONDING_CONFIG, METEORA_BONDING_CONFIG, QUOTE_TOKENS, TOKEN_CONFIG } from '../../../shared/constants';

export class MeteoraBondingService {
  private connection: Connection;
  private payer: Keypair;

  constructor(connection: Connection, payer: Keypair) {
    this.connection = connection;
    this.payer = payer;
  }

  /**
   * Create DLMM pool for bonding curve
   * Uses customizable permissionless pool with specific settings for bonding
   */
  async createBondingPool(
    tokenMint: PublicKey,
    creator: PublicKey,
    initialPriceSolPerToken: number
  ): Promise<{ transaction: Transaction; poolAddress: PublicKey }> {
    // Calculate active bin ID from initial price
    const activeBinId = this.calculateBinIdFromPrice(initialPriceSolPerToken);

    // Create customizable permissionless DLMM pair
    // Token X = our new token, Token Y = SOL (wrapped)
    const transaction = await DLMM.createCustomizablePermissionlessLbPair2(
      this.connection,
      METEORA_BONDING_CONFIG.BIN_STEP,
      tokenMint, // Token X (our token)
      QUOTE_TOKENS.SOL, // Token Y (SOL)
      new BN(activeBinId),
      METEORA_BONDING_CONFIG.FEE_BPS,
      ActivationType.Timestamp,
      false, // No alpha vault
      creator,
      new BN(Math.floor(Date.now() / 1000)), // Activate immediately
      false // No creator pool control
    );

    // Derive pool address
    const poolAddress = await this.getDLMMPoolAddress(tokenMint, QUOTE_TOKENS.SOL);

    return { transaction, poolAddress };
  }

  /**
   * Initialize position and add initial bonding liquidity
   * This creates the bonding curve with 85% of token supply
   */
  async initializeBondingLiquidity(
    poolAddress: PublicKey,
    tokenMint: PublicKey,
    tokenSupplyForBonding: BN, // 85% of total supply
    creator: PublicKey
  ): Promise<Transaction[]> {
    const dlmmPool = await DLMM.create(this.connection, poolAddress);

    // Create position keypair
    const positionKeypair = Keypair.generate();

    // Define bonding curve range (wide range to capture all bonding activity)
    const minPrice = 0.00001; // Very low starting price
    const maxPrice = 0.01; // Target price at 50 SOL

    // Calculate strategy for uniform distribution across bins
    const strategy = {
      strategyType: StrategyType.SpotBalanced,
      minBinId: this.calculateBinIdFromPrice(minPrice),
      maxBinId: this.calculateBinIdFromPrice(maxPrice),
    };

    // Initialize position and add liquidity
    // Only adding tokens (no SOL initially - users buy with SOL)
    const transaction = await dlmmPool.initializePositionAndAddLiquidityByStrategy({
      positionPubKey: positionKeypair.publicKey,
      totalXAmount: tokenSupplyForBonding, // Our token (X)
      totalYAmount: new BN(0), // No SOL initially (Y)
      strategy,
      user: creator,
      slippage: 0, // No slippage on initialization
    });

    return [transaction];
  }

  /**
   * Execute buy during bonding phase
   */
  async executeBondingBuy(
    poolAddress: PublicKey,
    buyer: PublicKey,
    solAmount: BN,
    slippageBps: number = 100
  ): Promise<{ transaction: Transaction; expectedTokens: BN }> {
    const dlmmPool = await DLMM.create(this.connection, poolAddress);

    // Get quote for swap
    const binArrays = await dlmmPool.getBinArrayForSwap(true, 10);
    const swapQuote = dlmmPool.swapQuote(
      solAmount,
      true, // swapForY = true (SOL to Token)
      new BN(slippageBps),
      binArrays
    );

    // Create swap transaction
    const transaction = await dlmmPool.swap({
      inToken: QUOTE_TOKENS.SOL,
      outToken: dlmmPool.lbPair.tokenXMint,
      inAmount: solAmount,
      minOutAmount: swapQuote.minOutAmount,
      lbPair: poolAddress,
      user: buyer,
      binArraysPubkey: swapQuote.binArraysPubkey,
    });

    return {
      transaction,
      expectedTokens: swapQuote.consumedAmountOut,
    };
  }

  /**
   * Execute sell during bonding phase
   */
  async executeBondingSell(
    poolAddress: PublicKey,
    seller: PublicKey,
    tokenAmount: BN,
    slippageBps: number = 100
  ): Promise<{ transaction: Transaction; expectedSol: BN }> {
    const dlmmPool = await DLMM.create(this.connection, poolAddress);

    // Get quote for swap
    const binArrays = await dlmmPool.getBinArrayForSwap(false, 10);
    const swapQuote = dlmmPool.swapQuote(
      tokenAmount,
      false, // swapForY = false (Token to SOL)
      new BN(slippageBps),
      binArrays
    );

    // Create swap transaction
    const transaction = await dlmmPool.swap({
      inToken: dlmmPool.lbPair.tokenXMint,
      outToken: QUOTE_TOKENS.SOL,
      inAmount: tokenAmount,
      minOutAmount: swapQuote.minOutAmount,
      lbPair: poolAddress,
      user: seller,
      binArraysPubkey: swapQuote.binArraysPubkey,
    });

    return {
      transaction,
      expectedSol: swapQuote.consumedAmountOut,
    };
  }

  /**
   * Finalize bonding and migrate to permanent LP
   * Called when 50 SOL is collected
   */
  async finalizeBonding(
    poolAddress: PublicKey,
    tokenMint: PublicKey,
    creator: PublicKey
  ): Promise<Transaction[]> {
    const transactions: Transaction[] = [];

    const dlmmPool = await DLMM.create(this.connection, poolAddress);

    // 1. Remove liquidity from bonding position
    const positions = await dlmmPool.getPositionsByUserAndLbPair(this.payer.publicKey);
    
    for (const position of positions.userPositions) {
      const removeTx = await dlmmPool.removeLiquidity({
        user: this.payer.publicKey,
        position: position.publicKey,
        fromBinId: position.lowerBinId,
        toBinId: position.upperBinId,
        bps: new BN(10000), // Remove 100%
        shouldClaimAndClose: true,
      });
      
      if (Array.isArray(removeTx)) {
        transactions.push(...removeTx);
      } else {
        transactions.push(removeTx);
      }
    }

    // 2. Create new permanent LP with tighter range
    // This will be the post-bonding trading pool
    const permanentPoolTx = await this.createPermanentLP(
      tokenMint,
      creator
    );
    transactions.push(permanentPoolTx);

    // 3. Send payouts (2 SOL to creator, 1 SOL to platform)
    const payoutTx = await this.sendBondingCompletionPayouts(creator);
    transactions.push(payoutTx);

    return transactions;
  }

  /**
   * Create permanent LP after bonding with 47 SOL + 85% tokens
   */
  private async createPermanentLP(
    tokenMint: PublicKey,
    creator: PublicKey
  ): Promise<Transaction> {
    // Calculate market price after 50 SOL bonding
    const marketPrice = this.calculateFinalBondingPrice();

    // Create new DLMM pool for permanent trading
    const activeBinId = this.calculateBinIdFromPrice(marketPrice);

    const tx = await DLMM.createCustomizablePermissionlessLbPair2(
      this.connection,
      new BN(10), // Wider bin step for normal trading (0.1%)
      tokenMint,
      QUOTE_TOKENS.SOL,
      new BN(activeBinId),
      new BN(30), // Lower fee for post-bonding (0.3%)
      ActivationType.Timestamp,
      false,
      creator,
      new BN(Math.floor(Date.now() / 1000)),
      false
    );

    return tx;
  }

  /**
   * Send completion payouts
   */
  private async sendBondingCompletionPayouts(creator: PublicKey): Promise<Transaction> {
    const tx = new Transaction();

    // 2 SOL to creator
    tx.add(
      SystemProgram.transfer({
        fromPubkey: this.payer.publicKey,
        toPubkey: creator,
        lamports: BONDING_CONFIG.CREATOR_PAYOUT_SOL * LAMPORTS_PER_SOL,
      })
    );

    // 1 SOL to platform
    const platformWallet = new PublicKey(process.env.PLATFORM_WALLET!);
    tx.add(
      SystemProgram.transfer({
        fromPubkey: this.payer.publicKey,
        toPubkey: platformWallet,
        lamports: BONDING_CONFIG.PLATFORM_PAYOUT_SOL * LAMPORTS_PER_SOL,
      })
    );

    return tx;
  }

  /**
   * Calculate bin ID from price
   */
  private calculateBinIdFromPrice(price: number): number {
    // Meteora DLMM bin ID calculation
    // binId = floor(log(price) / log(1 + binStep/10000))
    const binStepBps = METEORA_BONDING_CONFIG.BIN_STEP.toNumber();
    const binId = Math.floor(
      Math.log(price) / Math.log(1 + binStepBps / 10000)
    );
    return binId + 8388608; // Add offset for positive prices
  }

  /**
   * Calculate final bonding price (at 50 SOL)
   */
  private calculateFinalBondingPrice(): number {
    // Simple calculation: if 85% of 1B tokens sold for 50 SOL
    const tokensInBonding = TOKEN_CONFIG.TOTAL_SUPPLY * 0.85;
    return BONDING_CONFIG.TARGET_SOL / tokensInBonding;
  }

  /**
   * Get current SOL collected in pool
   */
  async getCurrentSolCollected(poolAddress: PublicKey): Promise<number> {
    const dlmmPool = await DLMM.create(this.connection, poolAddress);
    const activeBin = await dlmmPool.getActiveBin();
    
    // Sum SOL across all bins
    const binArrays = await dlmmPool.getBinArrays();
    let totalSol = 0;
    
    for (const binArray of binArrays) {
      for (const bin of binArray.bins) {
        if (bin.amountY) {
          totalSol += bin.amountY.toNumber() / LAMPORTS_PER_SOL;
        }
      }
    }
    
    return totalSol;
  }

  /**
   * Get derived DLMM pool address
   */
  private async getDLMMPoolAddress(
    tokenX: PublicKey,
    tokenY: PublicKey
  ): Promise<PublicKey> {
    // This would use Meteora's PDA derivation
    // For now, return placeholder - implement actual PDA logic
    return Keypair.generate().publicKey;
  }
}