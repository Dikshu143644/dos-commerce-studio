import json
import urllib.request
import urllib.error

SUPABASE_URL = "https://dkypdrocnebusgdlndhn.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRreXBkcm9jbmVidXNnZGxuZGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NjgxMzUsImV4cCI6MjEwMjQ0NDEzNX0.xhUHc9_8W3r7iT0Fr3ibmkVgNnq_6-pSBxiAnj63fcU"

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def get(endpoint):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return {"error": e.code, "msg": e.read().decode()}

def post(endpoint, data):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    req = urllib.request.Request(url, headers=headers, data=json.dumps(data).encode(), method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return {"error": e.code, "msg": e.read().decode()}

print("1. Customers table:")
custs = get("customers?limit=2")
print("  GET /customers:", custs)

print("\n  Testing insert with 'name' and 'company':")
ins1 = post("customers", {"name": "Omkar Supe", "company": "DOS", "email": "omkar@dos.com", "customer_type": "distributor", "is_active": True})
print("  Insert 1 result:", ins1)

print("\n  Testing insert with 'company_name' and 'contact_person':")
ins2 = post("customers", {"company_name": "DOS Technologies", "contact_person": "Omkar Supe", "email": "omkar@dos.com", "customer_type": "regular", "is_active": True})
print("  Insert 2 result:", ins2)

print("\n2. Suppliers table:")
supps = get("suppliers?limit=2")
print("  GET /suppliers:", supps)

print("\n  Testing insert supplier:")
ins_supp = post("suppliers", {
    "name": "Acme Supplier Inc",
    "contact_name": "John Doe",
    "email": "acme@supplier.com",
    "phone": "+91 98765 43210",
    "city": "Mumbai",
    "state": "Maharashtra",
    "is_active": True
})
print("  Insert supplier result:", ins_supp)

print("\n3. Purchase Orders table:")
pos = get("purchase_orders?limit=2")
print("  GET /purchase_orders:", pos)

print("\n4. Sales Orders table:")
sos = get("sales_orders?limit=2")
print("  GET /sales_orders:", sos)

print("\n5. Sales Returns table:")
rets = get("sales_returns?limit=2")
print("  GET /sales_returns:", rets)
