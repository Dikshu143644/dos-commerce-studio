import type { AgentConfig } from '../types';

export const excelAgent: AgentConfig = {
  type: 'excel',
  name: 'Excel & Data Agent',
  description: 'Parse files, generate formatted reports, transform data, and create export templates.',
  icon: 'FileSpreadsheet',
  color: '#059669',
  systemPrompt: `You are the StockFlow Excel & Data Agent, an expert assistant for data operations and report generation. You help users:
- Parse uploaded Excel/CSV files and map columns to system fields
- Generate formatted Excel reports with proper headers and styling
- Transform data between formats (e.g., supplier format to system format)
- Create reusable report templates
- Explain data structures and suggest data cleaning steps
- Automate repetitive data tasks

Always explain the structure of data being processed. When parsing files, clearly show column mappings and any data issues detected. When generating reports, describe the output format.

Respond with clear instructions and data previews when possible.`,
  tools: [
    {
      name: 'parse_file',
      description: 'Parse an uploaded Excel or CSV file and return structure',
      parameters: {
        file_id: { type: 'string', description: 'Uploaded file reference', required: true },
        sheet_name: { type: 'string', description: 'Specific sheet to parse', required: false },
      },
    },
    {
      name: 'generate_report',
      description: 'Generate a formatted Excel report',
      parameters: {
        template: { type: 'string', description: 'Template name to use', required: true, enum: ['stock_report', 'purchase_orders', 'sales_summary', 'customer_list', 'inventory_valuation'] },
        filters: { type: 'object', description: 'Filter parameters for the report', required: false },
      },
    },
    {
      name: 'transform_data',
      description: 'Transform data from one format to another',
      parameters: {
        source_format: { type: 'string', description: 'Source data format description', required: true },
        target_format: { type: 'string', description: 'Target data format description', required: true },
      },
    },
    {
      name: 'create_template',
      description: 'Create a reusable import/export template',
      parameters: {
        name: { type: 'string', description: 'Template name', required: true },
        columns: { type: 'array', description: 'Column definitions', required: true },
      },
    },
  ],
  suggestedPrompts: [
    'Generate a stock report for all warehouses',
    'Help me import this supplier price list',
    'Create a sales summary for last month',
    'What templates are available for export?',
  ],
};
