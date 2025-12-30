import express from 'express';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import BN from 'bn.js';
import { MeteoraBondingService } from '../services/meteora-bonding';
import { IdentityChecker } from '../services/identity-checker';
import { db, queries } from '../db/client';
import { TOKEN_CONFIG, BONDING_CONFIG } from '../../../shared/constants';
import { FeeRoutingMode } from '../../../shared/types';

const router = express.Router();

const connection = new Connection(process.env.SOLANA_RPC_URL!);
const payer = Keypair.fromSecretKey(/* load from env */);
const meteoraBonding = new MeteoraBondingService(connection, payer);
const identityChecker = new IdentityChecker();

/**
 * POST /api/tokens/create
 * Create new token with bonding curve
 */
router.post('/create', async (req, res) => {
  try {
    const { name, ticker, imageUri, description, creator, routingMode, payoutWallet } = req.body;

    // 1. Check identity availability (one-launch-only)
    const identityCheck = identityChecker.checkIdentityAvailable(name, ticker);
    if (!identityCheck.available) {
      return res.status(400).json({
        success: false,
        error: identityCheck.reason,
        existingMint: identityCheck.existingMint,
      });
    }

    // 2. Create SPL token mint
    const mintKeypair = Keypair.generate();
    const mint = await createMint(
      connection,
      payer,
      payer.publicKey,
      null,
      TOKEN_CONFIG.DECIMALS,
      mintKeypair
    );

    // 3. Create token account for backend
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      payer.publicKey
    );

    // 4. Mint total supply
    await mintTo(
      connection,
      payer,
      mint,
      tokenAccount.address,
      payer,
      TOKEN_CONFIG.TOTAL_SUPPLY * Math.pow(10, TOKEN_CONFIG.DECIMALS)
    );

    // 5. Create Meteora DLMM bonding pool
    const initialPrice = 0.00001; // Very low starting price
    const { transaction: createPoolTx, poolAddress } = await meteoraBonding.createBondingPool(
      mint,
      new PublicKey(creator),
      initialPrice
    );

    // Execute pool creation
    await connection.sendTransaction(createPoolTx, [payer]);

    // 6. Add initial liquidity (85% of supply)
    const bondingSupply = new BN(
      TOKEN_CONFIG.TOTAL_SUPPLY * 0.85 * Math.pow(10, TOKEN_CONFIG.DECIMALS)
    );
    const liquidityTxs = await meteoraBonding.initializeBondingLiquidity(
      poolAddress,
      mint,
      bondingSupply,
      new PublicKey(creator)
    );

    for (const tx of liquidityTxs) {
      await connection.sendTransaction(tx, [payer]);
    }

    // 7. Register identity
    identityChecker.registerIdentity(name, ticker, mint.toString(), creator);

    // 8. Save to database
    queries.insertToken.run(
      mint.toString(),
      name,
      ticker,
      imageUri,
      description || null,
      creator,
      Date.now(),
      null, // tags
      poolAddress.toString()
    );

    queries.insertBondingState.run(
      mint.toString(),
      poolAddress.toString(),
      BONDING_CONFIG.TARGET_SOL
    );

    queries.insertRoutingConfig.run(
      mint.toString(),
      routingMode || FeeRoutingMode.LP,
      payoutWallet || null,
      Date.now()
    );

    res.json({
      success: true,
      token: {
        mint: mint.toString(),
        name,
        ticker,
        poolAddress: poolAddress.toString(),
        creator,
      },
    });
  } catch (error) {
    console.error('Token creation error:', error);
    res.status(500).json({ success: false, error: 'Token creation failed' });
  }
});

/**
 * GET /api/tokens
 * Get all tokens
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const tokens = queries.getAllTokens.all(limit, offset);

    res.json({ success: true, tokens });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch tokens' });
  }
});

/**
 * GET /api/tokens/:mint
 * Get token details
 */
router.get('/:mint', async (req, res) => {
  try {
    const { mint } = req.params;
    const token = queries.getToken.get(mint);

    if (!token) {
      return res.status(404).json({ success: false, error: 'Token not found' });
    }

    const bondingState = queries.getBondingState.get(mint);
    const routingConfig = queries.getRoutingConfig.get(mint);

    res.json({
      success: true,
      token,
      bondingState,
      routingConfig,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch token' });
  }
});

/**
 * GET /api/tokens/:mint/progress
 * Get bonding progress
 */
router.get('/:mint/progress', async (req, res) => {
  try {
    const { mint } = req.params;
    const bondingState = queries.getBondingState.get(mint) as any;

    if (!bondingState) {
      return res.status(404).json({ success: false, error: 'Token not found' });
    }

    // Get current SOL in pool
    const currentSol = await meteoraBonding.getCurrentSolCollected(
      new PublicKey(bondingState.dlmm_pool_address)
    );

    // Update database
    queries.updateBondingProgress.run(currentSol, mint);

    const progress = (currentSol / BONDING_CONFIG.TARGET_SOL) * 100;

    res.json({
      success: true,
      currentSol,
      targetSol: BONDING_CONFIG.TARGET_SOL,
      progress,
      isComplete: currentSol >= BONDING_CONFIG.TARGET_SOL,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch progress' });
  }
});

export default router;