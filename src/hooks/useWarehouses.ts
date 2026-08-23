import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useBranchContext } from '@/contexts/BranchContext';
import { applyBranchFilter } from '@/services/branches/context';
import type { Warehouse } from '@/types/database';

export interface WarehouseFilters {
  search?: string;
  is_active?: boolean;
  page?: number;
  pageSize?: number;
}

export interface WarehouseWithStock extends Warehouse {
  total_quantity?: number;
  total_products?: number;
}

export function useWarehouses(filters: WarehouseFilters = {}) {
  const { page = 1, pageSize = 20, search, is_active } = filters;
  const { activeBranchId } = useBranchContext();

  return useQuery({
    queryKey: ['warehouses', { page, pageSize, search, is_active, activeBranchId }],
    queryFn: async () => {
      let query = supabase
        .from('warehouses')
        .select('*', { count: 'exact' });

      query = applyBranchFilter(query, activeBranchId);

      if (search) {
        query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
      }
      if (is_active !== undefined) {
        query = query.eq('is_active', is_active);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order('name');

      const { data, error, count } = await query;
      if (error) throw error;
      return {
        data: data as Warehouse[],
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
  });
}

export function useWarehouseWithStock(id: string | undefined) {
  return useQuery({
    queryKey: ['warehouses', id, 'stock'],
    queryFn: async () => {
      if (!id) return null;
      const { data: warehouse, error: whError } = await supabase
        .from('warehouses')
        .select('*')
        .eq('id', id)
        .single();
      if (whError) throw whError;

      const { data: stockData, error: stockError } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('warehouse_id', id);
      if (stockError) throw stockError;

      const total_quantity = stockData?.reduce((sum, s) => sum + (s.quantity ?? 0), 0) ?? 0;
      const total_products = stockData?.length ?? 0;

      return {
        ...warehouse,
        total_quantity,
        total_products,
      } as WarehouseWithStock;
    },
    enabled: !!id,
  });
}

export function useWarehouseStockSummary() {
  return useQuery({
    queryKey: ['warehouses', 'stock-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name, code, capacity, is_active');
      if (error) throw error;

      const { data: inventory, error: invError } = await supabase
        .from('inventory')
        .select('warehouse_id, quantity');
      if (invError) throw invError;

      const stockMap = new Map<string, { total_quantity: number; total_products: number }>();
      for (const item of inventory ?? []) {
        const existing = stockMap.get(item.warehouse_id) ?? { total_quantity: 0, total_products: 0 };
        existing.total_quantity += item.quantity ?? 0;
        existing.total_products += 1;
        stockMap.set(item.warehouse_id, existing);
      }

      return (data ?? []).map((wh) => ({
        ...wh,
        ...stockMap.get(wh.id) ?? { total_quantity: 0, total_products: 0 },
      }));
    },
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (warehouse: Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('warehouses')
        .insert(warehouse)
        .select()
        .single();
      if (error) throw error;
      return data as Warehouse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Warehouse> & { id: string }) => {
      const { data, error } = await supabase
        .from('warehouses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Warehouse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('warehouses')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });
}
