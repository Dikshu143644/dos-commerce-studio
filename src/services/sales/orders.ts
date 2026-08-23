import { supabase } from '@/lib/supabase';
import type { SalesOrder, SalesOrderItem } from '@/types/database';
import type {
  CreateSalesOrderInput,
  ConfirmOrderInput,
  CancelOrderInput,
  DuplicateOrderInput,
  OrderTotals,
  StockAvailability,
  SalesOrderFilters,
  PaginatedResponse,
} from './types';

/**
 * Creates a new sales order in draft status with auto-generated order number.
 * Inserts both the order header and line items.
 */
export async function createSalesOrder(
  input: CreateSalesOrderInput
): Promise<SalesOrder> {
  // Calculate totals from items
  const totals = calculateOrderTotals(
    input.items.map((item) => ({
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount ?? 0,
    }))
  );

  // Insert the sales order (DB generates order_number via default/trigger)
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .insert({
      customer_id: input.customer_id,
      warehouse_id: input.warehouse_id,
      status: 'draft',
      subtotal: totals.subtotal,
      tax_amount: totals.tax_amount,
      discount_amount: totals.discount_amount,
      total_amount: totals.total_amount,
      shipping_address: input.shipping_address ?? null,
      notes: input.notes ?? null,
      created_by: input.created_by,
    })
    .select()
    .single();

  if (orderError || !order) {
    throw new Error(`Failed to create sales order: ${orderError?.message ?? 'Unknown error'}`);
  }

  // Insert order items
  const orderItems = input.items.map((item) => {
    const discount = item.discount ?? 0;
    const lineTotal = item.quantity * item.unit_price * (1 - discount / 100);
    return {
      sales_order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: discount,
      total: Math.round(lineTotal * 100) / 100,
    };
  });

  const { error: itemsError } = await supabase
    .from('sales_order_items')
    .insert(orderItems);

  if (itemsError) {
    throw new Error(`Failed to create order items: ${itemsError.message}`);
  }

  return order as SalesOrder;
}

/**
 * Confirms a draft order after validating stock availability.
 * Reserves stock by incrementing reserved_quantity for each item in the warehouse.
 * Throws with details if any item has insufficient stock.
 */
