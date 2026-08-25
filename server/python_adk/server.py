import json
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from agents.orchestrator import ADKOrchestrator

orchestrator = ADKOrchestrator()

class ADKServerHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_GET(self):
        if self.path == '/api/health':
            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "healthy", "service": "StockFlow Python ADK Engine"}).encode('utf-8'))
        elif self.path == '/api/ai/agents':
            self._set_headers(200)
            agents_info = [
                {"name": "StockFlow Inventory Agent", "domain": "Inventory & Stock", "status": "active"},
                {"name": "StockFlow CRM Agent", "domain": "Leads & Deals Pipeline", "status": "active"},
                {"name": "StockFlow Procurement Agent", "domain": "Suppliers & POs", "status": "active"},
                {"name": "StockFlow Finance Agent", "domain": "Revenue & KPIs", "status": "active"},
            ]
            self.wfile.write(json.dumps({"agents": agents_info}).encode('utf-8'))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode('utf-8'))

    def do_POST(self):
        if self.path in ['/api/ai/chat', '/api/ai/agents/execute-task']:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                body = json.loads(post_data.decode('utf-8')) if post_data else {}
                query = body.get('query') or body.get('message') or body.get('prompt') or ''
                if not query and isinstance(body.get('messages'), list) and len(body['messages']) > 0:
                    query = body['messages'][-1].get('content', '')

                result = orchestrator.route_and_execute(query)
                self._set_headers(200)
                self.wfile.write(json.dumps(result).encode('utf-8'))
            except Exception as e:
                import traceback
                traceback.print_exc()
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not Found"}).encode('utf-8'))

def run(port=8081):
    server_address = ('', port)
    httpd = HTTPServer(server_address, ADKServerHandler)
    print(f"[StockFlow] Python ADK Multi-Agent Server running on port {port}")
    httpd.serve_forever()

if __name__ == '__main__':
    run()
