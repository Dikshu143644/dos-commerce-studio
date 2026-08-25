import pg8000.native

conn = pg8000.native.Connection(
    user="postgres.dkypdrocnebusgdlndhn",
    password="Dikshu@143644***",
    host="aws-0-ap-northeast-1.pooler.supabase.com",
    port=6543,
    database="postgres",
    ssl_context=True
)

print("Connected to Supabase PostgreSQL!")

# 1. RLS and Table Grants
tables = [
    'customers',
    'suppliers',
    'purchase_orders',
    'purchase_order_items',
    'sales_orders',
    'sales_order_items',
    'sales_returns',
    'sales_return_items',
    'products',
    'categories',
    'warehouses',
    'inventory_items',
    'inventory_movements',
    'leads',
    'deals',
    'invoices',
    'payments',
    'activities',
    'audit_logs',
    'profiles',
    'users'
]

for table in tables:
    try:
        check = conn.run(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table}');")
        if check[0][0]:
            conn.run(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
            conn.run(f"DROP POLICY IF EXISTS allow_all_{table} ON {table};")
            conn.run(f"DROP POLICY IF EXISTS allow_anon_all_{table} ON {table};")
            conn.run(f"DROP POLICY IF EXISTS allow_authenticated_all_{table} ON {table};")
            conn.run(f"CREATE POLICY allow_all_{table} ON {table} FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);")
            conn.run(f"GRANT ALL ON {table} TO anon, authenticated, service_role;")
            print(f"  [OK] {table}: RLS & permissions granted")
    except Exception as e:
        print(f"  [ERROR] {table} RLS error: {e}")

# 2. Add compatibility columns to customers table
try:
    conn.run("ALTER TABLE customers ALTER COLUMN company_name DROP NOT NULL;")
    conn.run("ALTER TABLE customers ADD COLUMN IF NOT EXISTS name TEXT;")
    conn.run("ALTER TABLE customers ADD COLUMN IF NOT EXISTS company TEXT;")
    conn.run("ALTER TABLE customers ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';")
    conn.run("ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;")
    conn.run("ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0;")
    conn.run("ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_spent DECIMAL(12,2) DEFAULT 0;")
    
    # Sync existing rows
    conn.run("UPDATE customers SET name = COALESCE(name, contact_person, company_name) WHERE name IS NULL;")
    conn.run("UPDATE customers SET company = COALESCE(company, company_name) WHERE company IS NULL;")
    conn.run("UPDATE customers SET company_name = COALESCE(company_name, company, name) WHERE company_name IS NULL;")
    conn.run("UPDATE customers SET contact_person = COALESCE(contact_person, name) WHERE contact_person IS NULL;")
    
    # Trigger to keep name/company and contact_person/company_name in sync
    conn.run("""
    CREATE OR REPLACE FUNCTION sync_customers_columns()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.company_name := COALESCE(NEW.company_name, NEW.company, NEW.name, 'Default Company');
        NEW.company := COALESCE(NEW.company, NEW.company_name);
        NEW.contact_person := COALESCE(NEW.contact_person, NEW.name, 'Default Contact');
        NEW.name := COALESCE(NEW.name, NEW.contact_person, NEW.company_name);
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    DROP TRIGGER IF EXISTS trg_sync_customers ON customers;
    CREATE TRIGGER trg_sync_customers
    BEFORE INSERT OR UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION sync_customers_columns();
    """)
    print("  [OK] customers table: compatibility columns and sync triggers created")
except Exception as e:
    print("  [ERROR] customers migration error:", e)

# 3. Add compatibility columns to suppliers table
try:
    conn.run("ALTER TABLE suppliers ALTER COLUMN company_name DROP NOT NULL;")
    conn.run("ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS name TEXT;")
    conn.run("ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_name TEXT;")
    conn.run("ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';")
    conn.run("ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS notes TEXT;")
    
    # Sync existing rows
    conn.run("UPDATE suppliers SET name = COALESCE(name, company_name) WHERE name IS NULL;")
    conn.run("UPDATE suppliers SET contact_name = COALESCE(contact_name, contact_person) WHERE contact_name IS NULL;")
    conn.run("UPDATE suppliers SET company_name = COALESCE(company_name, name) WHERE company_name IS NULL;")
    conn.run("UPDATE suppliers SET contact_person = COALESCE(contact_person, contact_name) WHERE contact_person IS NULL;")
    
    # Trigger to keep suppliers in sync
    conn.run("""
    CREATE OR REPLACE FUNCTION sync_suppliers_columns()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.company_name := COALESCE(NEW.company_name, NEW.name, 'Default Supplier');
        NEW.name := COALESCE(NEW.name, NEW.company_name);
        NEW.contact_person := COALESCE(NEW.contact_person, NEW.contact_name, 'Contact Person');
        NEW.contact_name := COALESCE(NEW.contact_name, NEW.contact_person);
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    DROP TRIGGER IF EXISTS trg_sync_suppliers ON suppliers;
    CREATE TRIGGER trg_sync_suppliers
    BEFORE INSERT OR UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION sync_suppliers_columns();
    """)
    print("  [OK] suppliers table: compatibility columns and sync triggers created")
except Exception as e:
    print("  [ERROR] suppliers migration error:", e)

# 4. Purchase orders & Sales orders helper functions and sequences
try:
    conn.run("""
    CREATE OR REPLACE FUNCTION generate_po_number()
    RETURNS TEXT AS $$
    DECLARE
        next_num BIGINT;
    BEGIN
        SELECT COALESCE(COUNT(*), 0) + 1 INTO next_num FROM purchase_orders;
        RETURN 'PO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(next_num::TEXT, 4, '0');
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE OR REPLACE FUNCTION generate_sales_order_number()
    RETURNS TEXT AS $$
    DECLARE
        next_num BIGINT;
    BEGIN
        SELECT COALESCE(COUNT(*), 0) + 1 INTO next_num FROM sales_orders;
        RETURN 'SO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(next_num::TEXT, 4, '0');
    END;
    $$ LANGUAGE plpgsql;
    """)
    print("  [OK] Sequences and generator functions created")
except Exception as e:
    print("  [ERROR] Sequences error:", e)

conn.close()
print("\nMigration completed successfully!")
