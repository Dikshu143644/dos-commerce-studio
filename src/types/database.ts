// Enums matching Supabase database schema (source of truth: supabase/migrations/001_initial_schema.sql)
export type MovementType = 'in' | 'out' | 'transfer' | 'adjustment' | 'return';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
export type LeadSource = 'website' | 'referral' | 'cold_call' | 'trade_show' | 'social_media' | 'advertisement' | 'other';
export type DealStage = 'qualification' | 'needs_analysis' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task' | 'follow_up';
export type OrderStatus = 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type POStatus = 'draft' | 'sent' | 'confirmed' | 'partially_received' | 'received' | 'cancelled';
export type NotificationType = 'info' | 'warning' | 'success' | 'error' | 'reminder';
export type CustomerType = 'regular' | 'wholesale' | 'retail' | 'distributor';
export type AgentType = 'inventory' | 'sales' | 'procurement' | 'finance' | 'excel' | 'general';
export type TransferStatus = 'pending' | 'approved' | 'in_transit' | 'completed' | 'rejected';
export type AdjustmentReason = 'damaged' | 'expired' | 'theft' | 'count_correction' | 'quality_reject' | 'sample' | 'other';

// Sales Workflow Types (Phase 5)
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overdue' | 'refunded';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'credit' | 'razorpay';
export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type ReturnCondition = 'resellable' | 'damaged' | 'defective';
export type ReturnReason = 'damaged' | 'wrong_item' | 'quality_issue' | 'customer_request' | 'other';

// Database table types
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role_id: string | null;
  branch_id: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  name: string;
  code?: string;
  address: string | null;
  city: string | null;
  state?: string | null;
  country: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BranchSettings {
  id: string;
  branch_id: string;
  setting_key: string;
  setting_value: Record<string, unknown>;
}

export interface UserBranchAccess {
  id: string;
  user_id: string;
  branch_id: string;
  access_level: 'member' | 'manager' | 'admin';
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  category_id: string | null;
  unit_price: number;
  cost_price: number;
  unit_of_measure: string;
  min_stock_level: number;
  max_stock_level: number;
  reorder_point: number;
  image_url: string | null;
  barcode: string | null;
  barcode_format: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  country: string | null;
  capacity: number | null;
  branch_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WarehouseStock {
  id: string;
  warehouse_id: string;
  product_id: string;
  quantity: number;
  reserved_quantity: number;
  last_counted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  warehouse_id: string;
  target_warehouse_id: string | null;
  movement_type: MovementType;
  quantity: number;
  reference_number: string | null;
  reason: string | null;
  performed_by: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  payment_terms: string | null;
  rating: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  status: POStatus;
  order_date: string;
  expected_delivery_date: string | null;
  total_amount: number;
  notes: string | null;
  created_by: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  received_quantity: number;
  total_price: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  customer_type: CustomerType;
  address: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  total_orders: number;
  total_spent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: LeadStatus;
  source: LeadSource;
  estimated_value: number | null;
  assigned_to: string | null;
  notes: string | null;
  converted_customer_id: string | null;
  score: number | null;
  last_scored_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  title: string;
  customer_id: string | null;
  lead_id: string | null;
  stage: DealStage;
  value: number;
  probability: number;
  expected_close_date: string | null;
  assigned_to: string | null;
  notes: string | null;
  won_at: string | null;
  lost_at: string | null;
  lost_reason: string | null;
  converted_from_lead_id: string | null;
  sales_order_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmActivity {
  id: string;
  activity_type: ActivityType;
  title: string;
  description: string | null;
  customer_id: string | null;
  lead_id: string | null;
  deal_id: string | null;
  performed_by: string;
  scheduled_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  customer_id: string;
  status: OrderStatus;
  order_date: string;
  shipping_address: string | null;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  notes: string | null;
  created_by: string;
  shipped_at: string | null;
  delivered_at: string | null;
  warehouse_id: string | null;
  invoice_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalesOrderItem {
  id: string;
  sales_order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  total_price: number;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AiConversation {
  id: string;
  user_id: string;
  agent_type: AgentType;
  title: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  created_at: string;
  updated_at: string;
}

// Inventory Workflow Types

export interface StockTransfer {
  id: string;
  transfer_number: string;
  source_warehouse_id: string;
  destination_warehouse_id: string;
  status: TransferStatus;
  requested_by: string;
  approved_by: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface StockTransferItem {
  id: string;
  transfer_id: string;
  product_id: string;
  requested_quantity: number;
  transferred_quantity: number;
  notes: string | null;
}

export interface GoodsReceivedNote {
  id: string;
  grn_number: string;
  purchase_order_id: string;
  warehouse_id: string;
  received_by: string;
  supplier_invoice_number: string | null;
  notes: string | null;
  received_at: string;
  created_at: string;
}

export interface GRNItem {
  id: string;
  grn_id: string;
  purchase_order_item_id: string;
  product_id: string;
  quantity_received: number;
  quantity_rejected: number;
  rejection_reason: string | null;
  batch_number: string | null;
  expiry_date: string | null;
}

export interface StockAdjustmentReason {
  id: string;
  code: string;
  name: string;
  description: string | null;
  requires_approval: boolean;
  is_active: boolean;
}

// CRM Workflow Types

export interface LeadScore {
  id: string;
  lead_id: string;
  score: number;
  breakdown: {
    source: number;
    value: number;
    engagement: number;
    recency: number;
    size: number;
  };
  calculated_at: string;
}

export interface FollowUpRule {
  id: string;
  name: string;
  trigger_event: string;
  trigger_condition: Record<string, unknown> | null;
  action_type: string;
  action_config: {
    delay_days: number;
    activity_type: string;
    subject_template: string;
  };
  is_active: boolean;
  created_at: string;
}

export interface EmailSequence {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  is_active: boolean;
  created_at: string;
}

export interface EmailSequenceStep {
  id: string;
  sequence_id: string;
  step_number: number;
  delay_days: number;
  email_template: string;
  subject: string;
  is_active: boolean;
}

// Sales Workflow Interfaces (Phase 5)

export interface Invoice {
  id: string;
  invoice_number: string;
  sales_order_id: string;
  customer_id: string;
  amount: number;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  status: string;
  payment_status: PaymentStatus;
  due_date: string | null;
  paid_at: string | null;
  pdf_url: string | null;
  notes: string | null;
  generated_at: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number: string | null;
  payment_date: string;
  notes: string | null;
  received_by: string | null;
  created_at: string;
}

export interface SalesReturn {
  id: string;
  return_number: string;
  sales_order_id: string;
  customer_id: string;
  status: ReturnStatus;
  reason: string;
  total_refund_amount: number;
  approved_by: string | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface SalesReturnItem {
  id: string;
  return_id: string;
  sales_order_item_id: string;
  product_id: string;
  quantity: number;
  reason: string | null;
  condition: ReturnCondition | null;
}
