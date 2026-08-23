import { supabase } from '@/lib/supabase';
import type { GoodsReceivedNote, GRNItem } from '@/types/database';
import type { ReceiveItemsInput } from './types';
import { createMovement } from './movements';

/**
 * Receives items against a purchase order (full or partial).
 * - Validates PO status is 'confirmed' or 'partially_received'
 * - Creates a Goods Received Note (GRN)
 * - For each item: creates stock_movement (type: 'in'), updates purchase_order_items.received_quantity
 * - Updates PO status to 'received' or 'partially_received' based on totals
 */
export async function receiveItems(
  input: ReceiveItemsInput
): Promise<GoodsReceivedNote & { items: GRNItem[] }> {
  // Validate PO status
  const { data: po, error: poError } = await supabase
    .from('purchase_orders')
    .select('id, status, po_number')
    .eq('id', input.purchase_order_id)
    .single();

  if (poError || !po) {
    throw new Error(`Purchase order not found: ${input.purchase_order_id}`);
  }

  if (po.status !== 'confirmed' && po.status !== 'partially_received') {
    throw new Error(
      `Cannot receive items for PO with status: ${po.status}. Must be 'confirmed' or 'partially_received'.`
    );
  }

  // Generate GRN number
  const { data: grnNumber, error: grnSeqError } = await supabase.rpc('generate_grn_number');

  if (grnSeqError) {
    throw new Error(`Failed to generate GRN number: ${grnSeqError.message}`);
  }

  // Create the GRN record
  const { data: grn, error: grnError } = await supabase
    .from('goods_received_notes')
    .insert({
      grn_number: grnNumber as string,
      purchase_order_id: input.purchase_order_id,
      warehouse_id: input.warehouse_id,
      received_by: input.received_by,
      supplier_invoice_number: input.supplier_invoice_number ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (grnError) {
    throw new Error(`Failed to create GRN: ${grnError.message}`);
  }

  const grnItems: GRNItem[] = [];

  // Process each item
  for (const item of input.items) {
    // Create GRN item record
    const { data: grnItem, error: grnItemError } = await supabase
      .from('grn_items')
      .insert({
        grn_id: grn.id,
        purchase_order_item_id: item.purchase_order_item_id,
        product_id: item.product_id,
        quantity_received: item.quantity_received,
        quantity_rejected: item.quantity_rejected ?? 0,
        rejection_reason: item.rejection_reason ?? null,
        batch_number: item.batch_number ?? null,
        expiry_date: item.expiry_date ?? null,
      })
      .select()
      .single();

    if (grnItemError) {
      throw new Error(`Failed to create GRN item: ${grnItemError.message}`);
    }

    grnItems.push(grnItem as GRNItem);

    // Create stock movement (type: 'in') for received quantity
    if (item.quantity_received > 0) {
      await createMovement({
        product_id: item.product_id,
        warehouse_id: input.warehouse_id,
        type: 'in',
        quantity: item.quantity_received,
        reference_type: 'purchase_order',
        reference_id: input.purchase_order_id,
        notes: `Received via GRN ${grnNumber} from PO ${po.po_number}`,
        created_by: input.received_by,
      });
    }

    // Update received_quantity on the purchase order item
    const { data: poItem, error: poItemFetchError } = await supabase
      .from('purchase_order_items')
      .select('received_quantity')
      .eq('id', item.purchase_order_item_id)
      .single();

    if (poItemFetchError || !poItem) {
      throw new Error(`PO item not found: ${item.purchase_order_item_id}`);
    }

    const newReceivedQty = poItem.received_quantity + item.quantity_received;

    const { error: poItemUpdateError } = await supabase
      .from('purchase_order_items')
      .update({ received_quantity: newReceivedQty })
      .eq('id', item.purchase_order_item_id);

    if (poItemUpdateError) {
      throw new Error(`Failed to update PO item received quantity: ${poItemUpdateError.message}`);
    }
  }

  // Determine if PO is fully or partially received
  const { data: allPoItems, error: allPoItemsError } = await supabase
    .from('purchase_order_items')
    .select('quantity, received_quantity')
    .eq('purchase_order_id', input.purchase_order_id);

  if (allPoItemsError) {
    throw new Error(`Failed to fetch PO items: ${allPoItemsError.message}`);
  }

  const isFullyReceived = (allPoItems ?? []).every(
    (item) => item.received_quantity >= item.quantity
  );

  const newPOStatus = isFullyReceived ? 'received' : 'partially_received';

  const { error: poUpdateError } = await supabase
    .from('purchase_orders')
    .update({ status: newPOStatus })
    .eq('id', input.purchase_order_id);

  if (poUpdateError) {
    throw new Error(`Failed to update PO status: ${poUpdateError.message}`);
  }

  // Log audit event
  await supabase.rpc('log_audit_event', {
    p_user_id: input.received_by,
    p_action: 'receive_goods',
    p_entity_type: 'goods_received_note',
    p_entity_id: grn.id,
    p_new_values: {
      grn_number: grnNumber,
      purchase_order_id: input.purchase_order_id,
      items_count: input.items.length,
      po_status: newPOStatus,
    },
  });

  return {
    ...(grn as GoodsReceivedNote),
    items: grnItems,
  };
}

/**
 * Returns all GRNs for a specific purchase order.
 */
export async function getReceivingHistory(
  purchaseOrderId: string
): Promise<GoodsReceivedNote[]> {
  const { data, error } = await supabase
    .from('goods_received_notes')
    .select('*')
    .eq('purchase_order_id', purchaseOrderId)
    .order('received_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch receiving history: ${error.message}`);
  }

  return (data ?? []) as GoodsReceivedNote[];
}

/**
 * Assembles GRN data structure for PDF generation (via PHP backend).
 */
export async function createGoodsReceivedNote(
  grnId: string
): Promise<GoodsReceivedNote & { items: GRNItem[] }> {
  const { data: grn, error: grnError } = await supabase
    .from('goods_received_notes')
    .select('*')
    .eq('id', grnId)
    .single();

  if (grnError || !grn) {
    throw new Error(`GRN not found: ${grnId}`);
  }

  const { data: items, error: itemsError } = await supabase
    .from('grn_items')
    .select('*')
    .eq('grn_id', grnId);

  if (itemsError) {
    throw new Error(`Failed to fetch GRN items: ${itemsError.message}`);
  }

  return {
    ...(grn as GoodsReceivedNote),
    items: (items ?? []) as GRNItem[],
  };
}
