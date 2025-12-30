import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../poopfun.db');
export const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

export const queries = {
  // Identity checks
  checkIdentity: db.prepare(`
    SELECT mint FROM identity_registry 
    WHERE name_lower = ? AND ticker_upper = ?
  `),

  insertIdentity: db.prepare(`
    INSERT INTO identity_registry (name_lower, ticker_upper, identity_hash, mint, creator, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `),

  // Tokens
  insertToken: db.prepare(`
    INSERT INTO tokens (mint, name, ticker, image_uri, description, creator, created_at, tags, dlmm_pool_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  getToken: db.prepare(`SELECT * FROM tokens WHERE mint = ?`),
  
  getAllTokens: db.prepare(`
    SELECT * FROM tokens 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `),

  getTokensByCreator: db.prepare(`
    SELECT * FROM tokens WHERE creator = ? ORDER BY created_at DESC
  `),

  updateBondingComplete: db.prepare(`
    UPDATE tokens 
    SET bonding_complete = 1, permanent_lp_address = ?, total_sol_collected = ?
    WHERE mint = ?
  `),

  // Bonding state
  insertBondingState: db.prepare(`
    INSERT INTO bonding_state (mint, dlmm_pool_address, target_sol)
    VALUES (?, ?, ?)
  `),

  getBondingState: db.prepare(`
    SELECT * FROM bonding_state WHERE mint = ?
  `),

  updateBondingProgress: db.prepare(`
    UPDATE bonding_state 
    SET total_sol_collected = ?
    WHERE mint = ?
  `),

  completeBonding: db.prepare(`
    UPDATE bonding_state 
    SET is_complete = 1, completed_at = ?
    WHERE mint = ?
  `),

  // Routing config
  insertRoutingConfig: db.prepare(`
    INSERT INTO routing_config (mint, mode, payout_wallet, updated_at)
    VALUES (?, ?, ?, ?)
  `),

  getRoutingConfig: db.prepare(`
    SELECT * FROM routing_config WHERE mint = ?
  `),

  updateRoutingConfig: db.prepare(`
    UPDATE routing_config 
    SET mode = ?, payout_wallet = ?, updated_at = ?
    WHERE mint = ?
  `),

  // Fee tiers
  getFeeTiers: db.prepare(`
    SELECT * FROM fee_tiers ORDER BY mc_min ASC
  `),

  getFeeTierForMC: db.prepare(`
    SELECT * FROM fee_tiers 
    WHERE mc_min <= ? AND mc_max > ?
    ORDER BY mc_min DESC
    LIMIT 1
  `),

  // Claimable fees
  insertClaimableFee: db.prepare(`
    INSERT INTO claimable_fees (mint, wallet, fee_type, amount, created_at)
    VALUES (?, ?, ?, ?, ?)
  `),

  getClaimableFees: db.prepare(`
    SELECT SUM(amount) as total 
    FROM claimable_fees 
    WHERE mint = ? AND wallet = ? AND fee_type = ? AND claimed = 0
  `),

  markFeesClaimed: db.prepare(`
    UPDATE claimable_fees 
    SET claimed = 1, claimed_at = ?
    WHERE mint = ? AND wallet = ? AND fee_type = ? AND claimed = 0
  `),

  // Trades
  insertTrade: db.prepare(`
    INSERT INTO trades (mint, trader, type, sol_amount, token_amount, fee_amount, price, timestamp, signature, is_bonding_phase)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  getRecentTrades: db.prepare(`
    SELECT * FROM trades 
    WHERE mint = ? 
    ORDER BY timestamp DESC 
    LIMIT ?
  `),

  // Holders
  upsertHolder: db.prepare(`
    INSERT INTO holders (mint, wallet, balance, last_updated)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(mint, wallet) 
    DO UPDATE SET balance = excluded.balance, last_updated = excluded.last_updated
  `),

  getTopHolders: db.prepare(`
    SELECT * FROM holders 
    WHERE mint = ? 
    ORDER BY balance DESC 
    LIMIT ?
  `),

  getAllHolders: db.prepare(`
    SELECT * FROM holders WHERE mint = ? AND balance > 0
  `),
};