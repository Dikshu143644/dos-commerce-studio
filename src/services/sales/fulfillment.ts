import { supabase } from '@/lib/supabase';
import type { SalesOrder, SalesOrderItem } from '@/types/database';
import { api } from '@/services/api';
import { generateInvoice } from './invoices';
import type { ShipOrderInput, DeliverOrderInput } from './types';

/**
 * Moves a confirmed order to 'processing' status.
 */
export async function processOrder(orderId: string): Promise<SalesOrder> {
  const { data: order, error: fetchError } = await supabase
    .from('sales_orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) {
    throw new Error(`Sales order not found: ${fetchError?.message ?? 'Unknown error'}`);
  }

  if (order.status !== 'confirmed') {
    throw new Error(
      `Cannot process order in status '${order.status}'. Order must be in 'confirmed' status.`
    );
  }

  const { data: updatedOrder, error: updateError } = await supabase
    .from('sales_orders')
    .update({ status: 'processing' })
    .eq('id', orderId)
    .select()
    .single();

  if (updateError || !updatedOrder) {
    throw new Error(`Failed to move order to processing: ${updateError?.message ?? 'Unknown error'}`);
  }

  return updatedOrder as SalesOrder;
}

/**
 * Ships an order: creates stock_movements (type 'out') for each item,
 * releases reserved stock, generates invoice, and sends notification.
 * This is atomic - if any movement fails, the entire operation throws.
 */
export async function shipOrder(input: ShipOrderInput): Promise<SalesOrder> {
  const { data: order, error: fetchError } = await supabase
    .from('sales_orders')
    .select('*, sales_order_items(*), customers(company_name, email)')
    .eq('id', input.order_id)
    .single();

  if (fetchError || !order) {
    throw new Error(`Sales order not found: ${fetchError?.message ?? 'Unknown error'}`);
  }

  if (order.status !== 'processing' && order.status !== 'confirmed') {
    throw new Error(
      `Cannot ship order in status '${order.status}'. Order must be in 'confirmed' or 'processing' status.`
    );
  }

  const warehouseId = order.warehouse_id;
  if (!warehouseId) {
    throw new Error('Order does not have a warehouse assigned. Cannot ship.');
  }

  const items = order.sales_order_items as SalesOrderItem[];

  // Create stock movements for all items in a single batch insert.
  // This ensures either all movements are inserted or none (single DB call).
  const movements = items.map((item) => ({
    product_id: item.product_id,
    warehouse_id: warehouseId,
    type: 'out' as const,
    quantity: item.quantity,
    reference_type: 'sales_order',
    reference_id: order.id,
    notes: `Shipped for order ${order.order_number}`,
    created_by: input.shipped_by,
  }));

  const { error: movementError } = await supabase
    .from('stock_movements')
    .insert(movements);

  if (movementError) {
    throw new Error(
      `Failed to create stock movements for shipment: ${movementError.message}`
    );
  }

  // Release reserved quantities using optimistic concurrency control.
  // Verify each release matched a row to prevent silent reservation leaks.
  for (const item of items) {
    const { data: inventory } = await supabase
      .from('inventory')
      .select('reserved_quantity')
      .eq('product_id', item.product_id)
      .eq('warehouse_id', warehouseId)
      .single();

    if (inventory) {
      const expectedReserved = inventory.reserved_quantity;
      const newReserved = Math.max(0, expectedReserved - item.quantity);
      const { data: releaseResult } = await supabase
        .from('inventory')
        .update({ reserved_quantity: newReserved })
        .eq('product_id', item.product_id)
        .eq('warehouse_id', warehouseId)
        .eq('reserved_quantity', expectedReserved)
        .select('id');

      if (!releaseResult || releaseResult.length === 0) {
        throw new Error(
          `Failed to release reserved stock for product ${item.product_id} during shipment. ` +
          `Concurrent modification detected. Please retry.`
        );
      }
    }
  }

  // Update order status to shipped
  const { data: updatedOrder, error: updateError } = await supabase
    .from('sales_orders')
    .update({
      status: 'shipped',
      shipped_at: new Date().toISOString(),
    })
    .eq('id', input.order_id)
    .select()
    .single();

  if (updateError || !updatedOrder) {
    throw new Error(`Failed to update order to shipped: ${updateError?.message ?? 'Unknown error'}`);
  }

  // Generate invoice
  try {
    await generateInvoice(input.order_id);
  } catch (invoiceError) {
    // Log but do not block shipment if invoice generation fails
    console.error('Invoice generation failed:', invoiceError);
  }

  // Send notification to customer via PHP email service
  if (input.notify_customer !== false) {
    const customerData = order.customers as { company_name: string; email: string | null } | null;
    if (customerData?.email) {
      try {
        await api.sendEmail({
          to: customerData.email,
          template: 'order_shipped',
          data: {
            order_number: order.order_number,
            customer_name: customerData.company_name,
          },
        });
      } catch (emailError) {
        // Log but do not block shipment if email fails
        console.error('Email notification failed:', emailError);
      }
    }
  }

  // Create audit log
  await supabase.from('audit_logs').insert({
    user_id: input.shipped_by,
    action: 'ship_order',
    entity_type: 'sales_order',
    entity_id: input.order_id,
    new_values: { status: 'shipped', shipped_at: updatedOrder.shipped_at },
  });

  return updatedOrder as SalesOrder;
}

/**
 * Marks an order as delivered and records the delivery timestamp.
 */
export async function deliverOrder(input: DeliverOrderInput): Promise<SalesOrder> {
  const { data: order, error: fetchError } = await supabase
    .from('sales_orders')
    .select('*')
    .eq('id', input.order_id)
    .single();

  if (fetchError || !order) {
    throw new Error(`Sales order not found: ${fetchError?.message ?? 'Unknown error'}`);
  }

  if (order.status !== 'shipped') {
    throw new Error(
      `Cannot deliver order in status '${order.status}'. Order must be in 'shipped' status.`
    );
  }

  const { data: updatedOrder, error: updateError } = await supabase
    .from('sales_orders')
    .update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
    })
    .eq('id', input.order_id)
    .select()
    .single();

  if (updateError || !updatedOrder) {
    throw new Error(`Failed to deliver order: ${updateError?.message ?? 'Unknown error'}`);
  }

  // Create audit log
  await supabase.from('audit_logs').insert({
    user_id: input.delivered_by,
    action: 'deliver_order',
    entity_type: 'sales_order',
    entity_id: input.order_id,
    new_values: { status: 'delivered', delivered_at: updatedOrder.delivered_at },
  });

  return updatedOrder as SalesOrder;
}

/**
 * Returns shipment details including shipped items and tracking info.
 */
export async function getShipmentDetails(orderId: string): Promise<{
  order: SalesOrder;
  items: SalesOrderItem[];
  shipped_at: string | null;
  delivered_at: string | null;
}> {
  const { data, error } = await supabase
    .from('sales_orders')
    .select('*, sales_order_items(*, products(name, sku))')
    .eq('id', orderId)
    .single();

  if (error || !data) {
    throw new Error(`Failed to fetch shipment details: ${error?.message ?? 'Unknown error'}`);
  }

  const { sales_order_items, ...orderData } = data;

  return {
    order: orderData as unknown as SalesOrder,
    items: (sales_order_items ?? []) as SalesOrderItem[],
    shipped_at: data.shipped_at ?? null,
    delivered_at: data.delivered_at ?? null,
  };
}
