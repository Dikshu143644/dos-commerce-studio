import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  confirmOrder,
  processOrder,
  shipOrder,
  deliverOrder,
  cancelOrder,
} from '@/services/sales';
import type {
  ConfirmOrderInput,
  ShipOrderInput,
  DeliverOrderInput,
  CancelOrderInput,
} from '@/services/sales';
import type { SalesOrder } from '@/types/database';

/**
 * Mutation to confirm a sales order.
 * Validates stock availability and reserves stock on success.
 * Invalidates sales_orders and inventory queries.
 */
export function useConfirmOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ConfirmOrderInput) => confirmOrder(input),
    onSuccess: (data: SalesOrder) => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales_orders', data.id] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Mutation to move a confirmed order to processing status.
 */
export function useProcessOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => processOrder(orderId),
    onSuccess: (data: SalesOrder) => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales_orders', data.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Mutation to ship an order.
 * Creates stock movements, releases reservations, generates invoice, and sends notification.
 * Invalidates sales_orders, inventory, and invoices queries.
 */
export function useShipOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ShipOrderInput) => shipOrder(input),
    onSuccess: (data: SalesOrder) => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales_orders', data.id] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Mutation to mark a shipped order as delivered.
 */
export function useDeliverOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeliverOrderInput) => deliverOrder(input),
    onSuccess: (data: SalesOrder) => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales_orders', data.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Mutation to cancel an order and release reserved stock.
 * Invalidates sales_orders and inventory queries.
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CancelOrderInput) => cancelOrder(input),
    onSuccess: (data: SalesOrder) => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales_orders', data.id] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
