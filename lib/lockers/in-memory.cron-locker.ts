import { CronLocker } from '../interfaces/cron-locker.interface.js';

interface LockEntry {
  expiresAt: number;
}

/**
 * Process-local locker for tests and single-instance apps.
 * Not suitable for multi-replica production deployments — use a Redis-backed
 * (or similar) `CronLocker` instead.
 *
 * @publicApi
 */
export class InMemoryCronLocker implements CronLocker {
  private readonly locks = new Map<string, LockEntry>();

  async tryAcquire(key: string, ttlMs: number): Promise<boolean> {
    const now = Date.now();
    const existing = this.locks.get(key);
    if (existing && existing.expiresAt > now) {
      return false;
    }
    this.locks.set(key, { expiresAt: now + ttlMs });
    return true;
  }

  async release(key: string): Promise<void> {
    this.locks.delete(key);
  }
}
