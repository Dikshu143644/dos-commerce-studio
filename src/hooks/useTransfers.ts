import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { StockTransfer, StockTransferItem, TransferStatus } from '@/types/database';
import {
  initiateTransfer,
  approveTransfer,
  rejectTransfer,
  completeTransfer,
} from '@/services/inventory/transfers';
import type {
  TransferRequest,
  TransferApproval,
  TransferRejection,
  TransferCompletion,
} from '@/services/inventory/types';

export interface TransferFilters {
  status?: TransferStatus;
  warehouse_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  pageSize?: number;
}

export interface TransferWithItems extends StockTransfer {
  items?: StockTransferItem[];
  source_warehouse?: { name: string } | null;
  destination_warehouse?: { name: string } | null;
}

export function useTransfers(filters: TransferFilters = {}) {
  const { page = 1, pageSize = 20, status, warehouse_id, date_from, date_to } = filters;

  return useQuery({
    queryKey: ['transfers', { page, pageSize, status, warehouse_id, date_from, date_to }],
    queryFn: async () => {
      let query = supabase
        .from('stock_transfers')
        .select(
          '*, source_warehouse:source_warehouse_id(name), destination_warehouse:destination_warehouse_id(name)',
          { count: 'exact' }
        );

      if (status) {
        query = query.eq('status', status);
      }
      if (warehouse_id) {
        query = query.or(
          `source_warehouse_id.eq.${warehouse_id},destination_warehouse_id.eq.${warehouse_id}`
        );
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
        data: (data ?? []) as TransferWithItems[],
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
  });
}

export function useTransfer(id: string | undefined) {
  return useQuery({
    queryKey: ['transfers', id],
    queryFn: async () => {
      if (!id) return null;

      const { data: transfer, error: transferError } = await supabase
        .from('stock_transfers')
        .select(
          '*, source_warehouse:source_warehouse_id(name), destination_warehouse:destination_warehouse_id(name)'
        )
        .eq('id', id)
        .single();

      if (transferError) throw transferError;

      const { data: items, error: itemsError } = await supabase
        .from('stock_transfer_items')
        .select('*')
        .eq('transfer_id', id);

      if (itemsError) throw itemsError;

      return { ...transfer, items: items ?? [] } as TransferWithItems;
    },
    enabled: !!id,
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: TransferRequest) => {
      return initiateTransfer(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useApproveTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (approval: TransferApproval) => {
      return approveTransfer(approval);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['transfers', data.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useRejectTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rejection: TransferRejection) => {
      return rejectTransfer(rejection);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['transfers', data.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCompleteTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (completion: TransferCompletion) => {
      return completeTransfer(completion);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['transfers', data.id] });
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
