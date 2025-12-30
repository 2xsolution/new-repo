import { PublicKey } from '@solana/web3.js';

export enum FeeRoutingMode {
  LP = 'LP',
  BUYBACK_BURN = 'BUYBACK_BURN',
  SEND_TO_WALLET = 'SEND_TO_WALLET',
  VOLUME = 'VOLUME',
  MARKET_MAKING = 'MARKET_MAKING',
  HOLDER_REWARDS = 'HOLDER_REWARDS',
  STAKER_REWARDS = 'STAKER_REWARDS'
}

export interface TokenMetadata {
  mint: string;
  name: string;
  ticker: string;
  imageUri: string;
  description?: string;
  creator: string;
  createdAt: number;
  tags?: string[];
}

export interface BondingState {
  mint: string;
  dlmmPoolAddress: string;
  totalSolCollected: number;
  targetSol: number;
  isComplete: boolean;
  completedAt?: number;
  lpAddress?: string;
}

export interface RoutingConfig {
  mint: string;
  mode: FeeRoutingMode;
  payoutWallet?: string;
  updatedAt: number;
}

export interface FeeTier {
  mcMin: number;
  mcMax: number;
  feeBps: number;
  creatorShareBps: number;
  platformShareBps: number;
}

export interface ClaimableFees {
  mint: string;
  creatorFees: number;
  platformFees: number;
  lastClaimed: number;
}