/**
 * Pluggable distributed lock used when a cron job opts into
 * `{ distributed: true }`. Implementations typically use Redis `SET NX EX`
 * (or equivalent) so only one Nest process in a cluster runs the job.
 *
 * @publicApi
 */
export interface CronLocker {
  /**
   * Attempt to acquire a lock for `key` that expires after `ttlMs`.
   * @returns `true` if this instance should run the job; `false` to skip.
   */
  tryAcquire(key: string, ttlMs: number): Promise<boolean>;

  /**
   * Optionally release the lock early after the job finishes.
   * If omitted, the lock expires via TTL (crash-safe default).
   */
  release?(key: string): Promise<void>;
}
