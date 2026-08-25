import pg8000.native

conn = pg8000.native.Connection(
    user="postgres.dkypdrocnebusgdlndhn",
    password="Dikshu@143644***",
    host="aws-0-ap-northeast-1.pooler.supabase.com",
    port=6543,
    database="postgres",
    ssl_context=True
)

conn.run("""
-- Defaults for purchase_orders
ALTER TABLE purchase_orders ALTER COLUMN tax_amount SET DEFAULT 0;
ALTER TABLE purchase_orders ALTER COLUMN discount_amount SET DEFAULT 0;
ALTER TABLE purchase_orders ALTER COLUMN total_amount SET DEFAULT 0;

-- Defaults for purchase_order_items
ALTER TABLE purchase_order_items ALTER COLUMN received_quantity SET DEFAULT 0;
ALTER TABLE purchase_order_items ALTER COLUMN total SET DEFAULT 0;

-- Defaults for sales_orders
ALTER TABLE sales_orders ALTER COLUMN subtotal SET DEFAULT 0;
ALTER TABLE sales_orders ALTER COLUMN tax_amount SET DEFAULT 0;
ALTER TABLE sales_orders ALTER COLUMN discount_amount SET DEFAULT 0;
ALTER TABLE sales_orders ALTER COLUMN total_amount SET DEFAULT 0;

-- Defaults for sales_order_items
ALTER TABLE sales_order_items ALTER COLUMN discount SET DEFAULT 0;
ALTER TABLE sales_order_items ALTER COLUMN total SET DEFAULT 0;
""")

print("Sensible defaults added successfully!")
conn.close()
