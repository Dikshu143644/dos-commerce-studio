import { Hono } from 'hono';
import type { Env, EmailRequest } from '../types';
import { sendEmail } from '../services/email';
import { renderOrderConfirmation, type OrderConfirmationData } from '../templates/emails/order-confirmation';
import { renderLowStockAlert, type LowStockAlertData } from '../templates/emails/low-stock-alert';
import { renderPaymentReminder, type PaymentReminderData } from '../templates/emails/payment-reminder';

const email = new Hono<{ Bindings: Env }>();

email.post('/email/send', async (c) => {
  try {
    const body = await c.req.json<EmailRequest>();
    const { to, subject, template, data } = body;

    if (!to || !template) {
      return c.json({ error: 'to and template are required' }, 400);
    }

    let html: string;

    switch (template) {
      case 'order-confirmation':
        html = renderOrderConfirmation(data as unknown as OrderConfirmationData);
        break;
      case 'low-stock-alert':
        html = renderLowStockAlert(data as unknown as LowStockAlertData);
        break;
      case 'payment-reminder':
        html = renderPaymentReminder(data as unknown as PaymentReminderData);
        break;
      default:
        return c.json({ error: `Unknown template: ${template}` }, 400);
    }

    const result = await sendEmail(c.env, {
      to,
      subject: subject || `StockFlow - ${template}`,
      html,
    });

    if (!result.success) {
      return c.json({ error: result.error }, 500);
    }

    return c.json({ success: true, id: result.id });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMsg }, 500);
  }
});

export default email;
