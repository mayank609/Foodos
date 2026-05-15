import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const SEARCH_TTL = 60 * 10; // 10 minutes

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(key);
    return data;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttl = SEARCH_TTL): Promise<void> {
  try {
    await redis.set(key, value, { ex: ttl });
  } catch {
    // Non-fatal — degrade gracefully without cache
  }
}

export async function invalidate(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch {
    // ignore
  }
}

export function searchCacheKey(query: string, city: string | null): string {
  return `search:${query.toLowerCase().trim()}:${city ?? 'any'}`;
}
