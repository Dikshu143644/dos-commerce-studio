import { supabase } from '@/lib/supabase';
import type { StockMovement } from '@/types/database';
import type {
  CreateMovementInput,
  MovementHistoryFilters,
  PaginatedResponse,
} from './types';

/**
 * Creates a stock movement after validating stock availability.
 * For 'out' and 'transfer' types, validates that sufficient stock exists.
 * The database trigger (update_stock_quantity) handles the actual inventory update.
 */
export async function createMovement(input: CreateMovementInput): Promise<StockMovement> {
  // Validate stock availability for outbound movements
  if (input.type === 'out' || input.type === 'transfer') {
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('quantity, reserved_quantity')
      .eq('product_id', input.product_id)
      .eq('warehouse_id', input.warehouse_id)
      .single();

    if (inventoryError || !inventory) {
      throw new Error(
        `No inventory record found for product ${input.product_id} in warehouse ${input.warehouse_id}`
      );
    }

    const availableQuantity = inventory.quantity - inventory.reserved_quantity;
    if (availableQuantity < input.quantity) {
      throw new Error(
        `Insufficient stock. Available: ${availableQuantity}, Requested: ${input.quantity}`
      );
    }
  }

  // For negative adjustments, validate stock availability
  if (input.type === 'adjustment' && input.quantity < 0) {
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('product_id', input.product_id)
      .eq('warehouse_id', input.warehouse_id)
      .single();

    if (inventoryError || !inventory) {
      throw new Error(
        `No inventory record found for product ${input.product_id} in warehouse ${input.warehouse_id}`
      );
    }

    if (inventory.quantity + input.quantity < 0) {
      throw new Error(
        `Insufficient stock for adjustment. Current: ${inventory.quantity}, Adjustment: ${input.quantity}`
      );
    }
  }

  const { data, error } = await supabase
    .from('stock_movements')
    .insert({
      product_id: input.product_id,
      warehouse_id: input.warehouse_id,
      type: input.type,
      quantity: input.quantity,
      reference_type: input.reference_type ?? null,
      reference_id: input.reference_id ?? null,
      notes: input.notes ?? null,
      created_by: input.created_by,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create stock movement: ${error.message}`);
  }

  return data as StockMovement;
}

/**
 * Returns paginated movement history with optional filters.
 */
export async function getMovementHistory(
  filters: MovementHistoryFilters = {}
): Promise<PaginatedResponse<StockMovement>> {
  const page = filters.page ?? 1;
  const pageSize = filters.page_size ?? 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('stock_movements')
    .select('*', { count: 'exact' });

  if (filters.product_id) {
    query = query.eq('product_id', filters.product_id);
  }
  if (filters.warehouse_id) {
    query = query.eq('warehouse_id', filters.warehouse_id);
  }
  if (filters.type) {
    query = query.eq('type', filters.type);
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
    throw new Error(`Failed to fetch movement history: ${error.message}`);
  }

  const totalCount = count ?? 0;

  return {
    data: (data ?? []) as StockMovement[],
    count: totalCount,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(totalCount / pageSize),
  };
}

/**
 * Returns full movement traceability for a single product across all warehouses.
 */
export async function getProductTraceability(productId: string): Promise<StockMovement[]> {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch product traceability: ${error.message}`);
  }

  return (data ?? []) as StockMovement[];
}
