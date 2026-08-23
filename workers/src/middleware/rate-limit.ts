import type { Context, Next } from 'hono';
import type { Env } from '../types';

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_SECONDS = 60;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export async function rateLimitMiddleware(
  c: Context<{ Bindings: Env }>,
  next: Next
): Promise<Response | void> {
  const userId = c.get('userId');
  if (!userId) {
    // If no userId (unauthenticated), skip rate limiting
    await next();
    return;
  }

  const kv = c.env.RATE_LIMIT;
  const key = `rate_limit:${userId}`;
  const now = Math.floor(Date.now() / 1000);

  try {
    const existing = await kv.get(key, 'json') as RateLimitEntry | null;

    if (!existing || now > existing.resetAt) {
      // New window
      const entry: RateLimitEntry = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_SECONDS };
      await kv.put(key, JSON.stringify(entry), { expirationTtl: RATE_LIMIT_WINDOW_SECONDS });
      await next();
      return;
    }

    if (existing.count >= RATE_LIMIT_MAX) {
      return c.json(
        { error: 'Rate limit exceeded. Maximum 30 requests per minute.' },
        429
      );
    }

    // Increment count
    const updated: RateLimitEntry = { count: existing.count + 1, resetAt: existing.resetAt };
    const ttl = Math.max(existing.resetAt - now, 1);
    await kv.put(key, JSON.stringify(updated), { expirationTtl: ttl });

    await next();
  } catch {
    // If KV fails, allow the request through
    await next();
  }
}
