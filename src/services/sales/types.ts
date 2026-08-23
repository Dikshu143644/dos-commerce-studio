import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ReturnCondition,
  ReturnReason,
} from '@/types/database';

// ============================================================
// Sales Order Types
// ============================================================

export interface CreateSalesOrderInput {
  customer_id: string;
  warehouse_id: string;
  shipping_address?: string;
  notes?: string;
  created_by: string;
  items: CreateSalesOrderItemInput[];
}

export interface CreateSalesOrderItemInput {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount?: number;
}

export interface ConfirmOrderInput {
  order_id: string;
  confirmed_by: string;
}

export interface ShipOrderInput {
  order_id: string;
  shipped_by: string;
  notify_customer?: boolean;
}

export interface DeliverOrderInput {
  order_id: string;
  delivered_by: string;
}

export interface CancelOrderInput {
  order_id: string;
  cancelled_by: string;
  reason?: string;
}

export interface DuplicateOrderInput {
  source_order_id: string;
  created_by: string;
}

// ============================================================
// Invoice Types
// ============================================================

export interface InvoiceData {
  invoice_number: string;
  sales_order_id: string;
  customer_id: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  due_date?: string;
  pdf_url?: string;
  notes?: string;
}

export interface EmailInvoiceInput {
  order_id: string;
  recipient_email: string;
}

// ============================================================
// Payment Types
// ============================================================

export interface RecordPaymentInput {
  invoice_id: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string;
  payment_date?: string;
  notes?: string;
  received_by: string;
}

// ============================================================
// Return Types
// ============================================================

export interface InitiateReturnInput {
  sales_order_id: string;
  customer_id: string;
  reason: ReturnReason | string;
  notes?: string;
  items: ReturnItemInput[];
}

export interface ReturnItemInput {
  sales_order_item_id: string;
  product_id: string;
  quantity: number;
  reason?: string;
  condition?: ReturnCondition;
}

export interface ApproveReturnInput {
  return_id: string;
  approved_by: string;
  warehouse_id: string;
}

// ============================================================
// Computation Types
// ============================================================

export interface OrderTotals {
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
}

export interface StockAvailability {
  product_id: string;
  product_name: string;
  warehouse_id: string;
  available_quantity: number;
  requested_quantity: number;
  is_sufficient: boolean;
}

// ============================================================
// Filter Types
// ============================================================

export interface SalesOrderFilters {
  customer_id?: string;
  status?: OrderStatus;
  warehouse_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface InvoiceFilters {
  customer_id?: string;
  payment_status?: PaymentStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface PaymentFilters {
  invoice_id?: string;
  payment_method?: PaymentMethod;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface ReturnFilters {
  sales_order_id?: string;
  customer_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

// ============================================================
// Paginated Response
// ============================================================

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}
