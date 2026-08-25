import urllib.request
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def test_query(prompt: str):
    print(f"\n--- Testing ADK Query: '{prompt}' ---")
    req = urllib.request.Request(
        "http://localhost:8081/api/ai/chat",
        data=json.dumps({"query": prompt}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print(f"Agent: {data.get('agent')} (Domain: {data.get('domain')})")
            print("Response Markdown:\n" + data.get('markdown', ''))
    except Exception as e:
        print("Error:", e)

def main():
    test_query("tell me your laptops and electronic products")
    test_query("what are our high priority deals and CRM leads?")
    test_query("show me low stock items and reorder alerts")
    test_query("what is our current revenue and profit margin?")

if __name__ == "__main__":
    main()
