import express from 'express';
import { db, queries } from '../db/client';

const router = express.Router();

/**
 * GET /api/admin/stats
 * Get platform statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // Get total tokens
    const totalTokens = db.prepare('SELECT COUNT(*) as count FROM tokens').get();

    // Get total SOL collected
    const totalSol = db.prepare('SELECT SUM(total_sol_collected) as total FROM tokens').get();

    // Get completed bondings
    const completedBondings = db.prepare('SELECT COUNT(*) as count FROM tokens WHERE bonding_complete = 1').get();

    // Get total fees collected
    const totalFees = db.prepare('SELECT SUM(amount) as total FROM claimable_fees WHERE fee_type = "platform"').get();

    res.json({
      success: true,
      stats: {
        totalTokens: totalTokens.count,
        totalSolCollected: totalSol.total || 0,
        completedBondings: completedBondings.count,
        totalPlatformFees: totalFees.total || 0,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/admin/fee-tiers
 * Get current fee tiers
 */
router.get('/fee-tiers', async (req, res) => {
  try {
    const feeTiers = queries.getFeeTiers.all();
    res.json({ success: true, feeTiers });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch fee tiers' });
  }
});

/**
 * PUT /api/admin/fee-tiers
 * Update fee tiers (admin only)
 */
router.put('/fee-tiers', async (req, res) => {
  try {
    const { feeTiers } = req.body;

    // Clear existing and insert new
    db.prepare('DELETE FROM fee_tiers').run();

    const insertStmt = db.prepare(`
      INSERT INTO fee_tiers (mc_min, mc_max, fee_bps, creator_share_bps, platform_share_bps)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const tier of feeTiers) {
      insertStmt.run(tier.mcMin, tier.mcMax, tier.feeBps, tier.creatorShareBps, tier.platformShareBps);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Fee tiers update error:', error);
    res.status(500).json({ success: false, error: 'Failed to update fee tiers' });
  }
});

export default router;