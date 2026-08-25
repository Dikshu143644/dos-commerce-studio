import os
import glob
import json
import urllib.request
import urllib.error

PROJECT_REF = os.getenv("SUPABASE_PROJECT_REF", "dkypdrocnebusgdlndhn")
ACCESS_TOKEN = os.getenv("SUPABASE_ACCESS_TOKEN", "")
API_URL = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"

def run_sql(query: str):
    req = urllib.request.Request(
        API_URL,
        data=json.dumps({"query": query}).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {ACCESS_TOKEN}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"HTTP Error {e.code}: {error_body}")
        return None

def main():
    print(f"Testing connection to Supabase project {PROJECT_REF}...")
    res = run_sql("SELECT version();")
    print("Version check:", res)

    migration_files = sorted(glob.glob("supabase/migrations/*.sql"))
    print(f"Found {len(migration_files)} migration files:")
    for f in migration_files:
        print(" -", f)

    for f in migration_files:
        print(f"\nApplying migration: {f}...")
        with open(f, "r", encoding="utf-8") as file:
            sql_content = file.read()
        res = run_sql(sql_content)
        if res is not None:
            print(f"Successfully applied {f}")
        else:
            print(f"Warning: Issue applying {f}")

    print("\nVerifying tables created:")
    tables_res = run_sql("SELECT table_name FROM information_schema.tables WHERE table_schema='public';")
    print("Public tables:", tables_res)

if __name__ == "__main__":
    main()
