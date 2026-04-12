/**
 * Lightweight Redis cache helpers.
 *
 * When REDIS_URL is not set, getRedisClient() returns null and every operation
 * falls through directly to the fallback (DB query). No connection is attempted.
 *
 * When Redis is configured but unavailable, errors are swallowed and the
 * fallback is used — the application never crashes due to Redis being down.
 *
 * Logging convention:
 *   [redis-cache] HIT  <key>
 *   [redis-cache] MISS <key>
 *   [redis-cache] ERR  <key> <message>
 *   [redis-cache] SKIP (redis disabled)
 */

import { getRedisClient } from '@/shared/server/redis-client';

export async function withRedisCache<T>(
    key: string,
    ttl: number,
    fallback: () => Promise<T>,
): Promise<T> {
    const redis = getRedisClient();
    if (!redis) {
        console.log(`[redis-cache] SKIP (redis disabled) ${key}`);
        return fallback();
    }

    try {
        const cached = await redis.get(key);
        if (cached !== null) {
            console.log(`[redis-cache] HIT  ${key}`);
            return JSON.parse(cached) as T;
        }
        console.log(`[redis-cache] MISS ${key}`);
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[redis-cache] ERR  ${key} ${msg}`);
        return fallback();
    }

    const value = await fallback();

    try {
        await redis.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[redis-cache] ERR (set) ${key} ${msg}`);
    }

    return value;
}

export async function redisDelete(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    const redis = getRedisClient();
    if (!redis) return;

    try {
        await redis.del(...keys);
        for (const key of keys) {
            console.log(`[redis-cache] DEL  ${key}`);
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[redis-cache] ERR (del) ${keys.join(', ')} ${msg}`);
    }
}
