import { Hono } from 'hono';
import type { Env } from './types';
import { corsMiddleware } from './middleware/cors';
import { authMiddleware } from './middleware/auth';
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

// Public routes (no auth required)
app.route('/api', health);

// Webhook routes (authenticated by signature, not JWT)
app.post('/api/payments/webhook', async (c, next) => {
  // Skip JWT auth for webhooks - they use signature verification
  await next();
});

// Apply auth middleware to all other /api routes
app.use('/api/*', async (c, next) => {
  // Skip auth for health check and payment webhooks
  const path = c.req.path;
  if (path === '/api/health' || path === '/api/payments/webhook') {
    await next();
    return;
  }
  return authMiddleware(c, next);
});

// Protected routes
app.route('/api', invoices);
app.route('/api', email);
app.route('/api', excel);
app.route('/api', webhooks);
app.route('/api', notifications);
app.route('/api', aiChat);

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
