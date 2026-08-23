import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { StockMovement, MovementType } from '@/types/database';

export interface StockMovementFilters {
  product_id?: string;
  warehouse_id?: string;
  movement_type?: MovementType;
  date_from?: string;
  date_to?: string;
  page?: number;
  pageSize?: number;
}

export function useStockMovements(filters: StockMovementFilters = {}) {
  const { page = 1, pageSize = 20, product_id, warehouse_id, movement_type, date_from, date_to } = filters;

  return useQuery({
    queryKey: ['stock_movements', filters],
    queryFn: async () => {
      let query = supabase
        .from('stock_movements')
        .select('*', { count: 'exact' });

      if (product_id) {
        query = query.eq('product_id', product_id);
      }
      if (warehouse_id) {
        query = query.eq('warehouse_id', warehouse_id);
      }
      if (movement_type) {
        query = query.eq('movement_type', movement_type);
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
        data: data as StockMovement[],
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movement: Omit<StockMovement, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('stock_movements')
        .insert(movement)
        .select()
        .single();
      if (error) throw error;
      return data as StockMovement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
