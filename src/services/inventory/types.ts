import type {
  MovementType,
  TransferStatus,
  AdjustmentReason,
} from '@/types/database';

// Movement creation input
export interface CreateMovementInput {
  product_id: string;
  warehouse_id: string;
  type: MovementType;
  quantity: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  created_by: string;
}

// Transfer request input
export interface TransferRequest {
  source_warehouse_id: string;
  destination_warehouse_id: string;
  requested_by: string;
  notes?: string;
  items: TransferRequestItem[];
}

export interface TransferRequestItem {
  product_id: string;
  requested_quantity: number;
  notes?: string;
}

// Transfer approval input
export interface TransferApproval {
  transfer_id: string;
  approved_by: string;
}

// Transfer rejection input
export interface TransferRejection {
  transfer_id: string;
  rejected_by: string;
  rejection_reason: string;
}

// Transfer completion input
export interface TransferCompletion {
  transfer_id: string;
  completed_by: string;
}

// Receiving input
export interface ReceiveItemsInput {
  purchase_order_id: string;
  warehouse_id: string;
  received_by: string;
  supplier_invoice_number?: string;
  notes?: string;
  items: ReceiveItemDetail[];
}

export interface ReceiveItemDetail {
  purchase_order_item_id: string;
  product_id: string;
  quantity_received: number;
  quantity_rejected?: number;
  rejection_reason?: string;
  batch_number?: string;
  expiry_date?: string;
}

// Adjustment input
export interface CreateAdjustmentInput {
  product_id: string;
  warehouse_id: string;
  quantity: number;
  reason: AdjustmentReason;
  notes?: string;
  created_by: string;
}

// Low stock alert
export interface LowStockAlert {
  product_id: string;
  product_name: string;
  sku: string;
  warehouse_id: string;
  warehouse_name: string;
  current_quantity: number;
  reorder_point: number;
  min_stock_level: number;
}

// Movement history filters
export interface MovementHistoryFilters {
  product_id?: string;
  warehouse_id?: string;
  type?: MovementType;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

// Transfer filters
export interface TransferFilters {
  status?: TransferStatus;
  source_warehouse_id?: string;
  destination_warehouse_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

// Adjustment filters
export interface AdjustmentFilters {
  product_id?: string;
  warehouse_id?: string;
  reason?: AdjustmentReason;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

// GRN input
export interface GRNInput {
  purchase_order_id: string;
  warehouse_id: string;
  received_by: string;
  supplier_invoice_number?: string;
  notes?: string;
  items: ReceiveItemDetail[];
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}
