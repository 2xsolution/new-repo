import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

// Bonding configuration
export const BONDING_CONFIG = {
  TARGET_SOL: 50, // 50 SOL bonding cap
  LP_SOL: 47, // 47 SOL goes to LP after bonding
  CREATOR_PAYOUT_SOL: 2, // 2 SOL to creator
  PLATFORM_PAYOUT_SOL: 1, // 1 SOL to platform
  LP_TOKEN_PERCENT: 85, // 85% of supply goes to LP
  REMAINING_PERCENT: 15, // 15% stays outside LP
};

// Pre-bonding fees (during bonding phase)
export const PRE_BONDING_FEES = {
  TOTAL_BPS: 100, // 1% total fee
  PLATFORM_BPS: 90, // 0.9% to platform
  CREATOR_BPS: 10, // 0.1% to creator
};

// Post-bonding MC-based fee tiers (configurable)
export const DEFAULT_FEE_TIERS = [
  { mcMin: 0, mcMax: 100_000, feeBps: 100, creatorShareBps: 10, platformShareBps: 90 },
  { mcMin: 100_000, mcMax: 500_000, feeBps: 80, creatorShareBps: 15, platformShareBps: 65 },
  { mcMin: 500_000, mcMax: 1_000_000, feeBps: 60, creatorShareBps: 20, platformShareBps: 40 },
  { mcMin: 1_000_000, mcMax: 5_000_000, feeBps: 40, creatorShareBps: 25, platformShareBps: 15 },
  { mcMin: 5_000_000, mcMax: Infinity, feeBps: 30, creatorShareBps: 20, platformShareBps: 10 },
];

// Token settings
export const TOKEN_CONFIG = {
  DECIMALS: 9,
  TOTAL_SUPPLY: 1_000_000_000, // 1 billion
  DISPLAY_START_MC: 10_000, // $10k for display
};

// Meteora DLMM settings for bonding
export const METEORA_BONDING_CONFIG = {
  BIN_STEP: 25, // 0.25% bin step (tight for bonding curve)
  BASE_FACTOR: new BN(10000),
  ACTIVATION_TYPE: 'Timestamp' as const, // or 'Slot'
  FEE_BPS: new BN(100), // 1% fee during bonding
};

// SOL/USDC for quote token (mainnet addresses)
export const QUOTE_TOKENS = {
  SOL: new PublicKey('So11111111111111111111111111111111111111112'),
  USDC: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
};