export async function confirmOrder(input: ConfirmOrderInput): Promise<SalesOrder> {
  // Fetch the order with items
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .select('*, sales_order_items(*)')
    .eq('id', input.order_id)
    .single();

  if (orderError || !order) {
    throw new Error(`Sales order not found: ${orderError?.message ?? 'Unknown error'}`);
  }

  if (order.status !== 'draft') {
    throw new Error(`Cannot confirm order in status '${order.status}'. Order must be in 'draft' status.`);
  }

  const warehouseId = order.warehouse_id;
  if (!warehouseId) {
    throw new Error('Order does not have a warehouse assigned. Cannot confirm.');
  }

  const items = order.sales_order_items as SalesOrderItem[];

  // Check stock availability for all items
  const insufficientItems: StockAvailability[] = [];

  for (const item of items) {
    const { data: inventory, error: invError } = await supabase
      .from('inventory')
      .select('quantity, reserved_quantity, products(name)')
      .eq('product_id', item.product_id)
      .eq('warehouse_id', warehouseId)
      .single();

    if (invError || !inventory) {
      insufficientItems.push({
        product_id: item.product_id,
        product_name: 'Unknown',
        warehouse_id: warehouseId,
        available_quantity: 0,
        requested_quantity: item.quantity,
        is_sufficient: false,
      });
      continue;
    }

    const available = inventory.quantity - inventory.reserved_quantity;
    const productData = inventory.products as unknown as { name: string } | null;

    if (available < item.quantity) {
      insufficientItems.push({
        product_id: item.product_id,
        product_name: productData?.name ?? 'Unknown',
        warehouse_id: warehouseId,
        available_quantity: available,
        requested_quantity: item.quantity,
        is_sufficient: false,
      });
    }
  }

  if (insufficientItems.length > 0) {
    const details = insufficientItems
      .map(
        (i) =>
          `${i.product_name}: available ${i.available_quantity}, requested ${i.requested_quantity}`
      )
      .join('; ');
    throw new Error(`Insufficient stock for items: ${details}`);
  }

  // Reserve stock for each item
  for (const item of items) {
    const { error: reserveError } = await supabase.rpc('increment_reserved_quantity', {
      p_product_id: item.product_id,
      p_warehouse_id: warehouseId,
      p_quantity: item.quantity,
    });

    // Fallback: direct update if RPC not available
    if (reserveError) {
      // Manual increment as fallback
      const { data: current } = await supabase
        .from('inventory')
        .select('reserved_quantity')
        .eq('product_id', item.product_id)
        .eq('warehouse_id', warehouseId)
        .single();

      if (current) {
        const { error: manualError } = await supabase
          .from('inventory')
          .update({ reserved_quantity: current.reserved_quantity + item.quantity })
          .eq('product_id', item.product_id)
          .eq('warehouse_id', warehouseId);

        if (manualError) {
          throw new Error(`Failed to reserve stock for product ${item.product_id}: ${manualError.message}`);
        }
      }
    }
  }

  // Transition order to confirmed
  const { data: updatedOrder, error: updateError } = await supabase
    .from('sales_orders')
    .update({ status: 'confirmed' })
    .eq('id', input.order_id)
    .select()
    .single();

  if (updateError || !updatedOrder) {
    throw new Error(`Failed to confirm order: ${updateError?.message ?? 'Unknown error'}`);
  }

  // Create audit log
  await supabase.from('audit_logs').insert({
    user_id: input.confirmed_by,
    action: 'confirm_order',
    entity_type: 'sales_order',
    entity_id: input.order_id,
    new_values: { status: 'confirmed' },
  });

  return updatedOrder as SalesOrder;
}

/**
 * Cancels an order and releases all reserved stock.
 * Creates an audit log for the cancellation.
 */
export async function cancelOrder(input: CancelOrderInput): Promise<SalesOrder> {
  // Fetch the order with items
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .select('*, sales_order_items(*)')
    .eq('id', input.order_id)
    .single();

  if (orderError || !order) {
    throw new Error(`Sales order not found: ${orderError?.message ?? 'Unknown error'}`);
  }

  if (order.status === 'cancelled') {
    throw new Error('Order is already cancelled.');
  }

  if (order.status === 'delivered' || order.status === 'shipped') {
    throw new Error(`Cannot cancel order in '${order.status}' status. Use returns instead.`);
  }

  const warehouseId = order.warehouse_id;
  const items = order.sales_order_items as SalesOrderItem[];

  // Release reserved stock if order was confirmed or processing
  if ((order.status === 'confirmed' || order.status === 'processing') && warehouseId) {
    for (const item of items) {
      const { data: current } = await supabase
        .from('inventory')
        .select('reserved_quantity')
        .eq('product_id', item.product_id)
        .eq('warehouse_id', warehouseId)
        .single();

      if (current) {
        const newReserved = Math.max(0, current.reserved_quantity - item.quantity);
        await supabase
          .from('inventory')
          .update({ reserved_quantity: newReserved })
          .eq('product_id', item.product_id)
          .eq('warehouse_id', warehouseId);
      }
    }
  }

  // Transition order to cancelled
  const { data: updatedOrder, error: updateError } = await supabase
    .from('sales_orders')
    .update({ status: 'cancelled' })
    .eq('id', input.order_id)
    .select()
    .single();

  if (updateError || !updatedOrder) {
    throw new Error(`Failed to cancel order: ${updateError?.message ?? 'Unknown error'}`);
  }

  // Create audit log
  await supabase.from('audit_logs').insert({
    user_id: input.cancelled_by,
    action: 'cancel_order',
    entity_type: 'sales_order',
    entity_id: input.order_id,
    new_values: { status: 'cancelled', reason: input.reason ?? null },
  });

  return updatedOrder as SalesOrder;
}

