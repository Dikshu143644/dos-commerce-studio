export interface PaymentReminderData {
  customerName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  companyName: string;
}

export function renderPaymentReminder(data: PaymentReminderData): string {
  const urgencyColor = data.daysOverdue > 30 ? '#dc2626' : data.daysOverdue > 14 ? '#f59e0b' : '#6b7280';
  const urgencyLabel = data.daysOverdue > 30 ? 'URGENT' : data.daysOverdue > 14 ? 'OVERDUE' : 'REMINDER';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: #1e1e1e; padding: 24px; border-radius: 8px 8px 0 0;">
      <h1 style="color: #10b981; margin: 0; font-size: 24px;">StockFlow</h1>
    </div>
    <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: 3px solid ${urgencyColor};">
      <div style="margin-bottom: 16px;">
        <span style="background: ${urgencyColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">${urgencyLabel}</span>
      </div>
      <h2 style="color: #1f2937; margin: 0 0 8px;">Payment Reminder</h2>
      <p style="color: #6b7280; margin: 0 0 24px;">Dear ${data.customerName},</p>
      <p style="color: #374151; margin: 0 0 24px;">
        This is a reminder that invoice <strong>${data.invoiceNumber}</strong> is ${data.daysOverdue > 0 ? `${data.daysOverdue} days overdue` : 'due soon'}.
      </p>

      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
        <table style="width: 100%;">
          <tr>
            <td style="color: #6b7280; padding: 4px 0;">Invoice Number:</td>
            <td style="color: #1f2937; font-weight: bold; text-align: right;">${data.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="color: #6b7280; padding: 4px 0;">Amount Due:</td>
            <td style="color: #1f2937; font-weight: bold; text-align: right; font-size: 18px;">&#8377;${data.amount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="color: #6b7280; padding: 4px 0;">Due Date:</td>
            <td style="color: ${urgencyColor}; font-weight: bold; text-align: right;">${data.dueDate}</td>
          </tr>
        </table>
      </div>

      <p style="color: #374151; margin: 0 0 24px;">
        Please arrange payment at your earliest convenience. If you have already made this payment, please disregard this reminder.
      </p>

      <a href="#" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
        Pay Now
      </a>
    </div>
    <div style="padding: 16px; text-align: center; color: #9ca3af; font-size: 12px;">
      <p>${data.companyName}</p>
    </div>
  </div>
</body>
</html>`;
}
