export interface LowStockAlertData {
  recipientName: string;
  items: Array<{
    name: string;
    sku: string;
    currentStock: number;
    reorderPoint: number;
    warehouse: string;
  }>;
  totalAlerts: number;
}

export function renderLowStockAlert(data: LowStockAlertData): string {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${item.sku}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <span style="color: #dc2626; font-weight: bold;">${item.currentStock}</span>
        </td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.reorderPoint}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${item.warehouse}</td>
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
    <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: 3px solid #f59e0b;">
      <div style="display: flex; align-items: center; margin-bottom: 16px;">
        <span style="font-size: 24px; margin-right: 8px;">&#9888;</span>
        <h2 style="color: #92400e; margin: 0;">Low Stock Alert</h2>
      </div>
      <p style="color: #6b7280; margin: 0 0 24px;">Hi ${data.recipientName}, ${data.totalAlerts} product(s) are below their reorder point.</p>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background: #fef3c7;">
            <th style="padding: 8px 12px; text-align: left; font-size: 11px; color: #92400e; text-transform: uppercase;">Product</th>
            <th style="padding: 8px 12px; text-align: left; font-size: 11px; color: #92400e; text-transform: uppercase;">SKU</th>
            <th style="padding: 8px 12px; text-align: center; font-size: 11px; color: #92400e; text-transform: uppercase;">Stock</th>
            <th style="padding: 8px 12px; text-align: center; font-size: 11px; color: #92400e; text-transform: uppercase;">Reorder Pt</th>
            <th style="padding: 8px 12px; text-align: left; font-size: 11px; color: #92400e; text-transform: uppercase;">Warehouse</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <a href="#" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
        View Inventory Dashboard
      </a>
    </div>
    <div style="padding: 16px; text-align: center; color: #9ca3af; font-size: 12px;">
      <p>StockFlow Enterprise Inventory & CRM</p>
    </div>
  </div>
</body>
</html>`;
}
