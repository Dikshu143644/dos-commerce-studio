-- StockFlow - Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: users can read all profiles, update only their own
CREATE POLICY profiles_select ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY profiles_admin_all ON profiles FOR ALL USING (is_super_admin());

-- Branches: all authenticated users can read, admin can manage
CREATE POLICY branches_select ON branches FOR SELECT USING (true);
CREATE POLICY branches_admin ON branches FOR ALL USING (is_super_admin());

-- Roles: all can read, admin can manage
CREATE POLICY roles_select ON roles FOR SELECT USING (true);
CREATE POLICY roles_admin ON roles FOR ALL USING (is_super_admin());

-- Categories: all can read, managers+ can manage
CREATE POLICY categories_select ON categories FOR SELECT USING (true);
CREATE POLICY categories_manage ON categories FOR ALL USING (
    get_user_role() IN ('super_admin', 'admin', 'manager')
);

-- Products: all can read, staff+ can manage
CREATE POLICY products_select ON products FOR SELECT USING (true);
CREATE POLICY products_manage ON products FOR ALL USING (
    get_user_role() IN ('super_admin', 'admin', 'manager', 'staff')
);

-- Warehouses: all can read, managers+ can manage
CREATE POLICY warehouses_select ON warehouses FOR SELECT USING (true);
CREATE POLICY warehouses_manage ON warehouses FOR ALL USING (
    get_user_role() IN ('super_admin', 'admin', 'manager')
);

-- Inventory: all can read, staff+ can manage
CREATE POLICY inventory_select ON inventory FOR SELECT USING (true);
CREATE POLICY inventory_manage ON inventory FOR ALL USING (
    get_user_role() IN ('super_admin', 'admin', 'manager', 'staff')
);

-- Stock Movements: all can read, insert-only for staff+ (no updates/deletes)
CREATE POLICY stock_movements_select ON stock_movements FOR SELECT USING (true);
CREATE POLICY stock_movements_insert ON stock_movements FOR INSERT WITH CHECK (
    get_user_role() IN ('super_admin', 'admin', 'manager', 'staff')
);

-- Customers: all authenticated can read, sales team can manage
CREATE POLICY customers_select ON customers FOR SELECT USING (true);
CREATE POLICY customers_manage ON customers FOR ALL USING (
    get_user_role() IN ('super_admin', 'admin', 'manager', 'staff')
);

-- Leads: all can read, assigned user or manager+ can manage
CREATE POLICY leads_select ON leads FOR SELECT USING (true);
CREATE POLICY leads_manage ON leads FOR ALL USING (
    get_user_role() IN ('super_admin', 'admin', 'manager')
    OR assigned_to = auth.uid()
);
CREATE POLICY leads_insert ON leads FOR INSERT WITH CHECK (
    get_user_role() IN ('super_admin', 'admin', 'manager', 'staff')
);

-- Deals: all can read, assigned user or manager+ can manage
CREATE POLICY deals_select ON deals FOR SELECT USING (true);
CREATE POLICY deals_manage ON deals FOR ALL USING (
    get_user_role() IN ('super_admin', 'admin', 'manager')
    OR assigned_to = auth.uid()
);
CREATE POLICY deals_insert ON deals FOR INSERT WITH CHECK (
    get_user_role() IN ('super_admin', 'admin', 'manager', 'staff')
);

-- Activities: all can read, creator or assigned can manage
CREATE POLICY activities_select ON activities FOR SELECT USING (true);
CREATE POLICY activities_manage ON activities FOR ALL USING (
    get_user_role() IN ('super_admin', 'admin', 'manager')
    OR assigned_to = auth.uid()
);

-- Suppliers: all can read, procurement+ can manage
CREATE POLICY suppliers_select ON suppliers FOR SELECT USING (true);
CREATE POLICY suppliers_manage ON suppliers FOR ALL USING (
    get_user_role() IN ('super_admin', 'admin', 'manager', 'staff')
);

-- Purchase Orders: all can read, procurement can manage
CREATE POLICY po_select ON purchase_orders FOR SELECT USING (true);
CREATE POLICY po_manage ON purchase_orders FOR ALL USING (
    get_user_role() IN ('super_admin', 'admin', 'manager', 'staff')
);

-- Purchase Order Items: inherit PO access
CREATE POLICY poi_select ON purchase_order_items FOR SELECT USING (true);
CREATE POLICY poi_manage ON purchase_order_items FOR ALL USING (
    get_user_role() IN ('super_admin', 'admin', 'manager', 'staff')
);

-- Sales Orders: all can read, sales can manage
CREATE POLICY so_select ON sales_orders FOR SELECT USING (true);
CREATE POLICY so_manage ON sales_orders FOR ALL USING (
    get_user_role() IN ('super_admin', 'admin', 'manager', 'staff')
);

-- Sales Order Items: inherit SO access
CREATE POLICY soi_select ON sales_order_items FOR SELECT USING (true);
CREATE POLICY soi_manage ON sales_order_items FOR ALL USING (
    get_user_role() IN ('super_admin', 'admin', 'manager', 'staff')
);

-- Invoices: all can read, managers+ can manage
CREATE POLICY invoices_select ON invoices FOR SELECT USING (true);
CREATE POLICY invoices_manage ON invoices FOR ALL USING (
    get_user_role() IN ('super_admin', 'admin', 'manager')
);

-- Notifications: users can only see their own
CREATE POLICY notifications_own ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notifications_update ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY notifications_admin ON notifications FOR ALL USING (is_super_admin());

-- Audit Logs: read only for admins and auditors, insert via function only
CREATE POLICY audit_logs_read ON audit_logs FOR SELECT USING (
    get_user_role() IN ('super_admin', 'admin', 'auditor')
);
