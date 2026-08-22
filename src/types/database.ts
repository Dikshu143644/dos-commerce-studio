// Enums matching Supabase database schema
export type MovementType = 'in' | 'out' | 'transfer' | 'adjustment';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
export type LeadSource = 'website' | 'referral' | 'cold_call' | 'social_media' | 'trade_show' | 'email' | 'other';
export type DealStage = 'discovery' | 'proposal' | 'negotiation' | 'contract' | 'closed_won' | 'closed_lost';
export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task' | 'follow_up';
export type OrderStatus = 'draft' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type POStatus = 'draft' | 'submitted' | 'approved' | 'received' | 'partially_received' | 'cancelled';
export type NotificationType = 'info' | 'warning' | 'error' | 'success' | 'stock_alert' | 'order_update' | 'crm_activity';
export type CustomerType = 'individual' | 'business';
export type AgentType = 'demand_forecast' | 'inventory_optimizer' | 'crm_analyzer' | 'general';

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
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
