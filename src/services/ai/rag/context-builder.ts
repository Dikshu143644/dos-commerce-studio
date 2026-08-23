import { supabase } from '@/lib/supabase';

/**
 * Build inventory context by querying products, warehouses, and stock movements
 * relevant to the user's query keywords.
 */
export async function buildInventoryContext(
  keywords: string[]
): Promise<Record<string, unknown>> {
  const context: Record<string, unknown> = {};

  // Get summary stats
  const { data: products, count: productCount } = await supabase
    .from('products')
    .select('id, name, sku, quantity, min_stock_level, reorder_point, unit_price', { count: 'exact' })
    .eq('is_active', true)
    .limit(10);

  context['total_products'] = productCount ?? 0;

  // Get low stock items
  const { data: lowStock } = await supabase
    .from('products')
    .select('id, name, sku, quantity, reorder_point, min_stock_level')
    .eq('is_active', true)
    .not('reorder_point', 'is', null)
    .limit(20);

  const lowStockItems = (lowStock || []).filter(
    (p) => p.quantity !== null && p.reorder_point !== null && p.quantity <= p.reorder_point
  );
  context['low_stock_count'] = lowStockItems.length;
  context['low_stock_items'] = lowStockItems.slice(0, 5);

  // Get warehouses
  const { data: warehouses } = await supabase
    .from('warehouses')
    .select('id, name, code, capacity, current_stock')
    .eq('is_active', true);

  context['warehouses'] = warehouses || [];

  // If keywords mention specific product, search for it
  const productKeywords = keywords.filter(
    (k) => !['stock', 'inventory', 'warehouse', 'product', 'low'].includes(k)
  );
  if (productKeywords.length > 0) {
    const searchTerm = productKeywords[0];
    const { data: matchedProducts } = await supabase
      .from('products')
      .select('id, name, sku, quantity, unit_price, cost_price')
      .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
      .limit(5);

    context['matched_products'] = matchedProducts || [];
  }

  // Recent stock movements
  const { data: movements } = await supabase
    .from('stock_movements')
    .select('id, product_id, movement_type, quantity, reference_number, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  context['recent_movements'] = movements || [];
  context['sample_products'] = products || [];

  return context;
}

/**
 * Build sales context by querying customers, deals, and sales orders.
 */
export async function buildSalesContext(
  keywords: string[]
): Promise<Record<string, unknown>> {
  const context: Record<string, unknown> = {};

  // Get deal pipeline summary
  const { data: deals } = await supabase
    .from('deals')
    .select('id, title, stage, value, probability, expected_close')
    .eq('is_active', true);

  const totalPipeline = (deals || []).reduce((sum, d) => sum + (d.value || 0), 0);
  const weightedPipeline = (deals || []).reduce(
    (sum, d) => sum + (d.value || 0) * ((d.probability || 0) / 100),
    0
  );

  context['total_deals'] = (deals || []).length;
  context['pipeline_value'] = totalPipeline;
  context['weighted_pipeline'] = weightedPipeline;
  context['deals_by_stage'] = groupByField(deals || [], 'stage');

  // Get recent sales orders
  const { data: salesOrders, count: orderCount } = await supabase
    .from('sales_orders')
    .select('id, customer_id, status, total_amount, order_number, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(10);

  context['total_orders'] = orderCount ?? 0;
  context['recent_orders'] = salesOrders || [];

  // If keywords mention specific customer
  const customerKeywords = keywords.filter(
    (k) => !['customer', 'deal', 'sale', 'order', 'pipeline', 'revenue'].includes(k)
  );
  if (customerKeywords.length > 0) {
    const searchTerm = customerKeywords[0];
    const { data: matchedCustomers } = await supabase
      .from('customers')
      .select('id, name, email, customer_type, total_orders, total_spent')
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .limit(5);

    context['matched_customers'] = matchedCustomers || [];
  }

  return context;
}

/**
 * Build procurement context by querying suppliers and purchase orders.
 */
export async function buildProcurementContext(
  keywords: string[]
): Promise<Record<string, unknown>> {
  const context: Record<string, unknown> = {};

  // Get purchase order summary
  const { data: purchaseOrders, count: poCount } = await supabase
    .from('purchase_orders')
    .select('id, supplier_id, status, total_amount, expected_delivery, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(10);

  context['total_purchase_orders'] = poCount ?? 0;
  context['recent_purchase_orders'] = purchaseOrders || [];

  // Get pending POs
  const { data: pendingPOs } = await supabase
    .from('purchase_orders')
    .select('id, supplier_id, status, total_amount, expected_delivery')
    .in('status', ['pending', 'approved', 'ordered'])
    .order('expected_delivery', { ascending: true });

  context['pending_orders'] = pendingPOs || [];
  context['pending_total'] = (pendingPOs || []).reduce(
    (sum, po) => sum + (po.total_amount || 0),
    0
  );

  // Get suppliers
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name, contact_name, email, rating')
    .eq('is_active', true)
    .order('rating', { ascending: false })
    .limit(10);

  context['top_suppliers'] = suppliers || [];

  // Search for specific supplier if mentioned
  const supplierKeywords = keywords.filter(
    (k) => !['supplier', 'purchase', 'po', 'order', 'procurement', 'delivery'].includes(k)
  );
  if (supplierKeywords.length > 0) {
    const searchTerm = supplierKeywords[0];
    const { data: matchedSuppliers } = await supabase
      .from('suppliers')
      .select('id, name, contact_name, email, phone, rating')
      .or(`name.ilike.%${searchTerm}%,contact_name.ilike.%${searchTerm}%`)
      .limit(5);

    context['matched_suppliers'] = matchedSuppliers || [];
  }

  return context;
}

/**
 * Build finance context by querying invoices, payments, and revenue data.
 */
export async function buildFinanceContext(
  keywords: string[]
): Promise<Record<string, unknown>> {
  const context: Record<string, unknown> = {};

  // Get invoice summary
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, total_amount, status, due_date, paid_amount, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  const totalInvoiced = (invoices || []).reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalPaid = (invoices || []).reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);
  const overdueInvoices = (invoices || []).filter(
    (inv) => inv.status === 'overdue' || (inv.status !== 'paid' && new Date(inv.due_date) < new Date())
  );

  context['total_invoiced'] = totalInvoiced;
  context['total_paid'] = totalPaid;
  context['outstanding'] = totalInvoiced - totalPaid;
  context['overdue_count'] = overdueInvoices.length;
  context['overdue_invoices'] = overdueInvoices.slice(0, 5);

  // Get recent payments
  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount, payment_method, payment_date, created_at')
    .order('payment_date', { ascending: false })
    .limit(10);

  context['recent_payments'] = payments || [];
  context['recent_payment_total'] = (payments || []).reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );

  // Revenue from sales orders
  const { data: completedOrders } = await supabase
    .from('sales_orders')
    .select('total_amount, created_at')
    .eq('status', 'completed');

  const totalRevenue = (completedOrders || []).reduce(
    (sum, o) => sum + (o.total_amount || 0),
    0
  );
  context['total_revenue'] = totalRevenue;

  // Search for specific amounts or terms
  void keywords; // keywords used for context routing, all finance data loaded

  return context;
}

/**
 * Build CRM context by querying leads, activities, and customer interactions.
 */
export async function buildCRMContext(
  keywords: string[]
): Promise<Record<string, unknown>> {
  const context: Record<string, unknown> = {};

  // Get leads summary
  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, email, status, source, score, assigned_to, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  const leadsByStatus = groupByField(leads || [], 'status');
  const hotLeads = (leads || []).filter((l) => (l.score || 0) >= 70);

  context['total_leads'] = (leads || []).length;
  context['leads_by_status'] = leadsByStatus;
  context['hot_leads'] = hotLeads.slice(0, 5);

  // Get recent activities
  const { data: activities } = await supabase
    .from('activities')
    .select('id, entity_type, activity_type, title, description, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  context['recent_activities'] = activities || [];

  // Get customer stats
  const { data: customers, count: customerCount } = await supabase
    .from('customers')
    .select('id, name, customer_type, total_orders, total_spent', { count: 'exact' })
    .order('total_spent', { ascending: false })
    .limit(10);

  context['total_customers'] = customerCount ?? 0;
  context['top_customers'] = customers || [];

  // If specific lead or customer mentioned
  const crmKeywords = keywords.filter(
    (k) => !['lead', 'customer', 'crm', 'deal', 'contact', 'activity'].includes(k)
  );
  if (crmKeywords.length > 0) {
    const searchTerm = crmKeywords[0];
    const { data: matchedLeads } = await supabase
      .from('leads')
      .select('id, name, email, status, score, source')
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .limit(5);

    context['matched_leads'] = matchedLeads || [];
  }

  return context;
}

/**
 * Helper to group array items by a field value.
 */
function groupByField<T extends Record<string, unknown>>(
  items: T[],
  field: string
): Record<string, number> {
  return items.reduce((acc, item) => {
    const key = String(item[field] || 'unknown');
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
