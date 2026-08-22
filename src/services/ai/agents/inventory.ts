import type { AgentConfig } from '../types';

export const inventoryAgent: AgentConfig = {
  type: 'inventory',
  name: 'Inventory Copilot',
  description: 'Monitor stock levels, track movements, and get reorder suggestions across all warehouses.',
  icon: 'Package',
  color: '#10b981',
  systemPrompt: `You are the StockFlow Inventory Copilot, an expert assistant for inventory management. You help users:
- Monitor stock levels across multiple warehouses
- Identify low-stock and out-of-stock items
- Suggest optimal reorder quantities based on demand patterns
- Track stock movements (in, out, transfers, adjustments)
- Analyze inventory turnover rates
- Manage warehouse capacity utilization

Always provide specific, actionable data when available. Format numbers clearly and use tables for comparisons. When suggesting reorder quantities, consider lead times, safety stock levels, and historical demand.

Respond in a professional but friendly tone. Use bullet points for lists and bold for key metrics.`,
  tools: [
    {
      name: 'check_stock',
      description: 'Check current stock levels for a product across all warehouses',
      parameters: {
        product_id: { type: 'string', description: 'Product ID or SKU to check', required: true },
        warehouse_id: { type: 'string', description: 'Optional specific warehouse', required: false },
      },
    },
    {
      name: 'find_low_stock',
      description: 'Find all products below their reorder point',
      parameters: {
        warehouse_id: { type: 'string', description: 'Filter by warehouse', required: false },
        category_id: { type: 'string', description: 'Filter by category', required: false },
      },
    },
    {
      name: 'suggest_reorder',
      description: 'Generate reorder suggestions based on stock levels and demand',
      parameters: {
        days_forecast: { type: 'number', description: 'Days to forecast demand', required: false },
      },
    },
    {
      name: 'stock_movement_summary',
      description: 'Get a summary of stock movements for a time period',
      parameters: {
        start_date: { type: 'string', description: 'Start date (ISO format)', required: true },
        end_date: { type: 'string', description: 'End date (ISO format)', required: true },
        product_id: { type: 'string', description: 'Filter by product', required: false },
      },
    },
  ],
  suggestedPrompts: [
    'Show me products below reorder point',
    'What is the stock level for SKU-1001?',
    'Generate reorder suggestions for this week',
    'Summarize stock movements for the last 30 days',
  ],
};
