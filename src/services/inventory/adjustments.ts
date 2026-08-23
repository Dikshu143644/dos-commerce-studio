import { supabase } from '@/lib/supabase';
import type { StockMovement, AdjustmentReason } from '@/types/database';
import type { CreateAdjustmentInput, AdjustmentFilters, PaginatedResponse } from './types';
import { createMovement } from './movements';

const VALID_REASONS: AdjustmentReason[] = [
  'damaged',
  'expired',
  'theft',
  'count_correction',
  'quality_reject',
  'sample',
  'other',
];

/**
 * Creates a stock adjustment with a mandatory reason.
 * - Validates the reason is a recognized adjustment reason
 * - For negative adjustments, validates sufficient stock exists
 * - Creates a movement with type 'adjustment' (trigger handles qty update: quantity + NEW.quantity)
 * - Auto-creates an audit log entry
 */
export async function createAdjustment(
  input: CreateAdjustmentInput
): Promise<StockMovement> {
  // Validate reason
  if (!VALID_REASONS.includes(input.reason)) {
    throw new Error(`Invalid adjustment reason: ${input.reason}`);
  }

  if (input.quantity === 0) {
    throw new Error('Adjustment quantity cannot be zero');
  }

  // Create the movement (createMovement handles negative stock validation)
  const movement = await createMovement({
    product_id: input.product_id,
    warehouse_id: input.warehouse_id,
    type: 'adjustment',
    quantity: input.quantity,
    reference_type: 'adjustment',
    notes: `[${input.reason}] ${input.notes ?? ''}`.trim(),
    created_by: input.created_by,
  });

  // Log audit event
  await supabase.rpc('log_audit_event', {
    p_user_id: input.created_by,
    p_action: 'stock_adjustment',
    p_entity_type: 'stock_movement',
    p_entity_id: movement.id,
    p_new_values: {
      product_id: input.product_id,
      warehouse_id: input.warehouse_id,
      quantity: input.quantity,
      reason: input.reason,
      notes: input.notes,
    },
  });

  return movement;
}

/**
 * Returns paginated adjustment history with optional filters.
 * Only returns movements of type 'adjustment'.
 */
export async function getAdjustmentHistory(
  filters: AdjustmentFilters = {}
): Promise<PaginatedResponse<StockMovement>> {
  const page = filters.page ?? 1;
  const pageSize = filters.page_size ?? 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('stock_movements')
    .select('*', { count: 'exact' })
    .eq('type', 'adjustment');

  if (filters.product_id) {
    query = query.eq('product_id', filters.product_id);
  }
  if (filters.warehouse_id) {
    query = query.eq('warehouse_id', filters.warehouse_id);
  }
  if (filters.reason) {
    query = query.ilike('notes', `%[${filters.reason}]%`);
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
    throw new Error(`Failed to fetch adjustment history: ${error.message}`);
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
