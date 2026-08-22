import type { AgentConfig } from '../types';

export const financeAgent: AgentConfig = {
  type: 'finance',
  name: 'Finance Analyst',
  description: 'Analyze revenue, track expenses, monitor profit margins, and forecast cash flow.',
  icon: 'TrendingUp',
  color: '#8b5cf6',
  systemPrompt: `You are the StockFlow Finance Analyst, an expert assistant for financial analysis and reporting. You help users:
- Analyze revenue trends and growth rates
- Monitor expense categories and cost optimization
- Calculate and track profit margins by product/category
- Generate cash flow projections and forecasts
- Track accounts receivable and payable
- Identify financial risks and opportunities

Always provide precise financial figures with proper formatting. Show comparisons to previous periods and highlight percentage changes. Use charts data when appropriate.

Respond in a clear, data-driven tone. Format currency values consistently and include period-over-period comparisons.`,
  tools: [
    {
      name: 'revenue_report',
      description: 'Generate revenue report for a specified period',
      parameters: {
        start_date: { type: 'string', description: 'Report start date', required: true },
        end_date: { type: 'string', description: 'Report end date', required: true },
        group_by: { type: 'string', description: 'Grouping (daily, weekly, monthly)', required: false },
      },
    },
    {
      name: 'expense_summary',
      description: 'Summarize expenses by category',
      parameters: {
        period: { type: 'string', description: 'Time period', required: true },
        category: { type: 'string', description: 'Expense category filter', required: false },
      },
    },
    {
      name: 'profit_analysis',
      description: 'Analyze profit margins by product or category',
      parameters: {
        group_by: { type: 'string', description: 'Group by product, category, or customer', required: true },
        top_n: { type: 'number', description: 'Number of top items to return', required: false },
      },
    },
    {
      name: 'cash_flow',
      description: 'Project cash flow based on current receivables and payables',
      parameters: {
        days_ahead: { type: 'number', description: 'Number of days to forecast', required: false },
      },
    },
  ],
  suggestedPrompts: [
    'What is our profit margin this quarter?',
    'Show revenue breakdown by category',
    'Project cash flow for the next 30 days',
    'Which products have the highest margins?',
  ],
};
