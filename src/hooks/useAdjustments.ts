import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { StockAdjustmentReason, StockMovement, AdjustmentReason } from '@/types/database';
import { createAdjustment } from '@/services/inventory/adjustments';
import type { CreateAdjustmentInput } from '@/services/inventory/types';

export interface AdjustmentHistoryFilters {
  product_id?: string;
  warehouse_id?: string;
  reason?: AdjustmentReason;
  date_from?: string;
  date_to?: string;
  page?: number;
  pageSize?: number;
}

export function useAdjustmentReasons() {
  return useQuery({
    queryKey: ['adjustment_reasons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_adjustment_reasons')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return (data ?? []) as StockAdjustmentReason[];
    },
  });
}

export function useCreateAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAdjustmentInput) => {
      return createAdjustment(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useAdjustmentHistory(filters: AdjustmentHistoryFilters = {}) {
  const { page = 1, pageSize = 20, product_id, warehouse_id, reason, date_from, date_to } = filters;

  return useQuery({
    queryKey: ['adjustments', { page, pageSize, product_id, warehouse_id, reason, date_from, date_to }],
    queryFn: async () => {
      let query = supabase
        .from('stock_movements')
        .select('*', { count: 'exact' })
        .eq('type', 'adjustment');

      if (product_id) {
        query = query.eq('product_id', product_id);
      }
      if (warehouse_id) {
        query = query.eq('warehouse_id', warehouse_id);
      }
      if (reason) {
        query = query.ilike('notes', `%[${reason}]%`);
      }
      if (date_from) {
        query = query.gte('created_at', date_from);
      }
      if (date_to) {
        query = query.lte('created_at', date_to);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;
      return {
        data: (data ?? []) as StockMovement[],
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
  });
}
