-- StockFlow - Inventory Workflows Migration
-- Adds: stock_transfers, stock_transfer_items, goods_received_notes, grn_items, stock_adjustment_reasons

-- Transfer requests table
CREATE TABLE stock_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_number TEXT UNIQUE NOT NULL,
    source_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    destination_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_transit', 'completed', 'rejected')),
    requested_by UUID NOT NULL REFERENCES profiles(id),
    approved_by UUID REFERENCES profiles(id),
    rejected_by UUID REFERENCES profiles(id),
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT chk_different_warehouses CHECK (source_warehouse_id != destination_warehouse_id)
);

-- Transfer items
CREATE TABLE stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    requested_quantity INTEGER NOT NULL CHECK (requested_quantity > 0),
    transferred_quantity INTEGER DEFAULT 0,
    notes TEXT
);

-- Goods Received Notes
CREATE TABLE goods_received_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_number TEXT UNIQUE NOT NULL,
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    received_by UUID NOT NULL REFERENCES profiles(id),
    supplier_invoice_number TEXT,
    notes TEXT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GRN items (what was actually received in this batch)
CREATE TABLE grn_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_id UUID NOT NULL REFERENCES goods_received_notes(id) ON DELETE CASCADE,
    purchase_order_item_id UUID NOT NULL REFERENCES purchase_order_items(id),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity_received INTEGER NOT NULL CHECK (quantity_received > 0),
    quantity_rejected INTEGER DEFAULT 0,
    rejection_reason TEXT,
    batch_number TEXT,
    expiry_date DATE
);

-- Stock adjustment reasons table
CREATE TABLE stock_adjustment_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    requires_approval BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true
);

-- Seed default reasons
INSERT INTO stock_adjustment_reasons (code, name, description, requires_approval) VALUES
('damaged', 'Damaged Goods', 'Stock damaged during storage or handling', false),
('expired', 'Expired Products', 'Products past their expiry date', false),
('theft', 'Theft / Loss', 'Stock lost due to theft or unaccounted loss', true),
('count_correction', 'Count Correction', 'Correction after physical stock count', true),
('quality_reject', 'Quality Rejection', 'Products failing quality inspection', false),
('sample', 'Sample / Testing', 'Stock used for samples or quality testing', false),
('other', 'Other', 'Other reasons - specify in notes', true);

-- Sequence for transfer numbers
CREATE SEQUENCE transfer_number_seq START WITH 1 INCREMENT BY 1;

-- Function to generate transfer number
CREATE OR REPLACE FUNCTION generate_transfer_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'TRF-' || LPAD(nextval('transfer_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Sequence for GRN numbers
CREATE SEQUENCE grn_number_seq START WITH 1 INCREMENT BY 1;

-- Function to generate GRN number
CREATE OR REPLACE FUNCTION generate_grn_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'GRN-' || LPAD(nextval('grn_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- RLS policies for new tables
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_received_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grn_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustment_reasons ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read transfers and GRNs
CREATE POLICY "Authenticated users can view transfers" ON stock_transfers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert transfers" ON stock_transfers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update transfers" ON stock_transfers FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view transfer items" ON stock_transfer_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert transfer items" ON stock_transfer_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view GRNs" ON goods_received_notes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert GRNs" ON goods_received_notes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view GRN items" ON grn_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert GRN items" ON grn_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Anyone can view adjustment reasons" ON stock_adjustment_reasons FOR SELECT USING (true);

-- Add updated_at trigger for stock_transfers
CREATE TRIGGER trigger_stock_transfers_updated_at
BEFORE UPDATE ON stock_transfers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add indexes
CREATE INDEX idx_stock_transfers_status ON stock_transfers(status);
CREATE INDEX idx_stock_transfers_source ON stock_transfers(source_warehouse_id);
CREATE INDEX idx_stock_transfers_dest ON stock_transfers(destination_warehouse_id);
CREATE INDEX idx_grn_po ON goods_received_notes(purchase_order_id);
CREATE INDEX idx_grn_items_grn ON grn_items(grn_id);
CREATE INDEX idx_stock_transfer_items_transfer ON stock_transfer_items(transfer_id);
