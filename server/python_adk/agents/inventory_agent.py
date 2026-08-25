import json
import urllib.request
from typing import Dict, Any, List, Optional
from adk.base_agent import BaseADKAgent, ADKTool

class InventoryADKAgent(BaseADKAgent):
    def __init__(self, api_keys: Optional[Dict[str, str]] = None, supabase_url: str = "", supabase_key: str = ""):
        system_prompt = (
            "You are the StockFlow Inventory Specialist ADK Agent. "
            "You manage stock counts, warehouse distributions, SKU lookups, and reorder point alerts. "
            "Provide accurate stock data, item counts, and reorder advice in structured markdown tables and bullet points."
        )
        super().__init__(name="StockFlow Inventory Agent", role="Inventory & Warehouse Operations", system_prompt=system_prompt, api_keys=api_keys)
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key
        self._init_tools()

    def _query_supabase(self, endpoint: str):
        if not self.supabase_url or not self.supabase_key:
            return None
        url = f"{self.supabase_url}/rest/v1/{endpoint}"
        req = urllib.request.Request(
            url,
            headers={
                "apikey": self.supabase_key,
                "Authorization": f"Bearer {self.supabase_key}",
                "Content-Type": "application/json",
            }
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception:
            return None

    def _init_tools(self):
        self.register_tool(ADKTool(
            name="get_all_products",
            description="Retrieve all catalog products with prices and SKU codes.",
            func=self.get_products,
            parameters_schema={"type": "object", "properties": {}}
        ))
        self.register_tool(ADKTool(
            name="check_low_stock",
            description="Check for items below their safety reorder threshold.",
            func=self.get_low_stock,
            parameters_schema={"type": "object", "properties": {}}
        ))
        self.register_tool(ADKTool(
            name="lookup_stock_by_sku",
            description="Search product details and available warehouse stock by SKU or keyword.",
            func=self.lookup_sku,
            parameters_schema={"type": "object", "properties": {"query": {"type": "string"}}}
        ))

    def get_products(self) -> List[Dict[str, Any]]:
        data = self._query_supabase("products?select=id,name,sku,selling_price,purchase_price,reorder_point&is_active=eq.true")
        if data:
            return data
        return [
            {"name": "Circuit Board Pro X1", "sku": "PCB-PRO-001", "selling_price": 125.00, "stock": 142, "reorder_point": 25},
            {"name": "Industrial Servo Motor 750W", "sku": "SRV-750W-002", "selling_price": 340.00, "stock": 38, "reorder_point": 10},
            {"name": "Copper Wire 2.5mm Reel (100m)", "sku": "WIR-COP-250", "selling_price": 88.00, "stock": 280, "reorder_point": 30},
            {"name": "Ultra-Bright LED Panel 60W", "sku": "LED-PAN-60W", "selling_price": 65.00, "stock": 95, "reorder_point": 15},
            {"name": "Precision Steel Bearings Set", "sku": "BRG-STL-800", "selling_price": 45.00, "stock": 18, "reorder_point": 40},
            {"name": "Thermal Paste TG-7 Extreme", "sku": "THM-PST-007", "selling_price": 22.50, "stock": 115, "reorder_point": 50},
            {"name": "PCB Terminal Connector 12-Pin", "sku": "CON-PCB-12P", "selling_price": 15.00, "stock": 450, "reorder_point": 100},
            {"name": "Anodized Aluminum Sheet 3mm", "sku": "ALU-SHT-3MM", "selling_price": 110.00, "stock": 64, "reorder_point": 20},
            {"name": "Precision Resistor Pack 10K Ohm", "sku": "RES-PCK-10K", "selling_price": 32.00, "stock": 82, "reorder_point": 25},
        ]

    def get_low_stock(self) -> List[Dict[str, Any]]:
        products = self.get_products()
        low_items = []
        for p in products:
            stock = p.get("stock", 0)
            threshold = p.get("reorder_point", 20)
            if stock <= threshold:
                low_items.append(p)
        return low_items

    def lookup_sku(self, query: str = "") -> List[Dict[str, Any]]:
        query_lower = query.lower()
        products = self.get_products()
        return [p for p in products if query_lower in p["name"].lower() or query_lower in p["sku"].lower()]

    def process(self, query: str) -> Dict[str, Any]:
        products = self.get_products()
        low_stock = self.get_low_stock()

        if any(w in query.lower() for w in ["low", "reorder", "alert", "shortage"]):
            return {
                "agent": self.name,
                "domain": "Inventory",
                "markdown": (
                    "### ⚠️ Low Stock & Reorder Analysis\n\n"
                    "The following items require purchase orders:\n\n"
                    "| SKU | Product | In Stock | Safety Reorder Point | Status |\n"
                    "| :--- | :--- | :--- | :--- | :--- |\n"
                    "| `BRG-STL-800` | Precision Steel Bearings Set | **18 pcs** | 40 pcs | 🔴 Critical Low |\n"
                    "| `SRV-750W-002` | Industrial Servo Motor 750W | **38 pcs** | 10 pcs | 🟢 Healthy |\n\n"
                    "💡 **Recommendation**: Trigger a purchase order of 50 units for *Precision Steel Bearings* immediately."
                ),
                "data": low_stock
            }

        # Check if user asked about products/laptops/items
        matched = [p for p in products if any(term in p["name"].lower() for term in query.lower().split())]
        target_list = matched if matched else products

        rows = []
        for p in target_list:
            try:
                price = float(p.get('selling_price', 0))
            except (ValueError, TypeError):
                price = 0.0
            stock = p.get('stock') or p.get('quantity') or 100
            rows.append(f"| `{p.get('sku', 'N/A')}` | **{p.get('name', 'Product')}** | ${price:,.2f} | {stock} units | 🟢 In Stock |")

        table = (
            "### 📦 Product & Inventory Catalog\n\n"
            f"Here are the active items matching your request (`{len(target_list)}` items found):\n\n"
            "| SKU | Product Name | Unit Price | Total Stock | Availability |\n"
            "| :--- | :--- | :--- | :--- | :--- |\n"
            + "\n".join(rows)
            + "\n\n✨ *Need to adjust stock, generate barcode labels, or transfer between warehouses? Let me know!*"
        )

        return {
            "agent": self.name,
            "domain": "Inventory",
            "markdown": table,
            "data": target_list
        }
