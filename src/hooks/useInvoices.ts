import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  generateInvoice,
  getInvoice,
  emailInvoice,
  getInvoiceHistory,
  getOutstandingInvoices,
} from '@/services/sales';
import type {
  InvoiceFilters,
  EmailInvoiceInput,
} from '@/services/sales';
import type { Invoice } from '@/types/database';

/**
 * Query hook to list invoices with optional filters (status, customer, date range).
 */
export function useInvoices(filters: InvoiceFilters = {}) {
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => getInvoiceHistory(filters),
  });
}

/**
 * Query hook to fetch a single invoice by order ID.
 */
export function useInvoice(orderId: string | undefined) {
  return useQuery({
    queryKey: ['invoices', 'order', orderId],
    queryFn: () => getInvoice(orderId!),
    enabled: !!orderId,
  });
}

/**
 * Mutation to generate an invoice for a sales order.
 * Calls the PHP backend to create the PDF and stores the record.
 */
export function useGenerateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (salesOrderId: string) => generateInvoice(salesOrderId),
    onSuccess: (data: Invoice) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', 'order', data.sales_order_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Mutation to send an invoice PDF via email.
 */
export function useEmailInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: EmailInvoiceInput) => emailInvoice(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

/**
 * Query hook to fetch outstanding (unpaid/overdue) invoices.
 */
export function useOutstandingInvoices() {
  return useQuery({
    queryKey: ['invoices', 'outstanding'],
    queryFn: () => getOutstandingInvoices(),
  });
}
