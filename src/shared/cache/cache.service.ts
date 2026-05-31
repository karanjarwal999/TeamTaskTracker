import { getRedis } from '@/config/redis';
import { logger } from '@/shared/utils/logger';

// The only module (besides config/redis.ts bootstrap) that talks to ioredis directly.
export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    const raw = await getRedis().get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await getRedis().set(key, JSON.stringify(value), 'EX', ttlSeconds);
  },

  // Single-key invalidation. Same error-policy as invalidatePattern: never throw,
  // log on failure (the caller already committed its mutation).
  async invalidate(key: string): Promise<void> {
    try {
      await getRedis().del(key);
    } catch (err) {
      logger.warn('cache.invalidate.failed', {
        key,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  },

  async invalidatePattern(pattern: string): Promise<void> {
    const redis = getRedis();
    try {
      let cursor = '0';
      const matched: string[] = [];
      do {
        const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
        cursor = next;
        if (keys.length) matched.push(...keys);
      } while (cursor !== '0');
      if (matched.length) await redis.del(...matched);
    } catch (err) {
      logger.warn('cache.invalidate.failed', {
        pattern,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  },
};
