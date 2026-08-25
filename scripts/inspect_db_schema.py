import psycopg2

conn = psycopg2.connect('postgresql://postgres:Dikshu%40143644@db.dkypdrocnebusgdlndhn.supabase.co:5432/postgres')
cur = conn.cursor()

tables = ['customers', 'suppliers', 'purchase_orders', 'purchase_order_items', 'sales_orders', 'sales_order_items', 'sales_returns']
for table in tables:
    cur.execute(f"SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='{table}' ORDER BY ordinal_position;")
    cols = cur.fetchall()
    print(f"=== {table} ({len(cols)} cols) ===")
    for c in cols:
        print("  ", c)

print("\n=== RLS Policies ===")
cur.execute("SELECT tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname='public';")
for p in cur.fetchall():
    print("  ", p)

conn.close()
