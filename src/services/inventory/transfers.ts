import { supabase } from '@/lib/supabase';
import type { StockTransfer, StockTransferItem } from '@/types/database';
import type {
  TransferRequest,
  TransferApproval,
  TransferRejection,
  TransferCompletion,
  TransferFilters,
  PaginatedResponse,
} from './types';
import { createMovement } from './movements';

/**
 * Initiates a new warehouse-to-warehouse transfer request.
 * Generates a unique transfer number and creates the transfer with 'pending' status.
 */
export async function initiateTransfer(
  request: TransferRequest
): Promise<StockTransfer & { items: StockTransferItem[] }> {
  // Generate transfer number via the database function
  const { data: transferNumberResult, error: seqError } = await supabase.rpc(
    'generate_transfer_number'
  );

  if (seqError) {
    throw new Error(`Failed to generate transfer number: ${seqError.message}`);
  }

  const transferNumber = transferNumberResult as string;

  // Create the transfer record
  const { data: transfer, error: transferError } = await supabase
    .from('stock_transfers')
    .insert({
      transfer_number: transferNumber,
      source_warehouse_id: request.source_warehouse_id,
      destination_warehouse_id: request.destination_warehouse_id,
      status: 'pending',
      requested_by: request.requested_by,
      notes: request.notes ?? null,
    })
    .select()
    .single();

  if (transferError) {
    throw new Error(`Failed to create transfer: ${transferError.message}`);
  }

  // Create transfer items
  const itemsToInsert = request.items.map((item) => ({
    transfer_id: transfer.id,
    product_id: item.product_id,
    requested_quantity: item.requested_quantity,
    transferred_quantity: 0,
    notes: item.notes ?? null,
  }));

  const { data: items, error: itemsError } = await supabase
    .from('stock_transfer_items')
    .insert(itemsToInsert)
    .select();

  if (itemsError) {
    throw new Error(`Failed to create transfer items: ${itemsError.message}`);
  }

  return {
    ...(transfer as StockTransfer),
    items: (items ?? []) as StockTransferItem[],
  };
}

/**
 * Approves a pending transfer after validating stock availability in the source warehouse.
 */
export async function approveTransfer(
  approval: TransferApproval
): Promise<StockTransfer> {
  // Fetch the transfer and its items
  const { data: transfer, error: fetchError } = await supabase
    .from('stock_transfers')
    .select('*')
    .eq('id', approval.transfer_id)
    .single();

  if (fetchError || !transfer) {
    throw new Error(`Transfer not found: ${approval.transfer_id}`);
  }

  if (transfer.status !== 'pending') {
    throw new Error(`Transfer cannot be approved. Current status: ${transfer.status}`);
  }

  // Fetch transfer items
  const { data: items, error: itemsError } = await supabase
    .from('stock_transfer_items')
    .select('*')
    .eq('transfer_id', approval.transfer_id);

  if (itemsError) {
    throw new Error(`Failed to fetch transfer items: ${itemsError.message}`);
  }

  // Validate stock availability for each item in the source warehouse
  for (const item of items ?? []) {
    const { data: inventory, error: invError } = await supabase
      .from('inventory')
      .select('quantity, reserved_quantity')
      .eq('product_id', item.product_id)
      .eq('warehouse_id', transfer.source_warehouse_id)
      .single();

    if (invError || !inventory) {
      throw new Error(
        `No inventory found for product ${item.product_id} in source warehouse`
      );
    }

    const available = inventory.quantity - inventory.reserved_quantity;
    if (available < item.requested_quantity) {
      throw new Error(
        `Insufficient stock for product ${item.product_id}. Available: ${available}, Requested: ${item.requested_quantity}`
      );
    }
  }

  // Update transfer status to approved
  const { data: updated, error: updateError } = await supabase
    .from('stock_transfers')
    .update({
      status: 'approved',
      approved_by: approval.approved_by,
    })
    .eq('id', approval.transfer_id)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to approve transfer: ${updateError.message}`);
  }

  return updated as StockTransfer;
}

/**
 * Rejects a pending transfer with a reason.
 */
export async function rejectTransfer(
  rejection: TransferRejection
): Promise<StockTransfer> {
  const { data: transfer, error: fetchError } = await supabase
    .from('stock_transfers')
    .select('status')
    .eq('id', rejection.transfer_id)
    .single();

  if (fetchError || !transfer) {
    throw new Error(`Transfer not found: ${rejection.transfer_id}`);
  }

  if (transfer.status !== 'pending') {
    throw new Error(`Transfer cannot be rejected. Current status: ${transfer.status}`);
  }

  const { data: updated, error: updateError } = await supabase
    .from('stock_transfers')
    .update({
      status: 'rejected',
      rejected_by: rejection.rejected_by,
      rejection_reason: rejection.rejection_reason,
    })
    .eq('id', rejection.transfer_id)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to reject transfer: ${updateError.message}`);
  }

  return updated as StockTransfer;
}

