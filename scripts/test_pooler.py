import pg8000.native

hosts = [
    ("aws-0-ap-south-1.pooler.supabase.com", 6543, "postgres.dkypdrocnebusgdlndhn"),
    ("aws-0-ap-south-1.pooler.supabase.com", 5432, "postgres.dkypdrocnebusgdlndhn"),
    ("db.dkypdrocnebusgdlndhn.supabase.co", 6543, "postgres"),
    ("db.dkypdrocnebusgdlndhn.supabase.co", 5432, "postgres")
]

for host, port, user in hosts:
    for pwd in ["Dikshu@143644***", "Dikshu@143644"]:
        try:
            print(f"Testing {host}:{port} with user={user}...")
            conn = pg8000.native.Connection(
                user=user,
                password=pwd,
                host=host,
                port=port,
                database="postgres",
                ssl_context=True,
                timeout=5
            )
            print(f"  ✓ Connected successfully to {host}:{port}!")
            conn.close()
            break
        except Exception as e:
            print(f"  ✗ Failed: {e}")
