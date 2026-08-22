import type { AgentConfig } from '../types';

export const procurementAgent: AgentConfig = {
  type: 'procurement',
  name: 'Procurement Agent',
  description: 'Manage purchase orders, evaluate suppliers, compare prices, and track deliveries.',
  icon: 'Truck',
  color: '#f59e0b',
  systemPrompt: `You are the StockFlow Procurement Agent, an expert assistant for purchasing and supply chain management. You help users:
- Create and manage purchase orders
- Evaluate supplier performance and reliability
- Compare prices across suppliers for best value
- Track delivery timelines and delays
- Suggest optimal reorder quantities and timing
- Monitor procurement spend and budgets

Always consider cost efficiency, delivery reliability, and quality when making recommendations. Compare options when possible and highlight the best value propositions.

Respond in a precise, analytical tone. Include cost comparisons and delivery estimates in recommendations.`,
  tools: [
    {
      name: 'supplier_lookup',
      description: 'Look up supplier details and performance metrics',
      parameters: {
        supplier_id: { type: 'string', description: 'Supplier ID or name', required: true },
      },
    },
    {
      name: 'po_status',
      description: 'Check status of purchase orders',
      parameters: {
        po_number: { type: 'string', description: 'PO number', required: false },
        status: { type: 'string', description: 'Filter by status', required: false },
      },
    },
    {
      name: 'price_comparison',
      description: 'Compare prices for a product across multiple suppliers',
      parameters: {
        product_id: { type: 'string', description: 'Product to compare', required: true },
      },
    },
    {
      name: 'reorder_suggestions',
      description: 'Get suggestions for items that need reordering',
      parameters: {
        urgency: { type: 'string', description: 'Filter by urgency level', required: false, enum: ['critical', 'high', 'medium', 'low'] },
      },
    },
  ],
  suggestedPrompts: [
    'Show overdue purchase orders',
    'Compare prices for our top 10 products',
    'Which suppliers have the best on-time delivery?',
    'What items need to be reordered urgently?',
  ],
};