/**
 * Completes an approved transfer by creating paired stock movements:
 * - 'transfer' type (out from source warehouse)
 * - 'in' type (into destination warehouse)
 */
export async function completeTransfer(
  completion: TransferCompletion
): Promise<StockTransfer> {
  // Fetch transfer
  const { data: transfer, error: fetchError } = await supabase
    .from('stock_transfers')
    .select('*')
    .eq('id', completion.transfer_id)
    .single();

  if (fetchError || !transfer) {
    throw new Error(`Transfer not found: ${completion.transfer_id}`);
  }

  if (transfer.status !== 'approved' && transfer.status !== 'in_transit') {
    throw new Error(`Transfer cannot be completed. Current status: ${transfer.status}`);
  }

  // Fetch items
  const { data: items, error: itemsError } = await supabase
    .from('stock_transfer_items')
    .select('*')
    .eq('transfer_id', completion.transfer_id);

  if (itemsError || !items) {
    throw new Error(`Failed to fetch transfer items: ${itemsError?.message}`);
  }

  // Create paired movements for each item
  for (const item of items) {
    // Stock out from source warehouse (type: 'transfer' triggers quantity - NEW.quantity)
    await createMovement({
      product_id: item.product_id,
      warehouse_id: transfer.source_warehouse_id,
      type: 'transfer',
      quantity: item.requested_quantity,
      reference_type: 'stock_transfer',
      reference_id: transfer.id,
      notes: `Transfer out to ${transfer.destination_warehouse_id} - ${transfer.transfer_number}`,
      created_by: completion.completed_by,
    });

    // Stock in to destination warehouse (type: 'in' triggers quantity + NEW.quantity)
    await createMovement({
      product_id: item.product_id,
      warehouse_id: transfer.destination_warehouse_id,
      type: 'in',
      quantity: item.requested_quantity,
      reference_type: 'stock_transfer',
      reference_id: transfer.id,
      notes: `Transfer in from ${transfer.source_warehouse_id} - ${transfer.transfer_number}`,
      created_by: completion.completed_by,
    });

    // Update transferred quantity on the item
    await supabase
      .from('stock_transfer_items')
      .update({ transferred_quantity: item.requested_quantity })
      .eq('id', item.id);
  }

  // Mark transfer as completed
  const { data: updated, error: updateError } = await supabase
    .from('stock_transfers')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', completion.transfer_id)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to complete transfer: ${updateError.message}`);
  }

  return updated as StockTransfer;
}

/**
 * Returns paginated transfer history with warehouse name joins.
 */
export async function getTransferHistory(
  filters: TransferFilters = {}
): Promise<PaginatedResponse<StockTransfer>> {
  const page = filters.page ?? 1;
  const pageSize = filters.page_size ?? 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('stock_transfers')
    .select('*', { count: 'exact' });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.source_warehouse_id) {
    query = query.eq('source_warehouse_id', filters.source_warehouse_id);
  }
  if (filters.destination_warehouse_id) {
    query = query.eq('destination_warehouse_id', filters.destination_warehouse_id);
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
    throw new Error(`Failed to fetch transfer history: ${error.message}`);
  }

  const totalCount = count ?? 0;

  return {
    data: (data ?? []) as StockTransfer[],
    count: totalCount,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(totalCount / pageSize),
  };
}
