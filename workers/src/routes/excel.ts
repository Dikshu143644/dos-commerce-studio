import { Hono } from 'hono';
import * as XLSX from 'xlsx';
import type { Env, ExcelGenerateRequest } from '../types';
import { createSupabaseClient } from '../services/supabase';

const excel = new Hono<{ Bindings: Env }>();

// Import Excel file and parse data
excel.post('/excel/import', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    return c.json({
      success: true,
      fileName: file.name,
      sheetName,
      rowCount: data.length,
      columns: data.length > 0 ? Object.keys(data[0] as Record<string, unknown>) : [],
      data,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMsg }, 500);
  }
});

// Export inventory data as Excel
excel.post('/excel/export/inventory', async (c) => {
  try {
    const body = await c.req.json<{ filters?: Record<string, unknown> }>();
    const supabase = createSupabaseClient(c.env);

    let query = supabase
      .from('products')
      .select('sku, name, category, quantity, reorder_point, unit_price, cost_price, is_active');

    if (body.filters?.warehouse_id) {
      query = query.eq('warehouse_id', body.filters.warehouse_id as string);
    }
    if (body.filters?.category) {
      query = query.eq('category', body.filters.category as string);
    }
    if (body.filters?.is_active !== undefined) {
      query = query.eq('is_active', body.filters.is_active as boolean);
    }

    const { data: products, error } = await query.order('name');

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    const worksheet = XLSX.utils.json_to_sheet(products || []);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');

    const buffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });

    return c.json({
      success: true,
      file: buffer,
      fileName: `inventory_export_${new Date().toISOString().split('T')[0]}.xlsx`,
      rowCount: (products || []).length,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMsg }, 500);
  }
});

