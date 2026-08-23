import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  initiateReturn,
  approveReturn,
  getReturnHistory,
} from '@/services/sales';
import type {
  InitiateReturnInput,
  ApproveReturnInput,
  ReturnFilters,
} from '@/services/sales';
import type { SalesReturn } from '@/types/database';

/**
 * Query hook to list returns with optional filters.
 */
export function useReturns(filters: ReturnFilters = {}) {
  return useQuery({
    queryKey: ['returns', filters],
    queryFn: () => getReturnHistory(filters),
  });
}

/**
 * Mutation to initiate a sales return against a delivered order.
 */
export function useInitiateReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: InitiateReturnInput) => initiateReturn(input),
    onSuccess: (data: SalesReturn) => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['returns', 'order', data.sales_order_id] });
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Mutation to approve a return and restore stock.
 * Creates stock_movements (type 'return') for each returned item.
 */
export function useApproveReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ApproveReturnInput) => approveReturn(input),
    onSuccess: (data: SalesReturn) => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['returns', 'order', data.sales_order_id] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Query hook to fetch returns for a specific order.
 */
export function useReturnHistory(orderId: string | undefined) {
  return useQuery({
    queryKey: ['returns', 'order', orderId],
    queryFn: () => getReturnHistory({ sales_order_id: orderId }),
    enabled: !!orderId,
  });
}
