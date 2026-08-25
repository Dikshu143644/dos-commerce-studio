import os
from supabase import create_client

url = "https://dkypdrocnebusgdlndhn.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRreXBkcm9jbmVidXNnZGxuZGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NjgxMzUsImV4cCI6MjEwMjQ0NDEzNX0.xhUHc9_8W3r7iT0Fr3ibmkVgNnq_6-pSBxiAnj63fcU"

supabase = create_client(url, key)

print("1. Testing Customers:")
try:
    res = supabase.from_("customers").select("*").limit(3).execute()
    print("  SELECT success, rows:", len(res.data))
    if len(res.data) > 0:
        print("  Sample row keys:", list(res.data[0].keys()))
except Exception as e:
    print("  SELECT Error:", e)

try:
    test_cust = {
        "name": "Test Customer Python",
        "company": "DOS Test",
        "email": "test@dos.com",
        "phone": "+91 99999 88888",
        "customer_type": "distributor",
        "is_active": True
    }
    insert_res = supabase.from_("customers").insert(test_cust).execute()
    print("  INSERT with name/company success:", insert_res.data)
except Exception as e:
    print("  INSERT with name/company Error:", e)

try:
    test_cust_pg = {
        "company_name": "DOS Test PG",
        "contact_person": "Omkar Supe",
        "email": "omkar@dos.com",
        "phone": "+91 76669 71183",
        "customer_type": "regular",
        "is_active": True
    }
    insert_pg_res = supabase.from_("customers").insert(test_cust_pg).execute()
    print("  INSERT with company_name/contact_person success:", insert_pg_res.data)
except Exception as e:
    print("  INSERT with company_name/contact_person Error:", e)

print("\n2. Testing Suppliers:")
try:
    s_res = supabase.from_("suppliers").select("*").limit(3).execute()
    print("  SELECT success, rows:", len(s_res.data))
    if len(s_res.data) > 0:
        print("  Sample row keys:", list(s_res.data[0].keys()))
except Exception as e:
    print("  SELECT Error:", e)

print("\n3. Testing Purchase Orders:")
try:
    po_res = supabase.from_("purchase_orders").select("*").limit(3).execute()
    print("  SELECT success, rows:", len(po_res.data))
    if len(po_res.data) > 0:
        print("  Sample row keys:", list(po_res.data[0].keys()))
except Exception as e:
    print("  SELECT Error:", e)

print("\n4. Testing Sales Orders:")
try:
    so_res = supabase.from_("sales_orders").select("*").limit(3).execute()
    print("  SELECT success, rows:", len(so_res.data))
    if len(so_res.data) > 0:
        print("  Sample row keys:", list(so_res.data[0].keys()))
except Exception as e:
    print("  SELECT Error:", e)

print("\n5. Testing Sales Returns:")
try:
    ret_res = supabase.from_("sales_returns").select("*").limit(3).execute()
    print("  SELECT success, rows:", len(ret_res.data))
    if len(ret_res.data) > 0:
        print("  Sample row keys:", list(ret_res.data[0].keys()))
except Exception as e:
    print("  SELECT Error:", e)