// AI-triggered report generation
excel.post('/excel/ai-generate', async (c) => {
  try {
    const body = await c.req.json<ExcelGenerateRequest>();
    const { template, filters, format } = body;

    if (!template) {
      return c.json({ error: 'template is required' }, 400);
    }

    const supabase = createSupabaseClient(c.env);
    let data: Record<string, unknown>[] = [];
    let sheetName = 'Report';

    switch (template) {
      case 'stock_report': {
        sheetName = 'Stock Report';
        let query = supabase
          .from('products')
          .select('sku, name, category, quantity, reorder_point, unit_price, is_active');

        if (filters?.warehouse_id) {
          query = query.eq('warehouse_id', filters.warehouse_id as string);
        }
        if (filters?.category) {
          query = query.eq('category', filters.category as string);
        }

        const { data: products } = await query.order('name').limit(1000);
        data = (products || []).map((p: Record<string, unknown>) => ({
          SKU: p.sku,
          'Product Name': p.name,
          Category: p.category,
          'Current Stock': p.quantity,
          'Reorder Point': p.reorder_point,
          Status: (p.quantity as number) <= ((p.reorder_point as number) || 0) ? 'Low Stock' : 'In Stock',
          'Stock Value': ((p.quantity as number) || 0) * ((p.unit_price as number) || 0),
        }));
        break;
      }

      case 'purchase_order': {
        sheetName = 'Purchase Orders';
        let query = supabase
          .from('purchase_orders')
          .select('po_number, suppliers(name), total_amount, status, created_at, expected_delivery');

        if (filters?.status) {
          query = query.eq('status', filters.status as string);
        }
        if (filters?.supplier_id) {
          query = query.eq('supplier_id', filters.supplier_id as string);
        }

        const { data: orders } = await query.order('created_at', { ascending: false }).limit(1000);
        data = (orders || []).map((o: Record<string, unknown>) => ({
          'PO Number': o.po_number,
          Supplier: (o.suppliers as Record<string, unknown>)?.name || '',
          'Total Amount': o.total_amount,
          Status: o.status,
          'Created Date': o.created_at,
          'Expected Delivery': o.expected_delivery,
        }));
        break;
      }

      case 'invoice': {
        sheetName = 'Invoices';
        let query = supabase
          .from('invoices')
          .select('invoice_number, total_amount, paid_amount, status, due_date, created_at');

        if (filters?.status) {
          query = query.eq('status', filters.status as string);
        }

        const { data: invoices } = await query.order('created_at', { ascending: false }).limit(1000);
        data = (invoices || []).map((inv: Record<string, unknown>) => ({
          'Invoice #': inv.invoice_number,
          Amount: inv.total_amount,
          Paid: inv.paid_amount,
          Status: inv.status,
          'Due Date': inv.due_date,
          'Created Date': inv.created_at,
        }));
        break;
      }

      case 'customer_list': {
        sheetName = 'Customers';
        let query = supabase
          .from('customers')
          .select('name, email, phone, customer_type, total_orders, total_spent, created_at');

        if (filters?.customer_type) {
          query = query.eq('customer_type', filters.customer_type as string);
        }

        const { data: customers } = await query.order('name').limit(1000);
        data = (customers || []).map((cust: Record<string, unknown>) => ({
          Company: cust.name,
          Email: cust.email,
          Phone: cust.phone,
          Type: cust.customer_type,
          'Total Orders': cust.total_orders,
          'Total Spent': cust.total_spent,
          'Joined Date': cust.created_at,
        }));
        break;
      }

      case 'sales_report': {
        sheetName = 'Sales Report';
        let query = supabase
          .from('sales_orders')
          .select('order_number, customers(name), total_amount, status, created_at');

        if (filters?.status) {
          query = query.eq('status', filters.status as string);
        }
        if (filters?.start_date) {
          query = query.gte('created_at', filters.start_date as string);
        }
        if (filters?.end_date) {
          query = query.lte('created_at', filters.end_date as string);
        }

        const { data: orders } = await query.order('created_at', { ascending: false }).limit(1000);
        data = (orders || []).map((o: Record<string, unknown>) => ({
          'Order #': o.order_number,
          Customer: (o.customers as Record<string, unknown>)?.name || '',
          Date: o.created_at,
          Total: o.total_amount,
          Status: o.status,
        }));
        break;
      }

      default:
        return c.json({ error: `Unknown template: ${template}` }, 400);
    }

    // Generate the file
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const bookType = format === 'csv' ? 'csv' : 'xlsx';
    const fileBuffer = XLSX.write(workbook, { type: 'base64', bookType });

    return c.json({
      success: true,
      file: fileBuffer,
      fileName: `${template}_${new Date().toISOString().split('T')[0]}.${bookType === 'csv' ? 'csv' : 'xlsx'}`,
      rowCount: data.length,
      template,
      format: bookType,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMsg }, 500);
  }
});

// Stock report endpoint
excel.post('/reports/stock', async (c) => {
  try {
    const body = await c.req.json<{ warehouse_id?: string; format?: 'xlsx' | 'csv' }>();
    const supabase = createSupabaseClient(c.env);

    let query = supabase
      .from('products')
      .select('sku, name, category, quantity, reorder_point, unit_price, cost_price')
      .eq('is_active', true);

    if (body.warehouse_id) {
      query = query.eq('warehouse_id', body.warehouse_id);
    }

    const { data: products, error } = await query.order('name');

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    const reportData = (products || []).map((p: Record<string, unknown>) => ({
      SKU: p.sku,
      Product: p.name,
      Category: p.category,
      'Current Stock': p.quantity,
      'Reorder Point': p.reorder_point,
      'Unit Price': p.unit_price,
      'Stock Value': ((p.quantity as number) || 0) * ((p.unit_price as number) || 0),
      Status: (p.quantity as number) <= ((p.reorder_point as number) || 0) ? 'Low Stock' : 'OK',
    }));

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Report');

    const bookType = body.format === 'csv' ? 'csv' : 'xlsx';
    const fileBuffer = XLSX.write(workbook, { type: 'base64', bookType });

    return c.json({
      success: true,
      file: fileBuffer,
      fileName: `stock_report_${new Date().toISOString().split('T')[0]}.${bookType === 'csv' ? 'csv' : 'xlsx'}`,
      rowCount: reportData.length,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMsg }, 500);
  }
});

export default excel;
