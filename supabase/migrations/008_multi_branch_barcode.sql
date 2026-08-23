-- Add barcode field to products if not exists
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode_format TEXT DEFAULT 'CODE128';

-- Create barcode index
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;

-- Branch-level settings
CREATE TABLE IF NOT EXISTS branch_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    setting_key TEXT NOT NULL,
    setting_value JSONB NOT NULL,
    UNIQUE(branch_id, setting_key)
);

-- User branch access (for multi-branch users)
CREATE TABLE IF NOT EXISTS user_branch_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    access_level TEXT NOT NULL DEFAULT 'member' CHECK (access_level IN ('member', 'manager', 'admin')),
    UNIQUE(user_id, branch_id)
);

-- RLS
ALTER TABLE branch_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_branch_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view branch settings" ON branch_settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth manage branch settings" ON branch_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth view branch access" ON user_branch_access FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth manage branch access" ON user_branch_access FOR ALL USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX idx_user_branch_access_user ON user_branch_access(user_id);
CREATE INDEX idx_user_branch_access_branch ON user_branch_access(branch_id);
CREATE INDEX idx_branch_settings_branch ON branch_settings(branch_id);

-- Add branch_id column to core entity tables for multi-branch filtering
ALTER TABLE products ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

-- Indexes for branch_id on each table
CREATE INDEX IF NOT EXISTS idx_products_branch ON products(branch_id) WHERE branch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_movements_branch ON stock_movements(branch_id) WHERE branch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_orders_branch ON sales_orders(branch_id) WHERE branch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchase_orders_branch ON purchase_orders(branch_id) WHERE branch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_branch ON deals(branch_id) WHERE branch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_branch ON leads(branch_id) WHERE branch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_branch ON inventory(branch_id) WHERE branch_id IS NOT NULL;
