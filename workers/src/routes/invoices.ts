import { Hono } from 'hono';
import type { Env } from '../types';
import { createSupabaseClient } from '../services/supabase';
import { generateInvoicePDF } from '../services/pdf';
import { buildInvoiceData } from '../templates/invoice';

const invoices = new Hono<{ Bindings: Env }>();

// Generate Invoice PDF
invoices.post('/invoices/generate', async (c) => {
  try {
    const body = await c.req.json<{ order_id?: string; sales_order_id?: string; company?: Record<string, unknown> }>();
    // Accept both field names: frontend sends sales_order_id, also accept order_id
    const order_id = body.order_id || body.sales_order_id;
    const { company } = body;

    if (!order_id) {
      return c.json({ error: 'order_id is required' }, 400);
    }

    const supabase = createSupabaseClient(c.env);

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('sales_orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // Fetch customer
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', order.customer_id)
      .single();

    // Fetch order items
    const { data: items } = await supabase
      .from('order_items')
      .select('*, products(name)')
      .eq('order_id', order_id);

    const orderItems = (items || []).map((item: Record<string, unknown>) => ({
      ...item,
      product_name: (item.products as Record<string, unknown>)?.name || item.description || '',
    }));

    // Get next invoice sequence number
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true });

    const sequenceNumber = (count || 0) + 1;

    // Build invoice data
    const invoiceData = buildInvoiceData(
      order as Record<string, unknown>,
      (customer || {}) as Record<string, unknown>,
      orderItems,
      (company || {}) as Record<string, unknown>,
      sequenceNumber
    );

    // Generate PDF
    const pdfBase64 = generateInvoicePDF(invoiceData);

    // Store invoice record
    await supabase.from('invoices').insert({
      invoice_number: invoiceData.invoice_number,
      sales_order_id: order_id,
      customer_id: order.customer_id,
      total_amount: invoiceData.total,
      tax_amount: invoiceData.cgst + invoiceData.sgst + invoiceData.igst,
      status: 'generated',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: c.get('userId'),
    });

    return c.json({
      success: true,
      invoice_number: invoiceData.invoice_number,
      pdf: pdfBase64,
      total: invoiceData.total,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMsg }, 500);
  }
});

// Generate Purchase Order PDF
invoices.post('/purchase-orders/pdf', async (c) => {
  try {
    const body = await c.req.json<{ po_id?: string; purchase_order_id?: string }>();
    // Accept both field names: frontend sends purchase_order_id, also accept po_id
    const po_id = body.po_id || body.purchase_order_id;

    if (!po_id) {
      return c.json({ error: 'po_id is required' }, 400);
    }

    const supabase = createSupabaseClient(c.env);

    // Fetch purchase order
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .select('*, suppliers(name, address, phone, email)')
      .eq('id', po_id)
      .single();

    if (poError || !po) {
      return c.json({ error: 'Purchase order not found' }, 404);
    }

    // Fetch PO items
    const { data: items } = await supabase
      .from('purchase_order_items')
      .select('*, products(name)')
      .eq('purchase_order_id', po_id);

    const poItems = (items || []).map((item: Record<string, unknown>) => ({
      ...item,
      product_name: (item.products as Record<string, unknown>)?.name || '',
    }));

    const supplier = (po.suppliers || {}) as Record<string, unknown>;
    const invoiceData = buildInvoiceData(
      po as Record<string, unknown>,
      {
        name: supplier.name || '',
        address: supplier.address || '',
        phone: supplier.phone,
        email: supplier.email,
      },
      poItems,
      {},
      parseInt(po.po_number?.replace(/\D/g, '') || '1', 10)
    );

    const pdfBase64 = generateInvoicePDF(invoiceData);

    return c.json({
      success: true,
      po_number: po.po_number,
      pdf: pdfBase64,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMsg }, 500);
  }
});

export default invoices;
