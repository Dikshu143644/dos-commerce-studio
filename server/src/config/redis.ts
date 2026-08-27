import { Redis } from 'ioredis';
import { env } from './env.js';

let redisClient: Redis | null = null;

try {
  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // don't infinite retry if offline
    lazyConnect: true,
  });

  redisClient.connect().catch(() => {
    // Gracefully handle local dev without active redis
    redisClient = null;
  });
} catch {
  redisClient = null;
}

export { redisClient };
