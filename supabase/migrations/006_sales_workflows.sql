-- Phase 5: Sales Workflows - Stock Deduction, Invoicing, Returns, Payments
-- This migration alters the existing invoices table and adds payments, sales_returns, sales_return_items tables

-- ============================================================
-- ALTER existing invoices table to add new columns
-- ============================================================

-- Drop existing CHECK constraint on status column and indexes
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
DROP INDEX IF EXISTS idx_invoices_status;

-- Add new columns to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add new CHECK constraint for payment_status
ALTER TABLE invoices ADD CONSTRAINT invoices_payment_status_check
    CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'overdue', 'refunded'));

-- Keep backward compat: update status CHECK to new values
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check
    CHECK (status IN ('paid', 'unpaid', 'overdue', 'cancelled', 'partial', 'refunded'));

-- ============================================================
-- Payments table
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'upi', 'cheque', 'credit', 'razorpay')),
    reference_number TEXT,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    received_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Sales Returns table
-- ============================================================

CREATE TABLE IF NOT EXISTS sales_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_number TEXT UNIQUE NOT NULL,
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    reason TEXT NOT NULL,
    total_refund_amount NUMERIC(12,2) DEFAULT 0,
    approved_by UUID REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================================
-- Sales Return Items table
-- ============================================================

CREATE TABLE IF NOT EXISTS sales_return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID NOT NULL REFERENCES sales_returns(id) ON DELETE CASCADE,
    sales_order_item_id UUID NOT NULL REFERENCES sales_order_items(id),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    reason TEXT,
    condition TEXT CHECK (condition IN ('resellable', 'damaged', 'defective'))
);

-- ============================================================
-- ALTER sales_orders to add delivery tracking columns
-- ============================================================

ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS invoice_id UUID;

-- ============================================================
-- Sequences (invoice_number_seq already exists in 003_functions.sql)
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS return_number_seq START WITH 1 INCREMENT BY 1;

-- ============================================================
-- Number generators
-- ============================================================

-- Override generate_invoice_number with year-based format
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_return_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'RET-' || LPAD(nextval('return_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_return_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view payments" ON payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth insert payments" ON payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth view returns" ON sales_returns FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth manage returns" ON sales_returns FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth view return items" ON sales_return_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth insert return items" ON sales_return_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_invoices_order ON invoices(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_returns_order ON sales_returns(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_returns_customer ON sales_returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON sales_returns(status);
CREATE INDEX IF NOT EXISTS idx_return_items_return ON sales_return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_return_items_product ON sales_return_items(product_id);
