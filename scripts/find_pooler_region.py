import pg8000.native

regions = [
    "us-east-1", "us-west-1", "us-east-2", "eu-central-1", "eu-west-1", "eu-west-2", "eu-west-3", 
    "ap-southeast-1", "ap-southeast-2", "ap-south-1", "ap-northeast-1", "ap-northeast-2", "ca-central-1", "sa-east-1"
]

project_ref = "dkypdrocnebusgdlndhn"

for reg in regions:
    host = f"aws-0-{reg}.pooler.supabase.com"
    for pwd in ["Dikshu@143644***", "Dikshu@143644"]:
        try:
            conn = pg8000.native.Connection(
                user=f"postgres.{project_ref}",
                password=pwd,
                host=host,
                port=6543,
                database="postgres",
                ssl_context=True,
                timeout=3
            )
            print(f"SUCCESS! Connected to {host}:6543 with password {pwd}")
            conn.close()
            exit(0)
        except Exception as e:
            msg = str(e)
            if "tenant/user" not in msg:
                print(f"Region {reg}: {msg[:100]}")
