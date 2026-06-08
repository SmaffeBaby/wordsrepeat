import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis() {
  const url = process.env.REDIS_URL;

  if (!url) {
    return null;
  }

  if (!redis) {
    redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true
    });
  }

  return redis;
}

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const client = getRedis();
    if (!client) return null;
    if (client.status === "wait") await client.connect();
    const cached = await client.get(key);
    return cached ? (JSON.parse(cached) as T) : null;
  } catch {
    return null;
  }
}

export async function writeCache(key: string, value: unknown, ttlSeconds = 30) {
  try {
    const client = getRedis();
    if (!client) return;
    if (client.status === "wait") await client.connect();
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // The app remains usable when Redis is down.
  }
}

export async function deleteCache(...keys: string[]) {
  try {
    const client = getRedis();
    if (!client || keys.length === 0) return;
    if (client.status === "wait") await client.connect();
    await client.del(keys);
  } catch {
    // Cache invalidation failures should not block user actions.
  }
}
