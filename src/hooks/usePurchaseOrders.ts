import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useBranchContext } from '@/contexts/BranchContext';
import { applyBranchFilter } from '@/services/branches/context';
import type { PurchaseOrder, PurchaseOrderItem, POStatus } from '@/types/database';

export interface PurchaseOrderFilters {
  status?: POStatus;
  supplier_id?: string;
  page?: number;
  pageSize?: number;
}

export interface PurchaseOrderWithItems extends PurchaseOrder {
  items?: PurchaseOrderItem[];
  supplier?: { name: string } | null;
}

export function usePurchaseOrders(filters: PurchaseOrderFilters = {}) {
  const { page = 1, pageSize = 20, status, supplier_id } = filters;
  const { activeBranchId } = useBranchContext();

  return useQuery({
    queryKey: ['purchase_orders', { page, pageSize, status, supplier_id, activeBranchId }],
    queryFn: async () => {
      let query = supabase
        .from('purchase_orders')
        .select('*, suppliers(name)', { count: 'exact' });

      query = applyBranchFilter(query, activeBranchId);

      if (status) {
        query = query.eq('status', status);
      }
      if (supplier_id) {
        query = query.eq('supplier_id', supplier_id);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;
      return {
        data: (data ?? []) as PurchaseOrderWithItems[],
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
  });
}

export function usePurchaseOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['purchase_orders', id],
    queryFn: async () => {
      if (!id) return null;
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .select('*, suppliers(name)')
        .eq('id', id)
        .single();
      if (poError) throw poError;

      const { data: items, error: itemsError } = await supabase
        .from('purchase_order_items')
        .select('*')
        .eq('purchase_order_id', id);
      if (itemsError) throw itemsError;

      return { ...po, items: items ?? [] } as PurchaseOrderWithItems;
    },
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      order: any;
      items: any[];
    }) => {
      const po_number = input.order.po_number || `PO-${Date.now().toString().slice(-6)}`;
      const orderPayload = {
        po_number,
        supplier_id: input.order.supplier_id,
        status: input.order.status || 'draft',
        total_amount: input.order.total_amount || 0,
        tax_amount: input.order.tax_amount || 0,
        discount_amount: input.order.discount_amount || 0,
        expected_delivery: input.order.expected_delivery || input.order.expected_delivery_date || null,
        notes: input.order.notes || null,
      };

      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert(orderPayload)
        .select()
        .single();
      if (poError) throw poError;

      if (input.items && input.items.length > 0) {
        const itemsWithPOId = input.items.map((item) => ({
          purchase_order_id: po.id,
          product_id: item.product_id,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          received_quantity: 0,
          total: (item.quantity || 1) * (item.unit_price || 0),
        }));
        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(itemsWithPOId);
        if (itemsError) throw itemsError;
      }

      return po as PurchaseOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PurchaseOrder> & { id: string }) => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as PurchaseOrder;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase_orders', data.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdatePurchaseOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: POStatus }) => {
      const updates: Partial<PurchaseOrder> = { status };
      const { data, error } = await supabase
        .from('purchase_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as PurchaseOrder;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase_orders', data.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Delete items first
      await supabase
        .from('purchase_order_items')
        .delete()
        .eq('purchase_order_id', id);

      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
