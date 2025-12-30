import express from 'express';
import { IdentityChecker } from '../services/identity-checker';

const router = express.Router();
const identityChecker = new IdentityChecker();

/**
 * GET /api/identity/check
 * Check if name+ticker combination is available
 */
router.get('/check', async (req, res) => {
  try {
    const { name, ticker } = req.query as { name: string; ticker: string };

    if (!name || !ticker) {
      return res.status(400).json({ success: false, error: 'Name and ticker required' });
    }

    const result = identityChecker.checkIdentityAvailable(name, ticker);

    res.json({
      success: true,
      available: result.available,
      reason: result.reason,
      existingMint: result.existingMint,
    });
  } catch (error) {
    console.error('Identity check error:', error);
    res.status(500).json({ success: false, error: 'Identity check failed' });
  }
});

export default router;