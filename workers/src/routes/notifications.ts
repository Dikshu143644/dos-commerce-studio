import { Hono } from 'hono';
import type { Env, NotificationRequest } from '../types';

const notifications = new Hono<{ Bindings: Env }>();

// Send WhatsApp/SMS notification
notifications.post('/notifications/whatsapp', async (c) => {
  try {
    const body = await c.req.json<NotificationRequest>();
    const { type, to, template, data } = body;

    if (!to || !template) {
      return c.json({ error: 'to and template are required' }, 400);
    }

    // Build message content based on template
    let message = '';
    switch (template) {
      case 'order_shipped':
        message = `Hi ${data.customerName || 'Customer'}, your order #${data.orderNumber || ''} has been shipped! Track it here: ${data.trackingUrl || '#'}`;
        break;
      case 'payment_received':
        message = `Hi ${data.customerName || 'Customer'}, we received your payment of Rs. ${data.amount || 0} for invoice ${data.invoiceNumber || ''}. Thank you!`;
        break;
      case 'low_stock_alert':
        message = `Alert: ${data.productName || 'Product'} (SKU: ${data.sku || ''}) is running low. Current stock: ${data.currentStock || 0}. Please reorder.`;
        break;
      case 'delivery_reminder':
        message = `Reminder: PO #${data.poNumber || ''} from ${data.supplierName || 'supplier'} is expected today. Please confirm receipt.`;
        break;
      default:
        message = `StockFlow notification: ${JSON.stringify(data)}`;
    }

    // In production, integrate with MSG91 or Twilio
    // For now, log and return success
    const notificationType = type || 'whatsapp';
    console.log(`[${notificationType.toUpperCase()}] To: ${to}, Message: ${message}`);

    // MSG91 / Twilio integration placeholder
    // const response = await fetch('https://api.msg91.com/api/v5/whatsapp/...', {...});

    return c.json({
      success: true,
      type: notificationType,
      to,
      template,
      message,
      status: 'queued',
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMsg }, 500);
  }
});

export default notifications;
