import { supabase } from '@/lib/supabase';
import type { SalesReturn, SalesReturnItem } from '@/types/database';
import type {
  InitiateReturnInput,
  ApproveReturnInput,
  ReturnFilters,
  PaginatedResponse,
} from './types';

/**
 * Initiates a sales return against a delivered order.
 * Creates the return header and individual return items.
 * Generates a return number via the database function.
 */
export async function initiateReturn(input: InitiateReturnInput): Promise<SalesReturn> {
  // Validate the order exists and is in a deliverable state
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .select('*')
    .eq('id', input.sales_order_id)
    .single();

  if (orderError || !order) {
    throw new Error(`Sales order not found: ${orderError?.message ?? 'Unknown error'}`);
  }

  if (order.status !== 'delivered') {
    throw new Error(
      `Cannot initiate return for order in status '${order.status}'. Order must be 'delivered'.`
    );
  }

  // Generate return number via DB function
  const { data: returnNumberResult, error: seqError } = await supabase.rpc(
    'generate_return_number'
  );

  const returnNumber = seqError
    ? `RET-${String(Date.now()).slice(-6)}`
    : (returnNumberResult as string);

  // Calculate total refund amount from items
  let totalRefund = 0;
  for (const item of input.items) {
    const { data: orderItem } = await supabase
      .from('sales_order_items')
      .select('unit_price, discount')
      .eq('id', item.sales_order_item_id)
      .single();

    if (orderItem) {
      const discount = (orderItem.discount as number) ?? 0;
      const linePrice = item.quantity * orderItem.unit_price * (1 - discount / 100);
      totalRefund += linePrice;
    }
  }

  totalRefund = Math.round(totalRefund * 100) / 100;

  // Insert the return header
  const { data: salesReturn, error: returnError } = await supabase
    .from('sales_returns')
    .insert({
      return_number: returnNumber,
      sales_order_id: input.sales_order_id,
      customer_id: input.customer_id,
      status: 'pending',
      reason: input.reason,
      total_refund_amount: totalRefund,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (returnError || !salesReturn) {
    throw new Error(`Failed to create sales return: ${returnError?.message ?? 'Unknown error'}`);
  }

  // Insert return items
  const returnItems = input.items.map((item) => ({
    return_id: salesReturn.id,
    sales_order_item_id: item.sales_order_item_id,
    product_id: item.product_id,
    quantity: item.quantity,
    reason: item.reason ?? null,
    condition: item.condition ?? null,
  }));

  const { error: itemsError } = await supabase
    .from('sales_return_items')
    .insert(returnItems);

  if (itemsError) {
    throw new Error(`Failed to create return items: ${itemsError.message}`);
  }

  return salesReturn as SalesReturn;
}

/**
 * Approves a return, creates stock_movements (type 'return') for each returned item,
 * and updates inventory via the database trigger.
 * Stock is always restored to the warehouse from which the original order was shipped.
 */
export async function approveReturn(input: ApproveReturnInput): Promise<SalesReturn> {
  // Fetch the return with items
  const { data: salesReturn, error: fetchError } = await supabase
    .from('sales_returns')
    .select('*, sales_return_items(*)')
    .eq('id', input.return_id)
    .single();

  if (fetchError || !salesReturn) {
    throw new Error(`Sales return not found: ${fetchError?.message ?? 'Unknown error'}`);
  }

  if (salesReturn.status !== 'pending') {
    throw new Error(
      `Cannot approve return in status '${salesReturn.status}'. Return must be 'pending'.`
    );
  }

  // Look up the original sales order to get the warehouse_id
  // This ensures stock is returned to the same warehouse it was shipped from.
  const { data: originalOrder, error: orderError } = await supabase
    .from('sales_orders')
    .select('warehouse_id')
    .eq('id', salesReturn.sales_order_id)
    .single();

  if (orderError || !originalOrder) {
    throw new Error(`Original sales order not found: ${orderError?.message ?? 'Unknown error'}`);
  }

  const warehouseId = originalOrder.warehouse_id ?? input.warehouse_id;
  if (!warehouseId) {
    throw new Error('Cannot determine warehouse for stock restoration. Original order has no warehouse assigned.');
  }

  const returnItems = salesReturn.sales_return_items as SalesReturnItem[];

  // Create stock movements (type 'return') as a single batch insert
  const movements = returnItems.map((item) => ({
    product_id: item.product_id,
    warehouse_id: warehouseId,
    type: 'return' as const,
    quantity: item.quantity,
    reference_type: 'sales_return',
    reference_id: salesReturn.id,
    notes: `Return for order - ${salesReturn.return_number}`,
    created_by: input.approved_by,
  }));

  const { error: movementError } = await supabase
    .from('stock_movements')
    .insert(movements);

  if (movementError) {
    throw new Error(
      `Failed to create return stock movements: ${movementError.message}`
    );
  }

  // Update return status to approved
  const { data: updatedReturn, error: updateError } = await supabase
    .from('sales_returns')
    .update({
      status: 'approved',
      approved_by: input.approved_by,
      completed_at: new Date().toISOString(),
    })
    .eq('id', input.return_id)
    .select()
    .single();

  if (updateError || !updatedReturn) {
    throw new Error(`Failed to approve return: ${updateError?.message ?? 'Unknown error'}`);
  }

  // Create audit log
  await supabase.from('audit_logs').insert({
    user_id: input.approved_by,
    action: 'approve_return',
    entity_type: 'sales_return',
    entity_id: input.return_id,
    new_values: { status: 'approved', approved_by: input.approved_by },
  });

  return updatedReturn as SalesReturn;
}

/**
 * Returns paginated return history with optional filters.
 */
export async function getReturnHistory(
  filters: ReturnFilters = {}
): Promise<PaginatedResponse<SalesReturn>> {
  const page = filters.page ?? 1;
  const pageSize = filters.page_size ?? 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('sales_returns')
    .select('*, customers(company_name)', { count: 'exact' });

  if (filters.sales_order_id) {
    query = query.eq('sales_order_id', filters.sales_order_id);
  }
  if (filters.customer_id) {
    query = query.eq('customer_id', filters.customer_id);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch return history: ${error.message}`);
  }

  const totalCount = count ?? 0;

  return {
    data: (data ?? []) as SalesReturn[],
    count: totalCount,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(totalCount / pageSize),
  };
}
