/**
 * Shared Redis client singleton.
 *
 * Returns null when REDIS_URL is not explicitly set in the environment.
 * Callers (redis-cache.ts) treat null as "Redis disabled" and skip to DB fallback.
 * This prevents spurious connection attempts in environments without Redis.
 */

import Redis from 'ioredis';

let _client: Redis | null = null;
let _initialized = false;

export function getRedisClient(): Redis | null {
    if (_initialized) return _client;
    _initialized = true;

    const url = process.env.REDIS_URL?.trim();
    if (!url) {
        // REDIS_URL not configured — Redis is disabled; all cache calls fall back to DB.
        return null;
    }

    const client = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        reconnectOnError: () => false,
    });

    client.on('error', (err: Error) => {
        // Intentionally not rethrowing — Redis is optional infrastructure.
        console.error('[redis-client] connection error:', err.message);
    });

    _client = client;
    return _client;
}
