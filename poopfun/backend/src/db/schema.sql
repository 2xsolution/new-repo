-- Identity registry (one-launch-only enforcement)
CREATE TABLE identity_registry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name_lower TEXT NOT NULL,
  ticker_upper TEXT NOT NULL,
  identity_hash TEXT NOT NULL UNIQUE,
  mint TEXT NOT NULL UNIQUE,
  creator TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(name_lower, ticker_upper)
);

CREATE INDEX idx_identity_hash ON identity_registry(identity_hash);

-- Tokens
CREATE TABLE tokens (
  mint TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ticker TEXT NOT NULL,
  image_uri TEXT,
  description TEXT,
  creator TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  tags TEXT, -- JSON array
  bonding_complete INTEGER DEFAULT 0,
  dlmm_pool_address TEXT,
  permanent_lp_address TEXT,
  total_sol_collected REAL DEFAULT 0,
  market_cap REAL DEFAULT 0,
  volume_24h REAL DEFAULT 0,
  price_change_24h REAL DEFAULT 0
);

CREATE INDEX idx_creator ON tokens(creator);
CREATE INDEX idx_created_at ON tokens(created_at DESC);
CREATE INDEX idx_bonding_complete ON tokens(bonding_complete);

-- Bonding state
CREATE TABLE bonding_state (
  mint TEXT PRIMARY KEY,
  dlmm_pool_address TEXT NOT NULL,
  total_sol_collected REAL DEFAULT 0,
  target_sol REAL NOT NULL,
  is_complete INTEGER DEFAULT 0,
  completed_at INTEGER,
  FOREIGN KEY (mint) REFERENCES tokens(mint)
);

-- Fee routing config
CREATE TABLE routing_config (
  mint TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  payout_wallet TEXT,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (mint) REFERENCES tokens(mint)
);

-- Fee tiers (post-bonding MC-based fees) - CONFIGURABLE
CREATE TABLE fee_tiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mc_min REAL NOT NULL,
  mc_max REAL NOT NULL,
  fee_bps INTEGER NOT NULL,
  creator_share_bps INTEGER NOT NULL,
  platform_share_bps INTEGER NOT NULL
);

-- Claimable fees per token
CREATE TABLE claimable_fees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mint TEXT NOT NULL,
  wallet TEXT NOT NULL,
  fee_type TEXT NOT NULL, -- 'creator' or 'platform'
  amount REAL NOT NULL,
  claimed INTEGER DEFAULT 0,
  claimed_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (mint) REFERENCES tokens(mint)
);

CREATE INDEX idx_claimable ON claimable_fees(mint, wallet, claimed);

-- Trades (for analytics)
CREATE TABLE trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mint TEXT NOT NULL,
  trader TEXT NOT NULL,
  type TEXT NOT NULL, -- 'buy' or 'sell'
  sol_amount REAL NOT NULL,
  token_amount REAL NOT NULL,
  fee_amount REAL NOT NULL,
  price REAL NOT NULL,
  timestamp INTEGER NOT NULL,
  signature TEXT NOT NULL UNIQUE,
  is_bonding_phase INTEGER NOT NULL,
  FOREIGN KEY (mint) REFERENCES tokens(mint)
);

CREATE INDEX idx_trades_mint ON trades(mint, timestamp DESC);
CREATE INDEX idx_trades_trader ON trades(trader, timestamp DESC);

-- Holders (for merkle rewards)
CREATE TABLE holders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mint TEXT NOT NULL,
  wallet TEXT NOT NULL,
  balance REAL NOT NULL,
  last_updated INTEGER NOT NULL,
  UNIQUE(mint, wallet),
  FOREIGN KEY (mint) REFERENCES tokens(mint)
);

CREATE INDEX idx_holders ON holders(mint, balance DESC);

-- Merkle distribution epochs
CREATE TABLE merkle_epochs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mint TEXT NOT NULL,
  epoch_id INTEGER NOT NULL,
  merkle_root TEXT NOT NULL,
  total_amount REAL NOT NULL,
  reward_type TEXT NOT NULL, -- 'holders' or 'stakers'
  ipfs_url TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE(mint, epoch_id, reward_type),
  FOREIGN KEY (mint) REFERENCES tokens(mint)
);

-- Merkle claims
CREATE TABLE merkle_claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  epoch_id INTEGER NOT NULL,
  wallet TEXT NOT NULL,
  amount REAL NOT NULL,
  claimed INTEGER DEFAULT 0,
  claimed_at INTEGER,
  UNIQUE(epoch_id, wallet),
  FOREIGN KEY (epoch_id) REFERENCES merkle_epochs(id)
);

-- Insert default fee tiers
INSERT INTO fee_tiers (mc_min, mc_max, fee_bps, creator_share_bps, platform_share_bps) VALUES
  (0, 100000, 100, 10, 90),
  (100000, 500000, 80, 15, 65),
  (500000, 1000000, 60, 20, 40),
  (1000000, 5000000, 40, 25, 15),
  (5000000, 999999999, 30, 20, 10);