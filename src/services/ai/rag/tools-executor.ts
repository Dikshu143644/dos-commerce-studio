import { supabase } from '@/lib/supabase';
import type { ToolDefinition, ToolResult } from './types';

/**
 * Registry of all available RAG tools.
 * Each tool queries Supabase for specific business data and returns structured results.
 */
export const toolDefinitions: ToolDefinition[] = [
  {
    name: 'check_stock',
    description: 'Check current stock level for a specific product by name or SKU',
    parameters: {
      product: { type: 'string', description: 'Product name or SKU to look up', required: true },
    },
    handler: checkStock,
  },
  {
    name: 'find_low_stock',
    description: 'Find all products that are below their reorder point',
    parameters: {
      warehouse_id: { type: 'string', description: 'Optional warehouse ID to filter by' },
      limit: { type: 'number', description: 'Maximum number of results (default: 10)' },
    },
    handler: findLowStock,
  },
  {
    name: 'get_customer_info',
    description: 'Get detailed information about a customer by name or email',
    parameters: {
      search: { type: 'string', description: 'Customer name or email to search', required: true },
    },
    handler: getCustomerInfo,
  },
  {
    name: 'get_order_status',
    description: 'Get the status and details of a sales order by order number or ID',
    parameters: {
      order_ref: { type: 'string', description: 'Order number or order ID', required: true },
    },
    handler: getOrderStatus,
  },
  {
    name: 'get_revenue_summary',
    description: 'Get revenue summary with totals and breakdowns',
    parameters: {
      period: { type: 'string', description: 'Time period: today, week, month, quarter, year', enum: ['today', 'week', 'month', 'quarter', 'year'] },
    },
    handler: getRevenueSummary,
  },
  {
    name: 'get_pipeline_value',
    description: 'Get the total value of deals in the sales pipeline by stage',
    parameters: {
      stage: { type: 'string', description: 'Optional stage filter (e.g., qualification, proposal, negotiation, closed_won)' },
    },
    handler: getPipelineValue,
  },
  {
    name: 'search_products',
    description: 'Search for products by name, SKU, or category',
    parameters: {
      query: { type: 'string', description: 'Search query for product name or SKU', required: true },
      limit: { type: 'number', description: 'Maximum results (default: 10)' },
    },
    handler: searchProducts,
  },
  {
    name: 'get_overdue_invoices',
    description: 'Get all invoices that are past their due date and not fully paid',
    parameters: {
      limit: { type: 'number', description: 'Maximum results (default: 10)' },
    },
    handler: getOverdueInvoices,
  },
  {
    name: 'get_lead_details',
    description: 'Get detailed information about a lead by name or email',
    parameters: {
      search: { type: 'string', description: 'Lead name or email to search', required: true },
    },
    handler: getLeadDetails,
  },
  {
    name: 'get_supplier_performance',
    description: 'Get supplier performance metrics including rating and order history',
    parameters: {
      supplier_name: { type: 'string', description: 'Supplier name to look up' },
      limit: { type: 'number', description: 'Maximum suppliers to return (default: 5)' },
    },
    handler: getSupplierPerformance,
  },
];

/**
 * Execute a tool by name with given parameters.
 * Logs execution to ai_tool_executions table.
 */
export async function executeTool(
  toolName: string,
  params: Record<string, unknown>,
  conversationId?: string,
  userId?: string
): Promise<ToolResult> {
  const startTime = Date.now();
  const tool = toolDefinitions.find((t) => t.name === toolName);

  if (!tool) {
    return {
      tool_name: toolName,
      success: false,
      data: null,
      error: `Unknown tool: ${toolName}`,
      execution_time_ms: Date.now() - startTime,
    };
  }

  let result: ToolResult;
  try {
    result = await tool.handler(params);
  } catch (error) {
    result = {
      tool_name: toolName,
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      execution_time_ms: Date.now() - startTime,
    };
  }

  // Log execution to database
  if (conversationId && userId) {
    await logToolExecution({
      conversation_id: conversationId,
      user_id: userId,
      tool_name: toolName,
      tool_input: params,
      tool_output: result.data,
      execution_time_ms: result.execution_time_ms,
      success: result.success,
      error_message: result.error,
    });
  }

  return result;
}

/**
 * Log a tool execution to the ai_tool_executions table.
 */
async function logToolExecution(execution: {
  conversation_id: string;
  user_id: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output: Record<string, unknown> | null;
  execution_time_ms: number;
  success: boolean;
  error_message?: string;
}): Promise<void> {
  const { error } = await supabase.from('ai_tool_executions').insert(execution);
  if (error) {
    console.warn('[RAG] Failed to log tool execution:', error);
  }
}

// ─── Tool Implementations ────────────────────────────────────────────

