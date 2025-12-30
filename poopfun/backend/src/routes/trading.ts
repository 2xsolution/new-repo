import express from 'express';
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import BN from 'bn.js';
import { MeteoraBondingService } from '../services/meteora-bonding';
import { db, queries } from '../db/client';
import { BONDING_CONFIG, PRE_BONDING_FEES } from '../../../shared/constants';

const router = express.Router();

const connection = new Connection(process.env.SOLANA_RPC_URL!);
const payer = Keypair.fromSecretKey(/* load from env */);
const meteoraBonding = new MeteoraBondingService(connection, payer);

/**
 * POST /api/trading/buy
 * Execute buy during bonding phase
 */
router.post('/buy', async (req, res) => {
  try {
    const { mint, buyer, solAmount } = req.body;

    const bondingState = queries.getBondingState.get(mint) as any;
    if (!bondingState) {
      return res.status(404).json({ success: false, error: 'Token not found' });
    }

    if (bondingState.is_complete) {
      return res.status(400).json({ success: false, error: 'Bonding complete, trade on permanent LP' });
    }

    // Calculate fees (1% total: 0.9% platform, 0.1% creator)
    const solLamports = parseFloat(solAmount) * LAMPORTS_PER_SOL;
    const totalFee = (solLamports * PRE_BONDING_FEES.TOTAL_BPS) / 10000;
    const platformFee = (totalFee * PRE_BONDING_FEES.PLATFORM_BPS) / PRE_BONDING_FEES.TOTAL_BPS;
    const creatorFee = (totalFee * PRE_BONDING_FEES.CREATOR_BPS) / PRE_BONDING_FEES.TOTAL_BPS;

    const solAfterFees = solLamports - totalFee;

    // Execute swap on Meteora
    const { transaction, expectedTokens } = await meteoraBonding.executeBondingBuy(
      new PublicKey(bondingState.dlmm_pool_address),
      new PublicKey(buyer),
      new BN(solAfterFees),
      100 // 1% slippage
    );

    // Record fees
    const token = queries.getToken.get(mint) as any;
    queries.insertClaimableFee.run(mint, process.env.PLATFORM_WALLET, 'platform', platformFee / LAMPORTS_PER_SOL, Date.now());
    queries.insertClaimableFee.run(mint, token.creator, 'creator', creatorFee / LAMPORTS_PER_SOL, Date.now());

    // Record trade
    queries.insertTrade.run(
      mint,
      buyer,
      'buy',
      solAmount,
      expectedTokens.toNumber() / Math.pow(10, 9),
      totalFee / LAMPORTS_PER_SOL,
      solAmount / (expectedTokens.toNumber() / Math.pow(10, 9)),
      Date.now(),
      '', // Will be filled with actual signature
      1 // is_bonding_phase
    );

    // Check if bonding complete
    const newSolCollected = bondingState.total_sol_collected + parseFloat(solAmount);
    if (newSolCollected >= BONDING_CONFIG.TARGET_SOL) {
      // Finalize bonding
      await finalizeBonding(mint, token.creator);
    }

    res.json({
      success: true,
      transaction: transaction.serialize().toString('base64'),
      expectedTokens: expectedTokens.toString(),
      fees: {
        total: totalFee,
        platform: platformFee,
        creator: creatorFee,
      },
    });
  } catch (error) {
    console.error('Buy error:', error);
    res.status(500).json({ success: false, error: 'Buy failed' });
  }
});

/**
 * POST /api/trading/sell
 * Execute sell during bonding phase
 */
router.post('/sell', async (req, res) => {
  try {
    const { mint, seller, tokenAmount } = req.body;

    const bondingState = queries.getBondingState.get(mint) as any;
    if (!bondingState) {
      return res.status(404).json({ success: false, error: 'Token not found' });
    }

    if (bondingState.is_complete) {
      return res.status(400).json({ success: false, error: 'Bonding complete, trade on permanent LP' });
    }

    // Execute swap
    const tokenLamports = parseFloat(tokenAmount) * Math.pow(10, 9);
    const { transaction, expectedSol } = await meteoraBonding.executeBondingSell(
      new PublicKey(bondingState.dlmm_pool_address),
      new PublicKey(seller),
      new BN(tokenLamports),
      100 // 1% slippage
    );

    // Calculate fees
    const totalFee = (expectedSol.toNumber() * PRE_BONDING_FEES.TOTAL_BPS) / 10000;
    const platformFee = (totalFee * PRE_BONDING_FEES.PLATFORM_BPS) / PRE_BONDING_FEES.TOTAL_BPS;
    const creatorFee = (totalFee * PRE_BONDING_FEES.CREATOR_BPS) / PRE_BONDING_FEES.TOTAL_BPS;

    // Record fees
    const token = queries.getToken.get(mint) as any;
    queries.insertClaimableFee.run(mint, process.env.PLATFORM_WALLET, 'platform', platformFee / LAMPORTS_PER_SOL, Date.now());
    queries.insertClaimableFee.run(mint, token.creator, 'creator', creatorFee / LAMPORTS_PER_SOL, Date.now());

    // Record trade
    queries.insertTrade.run(
      mint,
      seller,
      'sell',
      expectedSol.toNumber() / LAMPORTS_PER_SOL,
      tokenAmount,
      totalFee / LAMPORTS_PER_SOL,
      (expectedSol.toNumber() / LAMPORTS_PER_SOL) / tokenAmount,
      Date.now(),
      '',
      1
    );

    res.json({
      success: true,
      transaction: transaction.serialize().toString('base64'),
      expectedSol: expectedSol.toString(),
      fees: {
        total: totalFee,
        platform: platformFee,
        creator: creatorFee,
      },
    });
  } catch (error) {
    console.error('Sell error:', error);
    res.status(500).json({ success: false, error: 'Sell failed' });
  }
});

/**
 * Finalize bonding when 50 SOL reached
 */
async function finalizeBonding(mint: string, creator: string) {
  const bondingState = queries.getBondingState.get(mint) as any;
  
  const transactions = await meteoraBonding.finalizeBonding(
    new PublicKey(bondingState.dlmm_pool_address),
    new PublicKey(mint),
    new PublicKey(creator)
  );

  // Execute all finalization transactions
  for (const tx of transactions) {
    await connection.sendTransaction(tx, [payer]);
  }

  // Mark bonding as complete
  queries.completeBonding.run(Date.now(), mint);
  queries.updateBondingComplete.run('permanent_lp_address_here', BONDING_CONFIG.TARGET_SOL, mint);
}

export default router;