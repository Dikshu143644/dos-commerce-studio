import { Hono } from 'hono';
import type { Env, PaymentWebhookPayload } from '../types';
import { createSupabaseClient } from '../services/supabase';

const webhooks = new Hono<{ Bindings: Env }>();

/**
 * Verify Razorpay webhook signature using HMAC-SHA256.
 * The signature header is 'X-Razorpay-Signature'.
 * The expected signature is HMAC-SHA256(request body, webhook secret).
 */
async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  // Constant-time comparison to prevent timing attacks
  if (expectedSignature.length !== signature.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < expectedSignature.length; i++) {
    mismatch |= expectedSignature.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Verify Razorpay payment signature for client-side verification.
 * Signature = HMAC-SHA256(order_id + '|' + payment_id, key_secret).
 */
async function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const message = `${orderId}|${paymentId}`;
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  // Constant-time comparison
  if (expectedSignature.length !== signature.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < expectedSignature.length; i++) {
    mismatch |= expectedSignature.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

// Create Razorpay order
webhooks.post('/payments/create-order', async (c) => {
  try {
    const body = await c.req.json<{ amount: number; currency?: string; receipt: string; notes?: Record<string, string> }>();
    const { amount, currency = 'INR', receipt, notes } = body;

    if (!amount || !receipt) {
      return c.json({ error: 'amount and receipt are required' }, 400);
    }

    // In production, this would call Razorpay API
    // For now, return a mock order structure
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const supabase = createSupabaseClient(c.env);
    await supabase.from('payment_orders').insert({
      order_id: orderId,
      amount,
      currency,
      receipt,
      notes: notes || {},
      status: 'created',
      created_by: c.get('userId'),
    });

    return c.json({
      success: true,
      order: {
        id: orderId,
        amount,
        currency,
        receipt,
        status: 'created',
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMsg }, 500);
  }
});

// Verify payment
webhooks.post('/payments/verify', async (c) => {
  try {
    const body = await c.req.json<{
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }>();

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return c.json({ error: 'All payment verification fields are required' }, 400);
    }

    // Verify signature using HMAC-SHA256: sign(order_id + '|' + payment_id, secret)
    const secret = c.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return c.json({ error: 'Payment verification not configured' }, 503);
    }

    const isValid = await verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      secret
    );

    if (!isValid) {
      return c.json({ error: 'Invalid payment signature' }, 400);
    }

    const supabase = createSupabaseClient(c.env);
    await supabase
      .from('payment_orders')
      .update({
        payment_id: razorpay_payment_id,
        signature: razorpay_signature,
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('order_id', razorpay_order_id);

    return c.json({
      success: true,
      verified: true,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMsg }, 500);
  }
});

// Payment webhook (from Razorpay)
webhooks.post('/payments/webhook', async (c) => {
  try {
    // Verify webhook signature before processing
    const signature = c.req.header('X-Razorpay-Signature');
    const secret = c.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return c.json({ error: 'Webhook verification not configured' }, 503);
    }

    if (!signature) {
      return c.json({ error: 'Missing webhook signature' }, 401);
    }

    // Read raw body for signature verification
    const rawBody = await c.req.text();
    const isValid = await verifyWebhookSignature(rawBody, signature, secret);

    if (!isValid) {
      return c.json({ error: 'Invalid webhook signature' }, 401);
    }

    const payload = JSON.parse(rawBody) as PaymentWebhookPayload;
    const { event, payload: eventPayload } = payload;

    const supabase = createSupabaseClient(c.env);

    switch (event) {
      case 'payment.captured': {
        const payment = eventPayload.payment?.entity;
        if (payment) {
          await supabase
            .from('payment_orders')
            .update({
              status: 'captured',
              payment_method: payment.method,
              captured_at: new Date().toISOString(),
            })
            .eq('order_id', payment.order_id);
        }
        break;
      }
      case 'payment.failed': {
        const payment = eventPayload.payment?.entity;
        if (payment) {
          await supabase
            .from('payment_orders')
            .update({ status: 'failed' })
            .eq('order_id', payment.order_id);
        }
        break;
      }
      case 'order.paid': {
        const order = eventPayload.order?.entity;
        if (order) {
          await supabase
            .from('payment_orders')
            .update({ status: 'paid' })
            .eq('order_id', order.id);
        }
        break;
      }
      default:
        // Log unknown event
        console.warn(`Unhandled webhook event: ${event}`);
    }

    // Always return 200 to acknowledge receipt
    return c.json({ success: true, event });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook processing error:', errorMsg);
    // Still return 200 to prevent retries on our processing errors
    return c.json({ success: false, error: errorMsg }, 200);
  }
});

export default webhooks;
