import type { TemplateDefinition } from './types';

export const stockReportTemplate: TemplateDefinition = {
  id: 'stock_report',
  name: 'Stock Report',
  description: 'Complete inventory stock levels across all warehouses with reorder status',
  icon: 'Package',
  columns: [
    { key: 'sku', header: 'SKU', width: 12 },
    { key: 'name', header: 'Product Name', width: 30 },
    { key: 'category', header: 'Category', width: 15 },
    { key: 'warehouse', header: 'Warehouse', width: 18 },
    { key: 'quantity', header: 'Current Stock', width: 12, format: 'number' },
    { key: 'reorder_point', header: 'Reorder Point', width: 14, format: 'number' },
    { key: 'status', header: 'Status', width: 12 },
    { key: 'value', header: 'Stock Value', width: 14, format: 'currency' },
  ],
};

export const purchaseOrderTemplate: TemplateDefinition = {
  id: 'purchase_order',
  name: 'Purchase Order Template',
  description: 'Template for generating purchase orders with line items and totals',
  icon: 'FileText',
  columns: [
    { key: 'po_number', header: 'PO Number', width: 14 },
    { key: 'supplier', header: 'Supplier', width: 25 },
    { key: 'product', header: 'Product', width: 25 },
    { key: 'quantity', header: 'Quantity', width: 10, format: 'number' },
    { key: 'unit_price', header: 'Unit Price', width: 12, format: 'currency' },
    { key: 'total', header: 'Total', width: 14, format: 'currency' },
    { key: 'status', header: 'Status', width: 12 },
    { key: 'expected_delivery', header: 'Expected Delivery', width: 16, format: 'date' },
  ],
};

export const invoiceTemplate: TemplateDefinition = {
  id: 'invoice',
  name: 'Invoice Template',
  description: 'Invoice export with customer details, line items, and payment status',
  icon: 'Receipt',
  columns: [
    { key: 'invoice_number', header: 'Invoice #', width: 14 },
    { key: 'customer', header: 'Customer', width: 25 },
    { key: 'date', header: 'Date', width: 12, format: 'date' },
    { key: 'amount', header: 'Amount', width: 14, format: 'currency' },
    { key: 'tax', header: 'Tax', width: 12, format: 'currency' },
    { key: 'total', header: 'Total', width: 14, format: 'currency' },
    { key: 'status', header: 'Status', width: 12 },
    { key: 'due_date', header: 'Due Date', width: 12, format: 'date' },
  ],
};

export const customerListTemplate: TemplateDefinition = {
  id: 'customer_list',
  name: 'Customer List Template',
  description: 'Export customer directory with contact information and account details',
  icon: 'Users',
  columns: [
    { key: 'company_name', header: 'Company', width: 25 },
    { key: 'contact_person', header: 'Contact Person', width: 20 },
    { key: 'email', header: 'Email', width: 25 },
    { key: 'phone', header: 'Phone', width: 15 },
    { key: 'city', header: 'City', width: 15 },
    { key: 'type', header: 'Type', width: 12 },
    { key: 'outstanding', header: 'Outstanding', width: 14, format: 'currency' },
    { key: 'credit_limit', header: 'Credit Limit', width: 14, format: 'currency' },
  ],
};

export const salesReportTemplate: TemplateDefinition = {
  id: 'sales_report',
  name: 'Sales Report',
  description: 'Sales performance report with order details and revenue analysis',
  icon: 'BarChart3',
  columns: [
    { key: 'order_number', header: 'Order #', width: 14 },
    { key: 'customer', header: 'Customer', width: 25 },
    { key: 'date', header: 'Date', width: 12, format: 'date' },
    { key: 'items', header: 'Items', width: 8, format: 'number' },
    { key: 'subtotal', header: 'Subtotal', width: 14, format: 'currency' },
    { key: 'tax', header: 'Tax', width: 12, format: 'currency' },
    { key: 'total', header: 'Total', width: 14, format: 'currency' },
    { key: 'status', header: 'Status', width: 12 },
  ],
};

export const allTemplates: TemplateDefinition[] = [
  stockReportTemplate,
  purchaseOrderTemplate,
  invoiceTemplate,
  customerListTemplate,
  salesReportTemplate,
];