/**
 * Fetches a full sales order with line items, product details, and customer info.
 */
export async function getSalesOrderWithItems(orderId: string): Promise<
  SalesOrder & {
    items: (SalesOrderItem & { product: { name: string; sku: string } })[];
    customer: { company_name: string; email: string | null };
  }
> {
  const { data, error } = await supabase
    .from('sales_orders')
    .select(
      '*, sales_order_items(*, products(name, sku)), customers(company_name, email)'
    )
    .eq('id', orderId)
    .single();

  if (error || !data) {
    throw new Error(`Failed to fetch sales order: ${error?.message ?? 'Unknown error'}`);
  }

  const { sales_order_items, customers, ...orderData } = data;

  return {
    ...(orderData as unknown as SalesOrder),
    items: (sales_order_items ?? []).map((item: Record<string, unknown>) => ({
      ...(item as unknown as SalesOrderItem),
      product: item.products as { name: string; sku: string },
    })),
    customer: customers as { company_name: string; email: string | null },
  };
}

/**
 * Calculates order totals from line items.
 * Tax is computed at 18% (standard GST rate) on the subtotal after discounts.
 */
export function calculateOrderTotals(
  items: Array<{ quantity: number; unit_price: number; discount?: number }>
): OrderTotals {
  let subtotal = 0;
  let totalDiscount = 0;

  for (const item of items) {
    const lineGross = item.quantity * item.unit_price;
    const lineDiscount = lineGross * ((item.discount ?? 0) / 100);
    subtotal += lineGross - lineDiscount;
    totalDiscount += lineDiscount;
  }

  subtotal = Math.round(subtotal * 100) / 100;
  totalDiscount = Math.round(totalDiscount * 100) / 100;

  const taxAmount = Math.round(subtotal * 0.18 * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

  return {
    subtotal,
    tax_amount: taxAmount,
    discount_amount: totalDiscount,
    total_amount: totalAmount,
  };
}

/**
 * Duplicates an existing order as a new draft.
 */
export async function duplicateOrder(input: DuplicateOrderInput): Promise<SalesOrder> {
  const { data: sourceOrder, error: fetchError } = await supabase
    .from('sales_orders')
    .select('*, sales_order_items(*)')
    .eq('id', input.source_order_id)
    .single();

  if (fetchError || !sourceOrder) {
    throw new Error(`Source order not found: ${fetchError?.message ?? 'Unknown error'}`);
  }

  const items = (sourceOrder.sales_order_items ?? []) as SalesOrderItem[];

  return createSalesOrder({
    customer_id: sourceOrder.customer_id,
    warehouse_id: sourceOrder.warehouse_id,
    shipping_address: sourceOrder.shipping_address ?? undefined,
    notes: sourceOrder.notes ?? undefined,
    created_by: input.created_by,
    items: items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount_percent ?? 0,
    })),
  });
}

/**
 * Returns paginated sales orders with optional filters.
 */
export async function getSalesOrders(
  filters: SalesOrderFilters = {}
): Promise<PaginatedResponse<SalesOrder>> {
  const page = filters.page ?? 1;
  const pageSize = filters.page_size ?? 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('sales_orders')
    .select('*, customers(company_name)', { count: 'exact' });

  if (filters.customer_id) {
    query = query.eq('customer_id', filters.customer_id);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.warehouse_id) {
    query = query.eq('warehouse_id', filters.warehouse_id);
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
    throw new Error(`Failed to fetch sales orders: ${error.message}`);
  }

  const totalCount = count ?? 0;

  return {
    data: (data ?? []) as SalesOrder[],
    count: totalCount,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(totalCount / pageSize),
  };
}
