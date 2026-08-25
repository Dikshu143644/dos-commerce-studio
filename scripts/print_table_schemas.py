import pg8000.native

conn = pg8000.native.Connection(
    user="postgres.dkypdrocnebusgdlndhn",
    password="Dikshu@143644***",
    host="aws-0-ap-northeast-1.pooler.supabase.com",
    port=6543,
    database="postgres",
    ssl_context=True
)

for t in ['purchase_orders', 'purchase_order_items', 'sales_orders', 'sales_order_items', 'suppliers']:
    cols = conn.run(f"SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='{t}' ORDER BY ordinal_position;")
    print(f"=== {t} ===")
    for c in cols:
        print(f"  {c[0]} ({c[1]}, nullable={c[2]})")

conn.close()
