import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  recordPayment,
  getPaymentHistory,
  calculateCustomerBalance,
} from '@/services/sales';
import type { RecordPaymentInput } from '@/services/sales';
import type { Payment } from '@/types/database';

/**
 * Query hook to fetch payments for a specific order (via its invoice).
 */
export function usePayments(orderId: string | undefined) {
  return useQuery({
    queryKey: ['payments', orderId],
    queryFn: () => getPaymentHistory(orderId!),
    enabled: !!orderId,
  });
}

/**
 * Mutation to record a payment against an invoice.
 * Updates invoice amount_paid and payment_status.
 */
export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RecordPaymentInput) => recordPayment(input),
    onSuccess: (data: Payment) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', 'outstanding'] });
      queryClient.invalidateQueries({ queryKey: ['customer_balance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Invalidate the specific invoice
      if (data.invoice_id) {
        queryClient.invalidateQueries({ queryKey: ['invoices', 'order'] });
      }
    },
  });
}

/**
 * Query hook to fetch outstanding balance for a specific customer.
 */
export function useCustomerBalance(customerId: string | undefined) {
  return useQuery({
    queryKey: ['customer_balance', customerId],
    queryFn: () => calculateCustomerBalance(customerId!),
    enabled: !!customerId,
  });
}
