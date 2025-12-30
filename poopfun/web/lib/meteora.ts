// Meteora DLMM utilities for frontend
import { Connection, PublicKey } from '@solana/web3.js';
import DLMM from '@meteora-ag/dlmm';

export class MeteoraClient {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Get pool info
   */
  async getPoolInfo(poolAddress: string) {
    try {
      const dlmmPool = await DLMM.create(this.connection, new PublicKey(poolAddress));
      return await dlmmPool.getLbPairInfo();
    } catch (error) {
      console.error('Failed to get pool info:', error);
      return null;
    }
  }

  /**
   * Get active bin price
   */
  async getActiveBinPrice(poolAddress: string) {
    try {
      const dlmmPool = await DLMM.create(this.connection, new PublicKey(poolAddress));
      const activeBin = await dlmmPool.getActiveBin();
      return activeBin.price;
    } catch (error) {
      console.error('Failed to get active bin price:', error);
      return null;
    }
  }
}