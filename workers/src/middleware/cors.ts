import { cors } from 'hono/cors';
import type { Env } from '../types';
import type { MiddlewareHandler } from 'hono';

export function corsMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const corsOrigin = c.env.CORS_ORIGIN || '';
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:4173',
      ...corsOrigin.split(',').map((o) => o.trim()).filter(Boolean),
    ];

    const handler = cors({
      origin: allowedOrigins,
      allowHeaders: ['Content-Type', 'Authorization', 'X-Client-Info', 'Accept'],
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      exposeHeaders: ['Content-Length'],
      maxAge: 86400,
      credentials: true,
    });

    return handler(c, next);
  };
}
