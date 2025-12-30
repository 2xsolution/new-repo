import crypto from 'crypto';
import { db, queries } from '../db/client';

export class IdentityChecker {
  /**
   * Generate identity hash from name + ticker
   */
  generateIdentityHash(name: string, ticker: string): string {
    const normalized = `${name.toLowerCase().trim()}:${ticker.toUpperCase().trim()}`;
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Check if identity already exists (enforce one-launch-only)
   */
  checkIdentityAvailable(name: string, ticker: string): {
    available: boolean;
    existingMint?: string;
    reason?: string;
  } {
    const identityHash = this.generateIdentityHash(name, ticker);
    const nameLower = name.toLowerCase().trim();
    const tickerUpper = ticker.toUpperCase().trim();

    // Check database
    const existing = queries.checkIdentity.get(nameLower, tickerUpper) as any;

    if (existing) {
      return {
        available: false,
        existingMint: existing.mint,
        reason: `Token "${name}" (${ticker}) already exists`,
      };
    }

    return { available: true };
  }

  /**
   * Register new identity (called during token creation)
   */
  registerIdentity(name: string, ticker: string, mint: string, creator: string): void {
    const identityHash = this.generateIdentityHash(name, ticker);
    const nameLower = name.toLowerCase().trim();
    const tickerUpper = ticker.toUpperCase().trim();

    queries.insertIdentity.run(
      nameLower,
      tickerUpper,
      identityHash,
      mint,
      creator,
      Date.now()
    );
  }
}