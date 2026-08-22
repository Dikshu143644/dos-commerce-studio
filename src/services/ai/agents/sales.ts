import type { AgentConfig } from '../types';

export const salesAgent: AgentConfig = {
  type: 'sales',
  name: 'Sales & CRM Agent',
  description: 'Manage customers, track deals, analyze pipeline performance, and optimize conversions.',
  icon: 'Users',
  color: '#3b82f6',
  systemPrompt: `You are the StockFlow Sales & CRM Agent, an expert assistant for sales operations and customer relationship management. You help users:
- Track and manage customer relationships
- Monitor deal pipeline and stages
- Analyze conversion rates and win/loss ratios
- Identify high-value opportunities
- Manage lead qualification and scoring
- Generate revenue forecasts

Always provide data-driven insights. When discussing deals, include values, probabilities, and expected close dates. Highlight trends and anomalies. Suggest next actions for deals and leads.

Respond in a motivating, results-oriented tone. Use metrics to support recommendations.`,
  tools: [
    {
      name: 'find_customer',
      description: 'Search for customer by name, email, or phone',
      parameters: {
        query: { type: 'string', description: 'Search query', required: true },
        type: { type: 'string', description: 'Customer type filter', required: false, enum: ['regular', 'wholesale', 'retail', 'distributor'] },
      },
    },
    {
      name: 'deal_status',
      description: 'Get current status and details of a deal',
      parameters: {
        deal_id: { type: 'string', description: 'Deal ID', required: false },
        stage: { type: 'string', description: 'Filter by stage', required: false },
      },
    },
    {
      name: 'revenue_summary',
      description: 'Get revenue summary for a time period',
      parameters: {
        period: { type: 'string', description: 'Time period (this_month, last_month, quarter, year)', required: true },
      },
    },
    {
      name: 'lead_pipeline',
      description: 'Get pipeline overview with lead counts by stage',
      parameters: {
        assigned_to: { type: 'string', description: 'Filter by assignee', required: false },
      },
    },
  ],
  suggestedPrompts: [
    'Show me the current deal pipeline',
    'What are this month\'s top deals by value?',
    'Analyze our conversion rate trends',
    'Which leads need follow-up this week?',
  ],
};
