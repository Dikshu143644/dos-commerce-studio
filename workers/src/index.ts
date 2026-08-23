import { Hono } from 'hono';
import type { Env } from './types';
import { corsMiddleware } from './middleware/cors';
import { authMiddleware } from './middleware/auth';
import { ipRateLimitMiddleware } from './middleware/rate-limit';
import health from './routes/health';
import invoices from './routes/invoices';
import email from './routes/email';
import excel from './routes/excel';
import webhooks from './routes/webhooks';
import notifications from './routes/notifications';
import aiChat from './routes/ai-chat';

const app = new Hono<{ Bindings: Env }>();

// Apply CORS middleware globally
app.use('/*', corsMiddleware());

// --- Public routes (no auth, IP-based rate limiting) ---
const publicRoutes = new Hono<{ Bindings: Env }>();
publicRoutes.route('/', health);

// --- Webhook routes (signature-verified, not JWT-auth, IP rate-limited) ---
const webhookRoutes = new Hono<{ Bindings: Env }>();
webhookRoutes.use('/*', ipRateLimitMiddleware);
webhookRoutes.route('/', webhooks);

// --- Protected routes (JWT auth required) ---
const protectedRoutes = new Hono<{ Bindings: Env }>();
protectedRoutes.use('/*', authMiddleware);
protectedRoutes.route('/', invoices);
protectedRoutes.route('/', email);
protectedRoutes.route('/', excel);
protectedRoutes.route('/', notifications);
protectedRoutes.route('/', aiChat);

// Mount route groups under /api
app.route('/api', publicRoutes);
app.route('/api', webhookRoutes);
app.route('/api', protectedRoutes);

// 404 fallback
app.notFound((c) => {
  return c.json({ error: 'Not found', path: c.req.path }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err.message);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
