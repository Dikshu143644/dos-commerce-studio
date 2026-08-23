import { supabase } from '@/lib/supabase';
import type { Invoice, Payment } from '@/types/database';
import type {
  RecordPaymentInput,
  PaymentFilters,
  PaginatedResponse,
} from './types';

/**
 * Records a payment against an invoice (partial or full).
 * Updates the invoice's amount_paid and payment_status accordingly.
 */
export async function recordPayment(input: RecordPaymentInput): Promise<Payment> {
  // Fetch the invoice to validate
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', input.invoice_id)
    .single();

  if (invoiceError || !invoice) {
    throw new Error(`Invoice not found: ${invoiceError?.message ?? 'Unknown error'}`);
  }

  const currentPaid = (invoice.amount_paid as number) ?? 0;
  const totalAmount = invoice.total_amount as number;
  const newAmountPaid = currentPaid + input.amount;

  if (newAmountPaid > totalAmount) {
    throw new Error(
      `Payment amount ${input.amount} exceeds outstanding balance. ` +
        `Total: ${totalAmount}, Already paid: ${currentPaid}, Max payable: ${totalAmount - currentPaid}`
    );
  }

  // Insert payment record
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      invoice_id: input.invoice_id,
      amount: input.amount,
      payment_method: input.payment_method,
      reference_number: input.reference_number ?? null,
      payment_date: input.payment_date ?? new Date().toISOString().split('T')[0],
      notes: input.notes ?? null,
      received_by: input.received_by,
    })
    .select()
    .single();

  if (paymentError || !payment) {
    throw new Error(`Failed to record payment: ${paymentError?.message ?? 'Unknown error'}`);
  }

  // Determine new payment status
  let paymentStatus: string;
  if (newAmountPaid >= totalAmount) {
    paymentStatus = 'paid';
  } else if (newAmountPaid > 0) {
    paymentStatus = 'partial';
  } else {
    paymentStatus = 'unpaid';
  }

  // Update invoice amounts and status
  const updateData: Record<string, unknown> = {
    amount_paid: newAmountPaid,
    payment_status: paymentStatus,
  };

  if (paymentStatus === 'paid') {
    updateData.paid_at = new Date().toISOString();
    updateData.status = 'paid';
  } else if (paymentStatus === 'partial') {
    updateData.status = 'partial';
  }

  const { error: updateError } = await supabase
    .from('invoices')
    .update(updateData)
    .eq('id', input.invoice_id);

  if (updateError) {
    throw new Error(`Failed to update invoice: ${updateError.message}`);
  }

  return payment as Payment;
}

/**
 * Returns all payments for a given order (via its invoice).
 */
export async function getPaymentHistory(orderId: string): Promise<Payment[]> {
  // First get the invoice for this order
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('id')
    .eq('sales_order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (invoiceError || !invoice) {
    return []; // No invoice means no payments
  }

  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_id', invoice.id)
    .order('payment_date', { ascending: false });

  if (paymentsError) {
    throw new Error(`Failed to fetch payment history: ${paymentsError.message}`);
  }

  return (payments ?? []) as Payment[];
}

/**
 * Returns all unpaid or partially paid invoices.
 */
export async function getOutstandingInvoices(
  filters: PaymentFilters = {}
): Promise<PaginatedResponse<Invoice>> {
  const page = filters.page ?? 1;
  const pageSize = filters.page_size ?? 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('invoices')
    .select('*, customers(company_name)', { count: 'exact' })
    .in('payment_status', ['unpaid', 'partial', 'overdue']);

  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  query = query.order('due_date', { ascending: true }).range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch outstanding invoices: ${error.message}`);
  }

  const totalCount = count ?? 0;

  return {
    data: (data ?? []) as Invoice[],
    count: totalCount,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(totalCount / pageSize),
  };
}

/**
 * Calculates the total outstanding balance for a customer across all invoices.
 */
export async function calculateCustomerBalance(customerId: string): Promise<{
  total_invoiced: number;
  total_paid: number;
  outstanding: number;
  overdue: number;
}> {
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('total_amount, amount_paid, payment_status, due_date')
    .eq('customer_id', customerId);

  if (error) {
    throw new Error(`Failed to calculate customer balance: ${error.message}`);
  }

  let totalInvoiced = 0;
  let totalPaid = 0;
  let overdue = 0;
  const today = new Date().toISOString().split('T')[0];

  for (const inv of invoices ?? []) {
    totalInvoiced += inv.total_amount as number;
    totalPaid += (inv.amount_paid as number) ?? 0;

    const outstanding = (inv.total_amount as number) - ((inv.amount_paid as number) ?? 0);
    if (outstanding > 0 && inv.due_date && inv.due_date < today) {
      overdue += outstanding;
    }
  }

  return {
    total_invoiced: Math.round(totalInvoiced * 100) / 100,
    total_paid: Math.round(totalPaid * 100) / 100,
    outstanding: Math.round((totalInvoiced - totalPaid) * 100) / 100,
    overdue: Math.round(overdue * 100) / 100,
  };
}
