import { jwtVerify } from 'jose';
import type { Context, Next } from 'hono';
import type { Env } from '../types';

// Extend Hono context variables
declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
    userEmail: string;
  }
}

export async function authMiddleware(
  c: Context<{ Bindings: Env }>,
  next: Next
): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const secret = new TextEncoder().encode(c.env.SUPABASE_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      issuer: `${c.env.SUPABASE_URL}/auth/v1`,
    });

    const userId = payload.sub;
    if (!userId) {
      return c.json({ error: 'Invalid token: missing subject' }, 401);
    }

    c.set('userId', userId);
    c.set('userEmail', (payload.email as string) || '');

    await next();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Token verification failed';
    return c.json({ error: `Authentication failed: ${message}` }, 401);
  }
}