async function checkStock(params: Record<string, unknown>): Promise<ToolResult> {
  const startTime = Date.now();
  const product = String(params['product'] || '');

  const { data, error } = await supabase
    .from('products')
    .select('id, name, sku, quantity, min_stock_level, reorder_point, warehouse_id, unit_price')
    .or(`name.ilike.%${product}%,sku.ilike.%${product}%`)
    .limit(5);

  if (error) {
    return { tool_name: 'check_stock', success: false, data: null, error: error.message, execution_time_ms: Date.now() - startTime };
  }

  return {
    tool_name: 'check_stock',
    success: true,
    data: { products: data || [], count: (data || []).length },
    execution_time_ms: Date.now() - startTime,
  };
}

async function findLowStock(params: Record<string, unknown>): Promise<ToolResult> {
  const startTime = Date.now();
  const limit = Number(params['limit']) || 10;
  const warehouseId = params['warehouse_id'] as string | undefined;

  let query = supabase
    .from('products')
    .select('id, name, sku, quantity, reorder_point, min_stock_level, warehouse_id')
    .eq('is_active', true)
    .not('reorder_point', 'is', null);

  if (warehouseId) {
    query = query.eq('warehouse_id', warehouseId);
  }

  const { data, error } = await query.limit(50);

  if (error) {
    return { tool_name: 'find_low_stock', success: false, data: null, error: error.message, execution_time_ms: Date.now() - startTime };
  }

  const lowStockItems = (data || [])
    .filter((p) => p.quantity !== null && p.reorder_point !== null && p.quantity <= p.reorder_point)
    .slice(0, limit);

  return {
    tool_name: 'find_low_stock',
    success: true,
    data: { items: lowStockItems, count: lowStockItems.length },
    execution_time_ms: Date.now() - startTime,
  };
}

async function getCustomerInfo(params: Record<string, unknown>): Promise<ToolResult> {
  const startTime = Date.now();
  const search = String(params['search'] || '');

  const { data, error } = await supabase
    .from('customers')
    .select('id, name, email, phone, customer_type, total_orders, total_spent, created_at')
    .or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    .limit(5);

  if (error) {
    return { tool_name: 'get_customer_info', success: false, data: null, error: error.message, execution_time_ms: Date.now() - startTime };
  }

  return {
    tool_name: 'get_customer_info',
    success: true,
    data: { customers: data || [], count: (data || []).length },
    execution_time_ms: Date.now() - startTime,
  };
}

async function getOrderStatus(params: Record<string, unknown>): Promise<ToolResult> {
  const startTime = Date.now();
  const orderRef = String(params['order_ref'] || '');

  const { data, error } = await supabase
    .from('sales_orders')
    .select('id, order_number, customer_id, status, total_amount, created_at, updated_at')
    .or(`order_number.ilike.%${orderRef}%,id.eq.${orderRef}`)
    .limit(5);

  if (error) {
    // Retry with just order_number if UUID parsing failed
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('sales_orders')
      .select('id, order_number, customer_id, status, total_amount, created_at, updated_at')
      .ilike('order_number', `%${orderRef}%`)
      .limit(5);

    if (fallbackError) {
      return { tool_name: 'get_order_status', success: false, data: null, error: fallbackError.message, execution_time_ms: Date.now() - startTime };
    }

    return {
      tool_name: 'get_order_status',
      success: true,
      data: { orders: fallbackData || [], count: (fallbackData || []).length },
      execution_time_ms: Date.now() - startTime,
    };
  }

  return {
    tool_name: 'get_order_status',
    success: true,
    data: { orders: data || [], count: (data || []).length },
    execution_time_ms: Date.now() - startTime,
  };
}

