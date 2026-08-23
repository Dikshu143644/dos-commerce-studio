export interface OrderConfirmationData {
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  estimatedDelivery: string;
}

export function renderOrderConfirmation(data: OrderConfirmationData): string {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">&#8377;${item.price.toFixed(2)}</td>
      </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: #1e1e1e; padding: 24px; border-radius: 8px 8px 0 0;">
      <h1 style="color: #10b981; margin: 0; font-size: 24px;">StockFlow</h1>
    </div>
    <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: 3px solid #10b981;">
      <h2 style="color: #1f2937; margin: 0 0 8px;">Order Confirmed!</h2>
      <p style="color: #6b7280; margin: 0 0 24px;">Hi ${data.customerName}, your order has been confirmed.</p>
      
      <div style="background: #f3f4f6; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
        <p style="margin: 0; color: #374151;"><strong>Order #:</strong> ${data.orderNumber}</p>
        <p style="margin: 4px 0 0; color: #374151;"><strong>Date:</strong> ${data.orderDate}</p>
        <p style="margin: 4px 0 0; color: #374151;"><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Item</th>
            <th style="padding: 8px 12px; text-align: center; font-size: 12px; color: #6b7280; text-transform: uppercase;">Qty</th>
            <th style="padding: 8px 12px; text-align: right; font-size: 12px; color: #6b7280; text-transform: uppercase;">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <div style="text-align: right; padding: 12px; background: #ecfdf5; border-radius: 6px;">
        <strong style="color: #065f46; font-size: 18px;">Total: &#8377;${data.total.toFixed(2)}</strong>
      </div>
    </div>
    <div style="padding: 16px; text-align: center; color: #9ca3af; font-size: 12px;">
      <p>StockFlow Enterprise Inventory & CRM</p>
    </div>
  </div>
</body>
</html>`;
}
