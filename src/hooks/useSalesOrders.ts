import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useBranchContext } from '@/contexts/BranchContext';
import { applyBranchFilter } from '@/services/branches/context';
import type { SalesOrder, SalesOrderItem, OrderStatus } from '@/types/database';

export interface SalesOrderFilters {
  status?: OrderStatus;
  customer_id?: string;
  page?: number;
  pageSize?: number;
}

export interface SalesOrderWithItems extends SalesOrder {
  items?: SalesOrderItem[];
  customer?: { name: string } | null;
}

export function useSalesOrders(filters: SalesOrderFilters = {}) {
  const { page = 1, pageSize = 20, status, customer_id } = filters;
  const { activeBranchId } = useBranchContext();

  return useQuery({
    queryKey: ['sales_orders', { page, pageSize, status, customer_id, activeBranchId }],
    queryFn: async () => {
      let query = supabase
        .from('sales_orders')
        .select('*, customers(name)', { count: 'exact' });

      query = applyBranchFilter(query, activeBranchId);

      if (status) {
        query = query.eq('status', status);
      }
      if (customer_id) {
        query = query.eq('customer_id', customer_id);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;
      return {
        data: (data ?? []) as SalesOrderWithItems[],
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
  });
}

export function useSalesOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['sales_orders', id],
    queryFn: async () => {
      if (!id) return null;
      const { data: so, error: soError } = await supabase
        .from('sales_orders')
        .select('*, customers(name)')
        .eq('id', id)
        .single();
      if (soError) throw soError;

      const { data: items, error: itemsError } = await supabase
        .from('sales_order_items')
        .select('*')
        .eq('sales_order_id', id);
      if (itemsError) throw itemsError;

      return { ...so, items: items ?? [] } as SalesOrderWithItems;
    },
    enabled: !!id,
  });
}

export function useCreateSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      order: Omit<SalesOrder, 'id' | 'created_at' | 'updated_at' | 'order_number'>;
      items: Omit<SalesOrderItem, 'id' | 'sales_order_id'>[];
    }) => {
      const { data: so, error: soError } = await supabase
        .from('sales_orders')
        .insert(input.order)
        .select()
        .single();
      if (soError) throw soError;

      if (input.items.length > 0) {
        const itemsWithSOId = input.items.map((item) => ({
          ...item,
          sales_order_id: so.id,
        }));
        const { error: itemsError } = await supabase
          .from('sales_order_items')
          .insert(itemsWithSOId);
        if (itemsError) throw itemsError;
      }

      return so as SalesOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SalesOrder> & { id: string }) => {
      const { data, error } = await supabase
        .from('sales_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as SalesOrder;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales_orders', data.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateSalesOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { data, error } = await supabase
        .from('sales_orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as SalesOrder;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales_orders', data.id] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from('sales_order_items')
        .delete()
        .eq('sales_order_id', id);

      const { error } = await supabase
        .from('sales_orders')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
