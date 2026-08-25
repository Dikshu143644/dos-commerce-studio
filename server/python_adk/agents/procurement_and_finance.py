import json
import urllib.request
from typing import Dict, Any, List, Optional
from adk.base_agent import BaseADKAgent, ADKTool

class ProcurementADKAgent(BaseADKAgent):
    def __init__(self, api_keys: Optional[Dict[str, str]] = None, supabase_url: str = "", supabase_key: str = ""):
        system_prompt = (
            "You are the StockFlow Procurement & Supplier Operations ADK Agent. "
            "You manage vendor ratings, purchase orders, supply lead times, and fulfillment."
        )
        super().__init__(name="StockFlow Procurement Agent", role="Procurement & Vendor Management", system_prompt=system_prompt, api_keys=api_keys)
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key

    def get_suppliers(self) -> List[Dict[str, Any]]:
        return [
            {"company_name": "MicroChip & Semiconductor Tech Corp", "contact_person": "David Chang", "email": "orders@microchiptech.corp", "rating": 5},
            {"company_name": "Bharat Precision Motors Pvt Ltd", "contact_person": "Rajesh Kulkarni", "email": "sales@bharatmotors.in", "rating": 4},
            {"company_name": "Indo-Copper Smelting & Wireworks", "contact_person": "Suresh Patel", "email": "commercial@indocopper.com", "rating": 5},
        ]

    def process(self, query: str) -> Dict[str, Any]:
        suppliers = self.get_suppliers()
        rows = [f"| **{s['company_name']}** | {s['contact_person']} | `{s['email']}` | ⭐ {s['rating']}/5 |" for s in suppliers]

        markdown = (
            "### 🏭 Procurement & Supplier Directory\n\n"
            "| Supplier Organization | Key Contact | Email | Reliability Rating |\n"
            "| :--- | :--- | :--- | :--- |\n"
            + "\n".join(rows)
            + "\n\n📋 **Active Purchase Orders**:\n"
            + "- `PO-2026-089`: MicroChip & Semiconductor Tech Corp — **$14,250.00** *(Shipped / In Transit)*\n"
            + "- `PO-2026-092`: Bharat Precision Motors — **$8,500.00** *(Awaiting Approval)*"
        )
        return {"agent": self.name, "domain": "Procurement", "markdown": markdown, "data": suppliers}

class FinanceADKAgent(BaseADKAgent):
    def __init__(self, api_keys: Optional[Dict[str, str]] = None, supabase_url: str = "", supabase_key: str = ""):
        system_prompt = (
            "You are the StockFlow Financial Analytics & Executive Reporting ADK Agent. "
            "You calculate gross profit margins, revenue growth, cash flow forecasts, and KPI health."
        )
        super().__init__(name="StockFlow Finance Agent", role="Financial Intelligence & KPI Synthesis", system_prompt=system_prompt, api_keys=api_keys)
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key

    def process(self, query: str) -> Dict[str, Any]:
        markdown = (
            "### 📊 Financial Performance & Revenue Summary\n\n"
            "- **Monthly Gross Revenue**: `$284,500.00` *(+14.2% MoM)*\n"
            "- **Cost of Goods Sold (COGS)**: `$158,200.00`\n"
            "- **Gross Profit Margin**: **44.4%** 📈\n"
            "- **Outstanding Invoices (A/R)**: `$38,400.00` *(3 invoices due in 7 days)*\n"
            "- **Total Inventory Asset Valuation**: `$462,800.00`\n\n"
            "💡 **Executive Insight**: Profit margins are strongest on *Electronics & PCB* (58.4%), while *Wiring & Connectors* has the highest inventory turnover (4.2x/yr)."
        )
        return {"agent": self.name, "domain": "Finance", "markdown": markdown, "data": {"revenue": 284500, "margin": 44.4}}
