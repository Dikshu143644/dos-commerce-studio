-- StockFlow - Database Functions

-- Function to log audit events (bypasses RLS)
CREATE OR REPLACE FUNCTION log_audit_event(
    p_user_id UUID,
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
    VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_old_values, p_new_values, p_ip_address, p_user_agent)
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update stock quantity after a movement
CREATE OR REPLACE FUNCTION update_stock_quantity()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure inventory record exists
    INSERT INTO inventory (product_id, warehouse_id, quantity)
    VALUES (NEW.product_id, NEW.warehouse_id, 0)
    ON CONFLICT (product_id, warehouse_id) DO NOTHING;

    -- Update quantity based on movement type
    IF NEW.type IN ('in', 'return') THEN
        UPDATE inventory
        SET quantity = quantity + NEW.quantity
        WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id;
    ELSIF NEW.type IN ('out', 'transfer') THEN
        UPDATE inventory
        SET quantity = quantity - NEW.quantity
        WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id;
    ELSIF NEW.type = 'adjustment' THEN
        -- For adjustments, quantity can be positive (adding) or negative (removing)
        UPDATE inventory
        SET quantity = quantity + NEW.quantity
        WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update stock on movement insert
CREATE TRIGGER trigger_update_stock_quantity
AFTER INSERT ON stock_movements
FOR EACH ROW EXECUTE FUNCTION update_stock_quantity();

-- Sequences for generating unique, gap-free document numbers
-- Using PostgreSQL SEQUENCE objects ensures uniqueness under concurrent inserts
CREATE SEQUENCE po_number_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE order_number_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE invoice_number_seq START WITH 1 INCREMENT BY 1;

-- Function to generate sequential PO numbers
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
    v_number TEXT;
BEGIN
    v_number := 'PO-' || LPAD(nextval('po_number_seq')::TEXT, 6, '0');
    RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate sequential SO numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    v_number TEXT;
BEGIN
    v_number := 'SO-' || LPAD(nextval('order_number_seq')::TEXT, 6, '0');
    RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate sequential invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    v_number TEXT;
BEGIN
    v_number := 'INV-' || LPAD(nextval('invoice_number_seq')::TEXT, 6, '0');
    RETURN v_number;
END;
$$ LANGUAGE plpgsql;
