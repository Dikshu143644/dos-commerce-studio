import { supabase } from '@/lib/supabase';
import type { Invoice } from '@/types/database';
import { api } from '@/services/api';
import type {
  EmailInvoiceInput,
  InvoiceFilters,
  PaginatedResponse,
} from './types';

/**
 * Generates an invoice for a sales order by calling the PHP backend
 * to create the PDF and stores the invoice record in the database.
 */
export async function generateInvoice(salesOrderId: string): Promise<Invoice> {
  // Fetch order details for invoice data
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .select('*, customers(company_name, email)')
    .eq('id', salesOrderId)
    .single();

  if (orderError || !order) {
    throw new Error(`Sales order not found: ${orderError?.message ?? 'Unknown error'}`);
  }

  // Call PHP backend to generate the invoice PDF
  let pdfUrl: string | null = null;
  try {
    const pdfBlob = await api.generateInvoice(salesOrderId);
    // If we got a blob, the PDF was generated. The PHP backend may return a URL.
    if (pdfBlob && typeof pdfBlob === 'object' && 'url' in (pdfBlob as unknown as Record<string, unknown>)) {
      pdfUrl = (pdfBlob as unknown as { url: string }).url;
    }
  } catch (pdfError) {
    // Log but continue - we can still create the invoice record without the PDF
    console.error('PDF generation failed:', pdfError);
  }

  // Generate invoice number via database function
  const { data: invoiceNumberResult, error: seqError } = await supabase.rpc(
    'generate_invoice_number'
  );

  // Fallback if RPC fails
  const invoiceNumber = seqError
    ? `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
    : (invoiceNumberResult as string);

  // Calculate due date (30 days from now)
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  // Insert invoice record
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      sales_order_id: salesOrderId,
      customer_id: order.customer_id,
      amount: order.total_amount,
      subtotal: order.subtotal ?? order.total_amount,
      tax_amount: order.tax_amount ?? 0,
      discount_amount: order.discount_amount ?? 0,
      total_amount: order.total_amount,
      amount_paid: 0,
      status: 'unpaid',
      payment_status: 'unpaid',
      due_date: dueDate.toISOString().split('T')[0],
      pdf_url: pdfUrl,
      generated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (invoiceError || !invoice) {
    throw new Error(`Failed to create invoice: ${invoiceError?.message ?? 'Unknown error'}`);
  }

  // Link invoice to the sales order
  await supabase
    .from('sales_orders')
    .update({ invoice_id: invoice.id })
    .eq('id', salesOrderId);

  return invoice as Invoice;
}

/**
 * Fetches invoice details for a given order.
 */
export async function getInvoice(orderId: string): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('sales_order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No invoice found
    }
    throw new Error(`Failed to fetch invoice: ${error.message}`);
  }

  return data as Invoice;
}

/**
 * Emails the invoice PDF to a recipient using the PHP backend.
 */
export async function emailInvoice(input: EmailInvoiceInput): Promise<{ success: boolean; message_id?: string }> {
  // Fetch the invoice for this order
  const invoice = await getInvoice(input.order_id);

  if (!invoice) {
    throw new Error('No invoice found for this order.');
  }

  // Fetch order details for the email template
  const { data: order } = await supabase
    .from('sales_orders')
    .select('order_number, customers(company_name)')
    .eq('id', input.order_id)
    .single();

  const customerData = (order?.customers as unknown as { company_name: string } | null);

  // Send email via PHP backend
  const result = await api.sendEmail({
    to: input.recipient_email,
    template: 'invoice',
    data: {
      invoice_number: invoice.invoice_number,
      order_number: order?.order_number ?? '',
      customer_name: customerData?.company_name ?? '',
      total_amount: invoice.total_amount,
      due_date: invoice.due_date,
      pdf_url: invoice.pdf_url,
    },
  });

  return result;
}

/**
 * Returns invoice history with optional customer filter.
 */
export async function getInvoiceHistory(
  filters: InvoiceFilters = {}
): Promise<PaginatedResponse<Invoice>> {
  const page = filters.page ?? 1;
  const pageSize = filters.page_size ?? 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('invoices')
    .select('*, customers(company_name)', { count: 'exact' });

  if (filters.customer_id) {
    query = query.eq('customer_id', filters.customer_id);
  }
  if (filters.payment_status) {
    query = query.eq('payment_status', filters.payment_status);
  }
  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch invoice history: ${error.message}`);
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
