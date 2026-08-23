import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  PurchaseOrder,
  PurchaseOrderItem,
  GoodsReceivedNote,
  GRNItem,
} from '@/types/database';
import { receiveItems } from '@/services/inventory/receiving';
import type { ReceiveItemsInput } from '@/services/inventory/types';

export interface PurchaseOrderWithItems extends PurchaseOrder {
  items?: PurchaseOrderItem[];
  supplier?: { name: string } | null;
}

export interface GRNWithItems extends GoodsReceivedNote {
  items?: (GRNItem & { product?: { name: string; sku: string } | null })[];
}

export interface GRNFilters {
  purchase_order_id?: string;
  page?: number;
  pageSize?: number;
}

export function usePendingPOs() {
  return useQuery({
    queryKey: ['purchase_orders', 'pending_receiving'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, suppliers:supplier_id(name)')
        .in('status', ['confirmed', 'partially_received'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as PurchaseOrderWithItems[];
    },
  });
}

export function useReceiveItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReceiveItemsInput) => {
      return receiveItems(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['grns'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useGRNs(filters: GRNFilters = {}) {
  const { purchase_order_id, page = 1, pageSize = 20 } = filters;

  return useQuery({
    queryKey: ['grns', { purchase_order_id, page, pageSize }],
    queryFn: async () => {
      let query = supabase
        .from('goods_received_notes')
        .select('*', { count: 'exact' });

      if (purchase_order_id) {
        query = query.eq('purchase_order_id', purchase_order_id);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order('received_at', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;
      return {
        data: (data ?? []) as GoodsReceivedNote[],
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
  });
}

export function useGRN(id: string | undefined) {
  return useQuery({
    queryKey: ['grns', id],
    queryFn: async () => {
      if (!id) return null;

      const { data: grn, error: grnError } = await supabase
        .from('goods_received_notes')
        .select('*')
        .eq('id', id)
        .single();

      if (grnError) throw grnError;

      const { data: items, error: itemsError } = await supabase
        .from('grn_items')
        .select('*, product:product_id(name, sku)')
        .eq('grn_id', id);

      if (itemsError) throw itemsError;

      return { ...grn, items: items ?? [] } as GRNWithItems;
    },
    enabled: !!id,
  });
}