async function getRevenueSummary(params: Record<string, unknown>): Promise<ToolResult> {
  const startTime = Date.now();
  const period = String(params['period'] || 'month');

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const { data: orders, error } = await supabase
    .from('sales_orders')
    .select('total_amount, status, created_at')
    .gte('created_at', startDate.toISOString());

  if (error) {
    return { tool_name: 'get_revenue_summary', success: false, data: null, error: error.message, execution_time_ms: Date.now() - startTime };
  }

  const completedOrders = (orders || []).filter((o) => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const allOrdersTotal = (orders || []).reduce((sum, o) => sum + (o.total_amount || 0), 0);

  return {
    tool_name: 'get_revenue_summary',
    success: true,
    data: {
      period,
      total_revenue: totalRevenue,
      total_orders_value: allOrdersTotal,
      completed_orders: completedOrders.length,
      total_orders: (orders || []).length,
      start_date: startDate.toISOString(),
    },
    execution_time_ms: Date.now() - startTime,
  };
}

async function getPipelineValue(params: Record<string, unknown>): Promise<ToolResult> {
  const startTime = Date.now();
  const stage = params['stage'] as string | undefined;

  let query = supabase
    .from('deals')
    .select('id, title, stage, value, probability, expected_close')
    .eq('is_active', true);

  if (stage) {
    query = query.eq('stage', stage);
  }

  const { data, error } = await query;

  if (error) {
    return { tool_name: 'get_pipeline_value', success: false, data: null, error: error.message, execution_time_ms: Date.now() - startTime };
  }

  const deals = data || [];
  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const weightedValue = deals.reduce(
    (sum, d) => sum + (d.value || 0) * ((d.probability || 0) / 100),
    0
  );

  // Group by stage
  const byStage: Record<string, { count: number; value: number }> = {};
  for (const deal of deals) {
    const s = deal.stage || 'unknown';
    if (!byStage[s]) byStage[s] = { count: 0, value: 0 };
    byStage[s].count++;
    byStage[s].value += deal.value || 0;
  }

  return {
    tool_name: 'get_pipeline_value',
    success: true,
    data: {
      total_value: totalValue,
      weighted_value: weightedValue,
      deal_count: deals.length,
      by_stage: byStage,
    },
    execution_time_ms: Date.now() - startTime,
  };
}

async function searchProducts(params: Record<string, unknown>): Promise<ToolResult> {
  const startTime = Date.now();
  const query = String(params['query'] || '');
  const limit = Number(params['limit']) || 10;

  const { data, error } = await supabase
    .from('products')
    .select('id, name, sku, quantity, unit_price, cost_price, is_active')
    .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
    .limit(limit);

  if (error) {
    return { tool_name: 'search_products', success: false, data: null, error: error.message, execution_time_ms: Date.now() - startTime };
  }

  return {
    tool_name: 'search_products',
    success: true,
    data: { products: data || [], count: (data || []).length },
    execution_time_ms: Date.now() - startTime,
  };
}

async function getOverdueInvoices(params: Record<string, unknown>): Promise<ToolResult> {
  const startTime = Date.now();
  const limit = Number(params['limit']) || 10;

  const { data, error } = await supabase
    .from('invoices')
    .select('id, sales_order_id, total_amount, paid_amount, status, due_date, created_at')
    .lt('due_date', new Date().toISOString())
    .neq('status', 'paid')
    .order('due_date', { ascending: true })
    .limit(limit);

  if (error) {
    return { tool_name: 'get_overdue_invoices', success: false, data: null, error: error.message, execution_time_ms: Date.now() - startTime };
  }

  const totalOverdue = (data || []).reduce(
    (sum, inv) => sum + ((inv.total_amount || 0) - (inv.paid_amount || 0)),
    0
  );

  return {
    tool_name: 'get_overdue_invoices',
    success: true,
    data: { invoices: data || [], count: (data || []).length, total_overdue: totalOverdue },
    execution_time_ms: Date.now() - startTime,
  };
}

async function getLeadDetails(params: Record<string, unknown>): Promise<ToolResult> {
  const startTime = Date.now();
  const search = String(params['search'] || '');

  const { data, error } = await supabase
    .from('leads')
    .select('id, name, email, phone, status, source, score, assigned_to, created_at')
    .or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    .limit(5);

  if (error) {
    return { tool_name: 'get_lead_details', success: false, data: null, error: error.message, execution_time_ms: Date.now() - startTime };
  }

  return {
    tool_name: 'get_lead_details',
    success: true,
    data: { leads: data || [], count: (data || []).length },
    execution_time_ms: Date.now() - startTime,
  };
}

async function getSupplierPerformance(params: Record<string, unknown>): Promise<ToolResult> {
  const startTime = Date.now();
  const supplierName = params['supplier_name'] as string | undefined;
  const limit = Number(params['limit']) || 5;

  let query = supabase
    .from('suppliers')
    .select('id, name, contact_name, email, phone, rating')
    .eq('is_active', true);

  if (supplierName) {
    query = query.ilike('name', `%${supplierName}%`);
  }

  const { data: suppliers, error } = await query
    .order('rating', { ascending: false })
    .limit(limit);

  if (error) {
    return { tool_name: 'get_supplier_performance', success: false, data: null, error: error.message, execution_time_ms: Date.now() - startTime };
  }

  // Get PO counts for each supplier
  const supplierIds = (suppliers || []).map((s) => s.id);
  const { data: poData } = await supabase
    .from('purchase_orders')
    .select('supplier_id, status, total_amount')
    .in('supplier_id', supplierIds.length > 0 ? supplierIds : ['none']);

  const supplierMetrics = (suppliers || []).map((supplier) => {
    const supplierPOs = (poData || []).filter((po) => po.supplier_id === supplier.id);
    const completedPOs = supplierPOs.filter((po) => po.status === 'completed' || po.status === 'received');
    const totalSpent = supplierPOs.reduce((sum, po) => sum + (po.total_amount || 0), 0);

    return {
      ...supplier,
      total_orders: supplierPOs.length,
      completed_orders: completedPOs.length,
      total_spent: totalSpent,
      completion_rate: supplierPOs.length > 0
        ? Math.round((completedPOs.length / supplierPOs.length) * 100)
        : 0,
    };
  });

  return {
    tool_name: 'get_supplier_performance',
    success: true,
    data: { suppliers: supplierMetrics, count: supplierMetrics.length },
    execution_time_ms: Date.now() - startTime,
  };
}
