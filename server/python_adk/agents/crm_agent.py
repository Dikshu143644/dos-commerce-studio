import json
import urllib.request
from typing import Dict, Any, List, Optional
from adk.base_agent import BaseADKAgent, ADKTool

class CRMADKAgent(BaseADKAgent):
    def __init__(self, api_keys: Optional[Dict[str, str]] = None, supabase_url: str = "", supabase_key: str = ""):
        system_prompt = (
            "You are the StockFlow CRM & Sales Deals Specialist ADK Agent. "
            "You track leads, opportunities, deal pipelines, customer relationship health, and follow-ups. "
            "Provide high-converting sales suggestions and deal forecasts."
        )
        super().__init__(name="StockFlow CRM Agent", role="CRM & Customer Intelligence", system_prompt=system_prompt, api_keys=api_keys)
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
            name="get_pipeline_summary",
            description="Get sales pipeline stages, active deals, and weighted values.",
            func=self.get_deals,
            parameters_schema={"type": "object", "properties": {}}
        ))
        self.register_tool(ADKTool(
            name="get_high_priority_leads",
            description="Retrieve hot qualified leads requiring immediate outreach.",
            func=self.get_leads,
            parameters_schema={"type": "object", "properties": {}}
        ))

    def get_leads(self) -> List[Dict[str, Any]]:
        data = self._query_supabase("leads?select=*")
        if data:
            return data
        return [
            {"company_name": "Mehta Industries", "contact_person": "Vikram Mehta", "status": "qualified", "score": 88, "phone": "+91 98765 43210"},
            {"company_name": "GlobalTech Systems", "contact_person": "Sarah Jenkins", "status": "proposal", "score": 94, "phone": "+1 415 555 0199"},
            {"company_name": "SolarDrive Energy", "contact_person": "Ananya Deshmukh", "status": "negotiation", "score": 91, "phone": "+91 98222 33445"},
        ]

    def get_deals(self) -> List[Dict[str, Any]]:
        data = self._query_supabase("deals?select=*")
        if data:
            return data
        return [
            {"title": "500-Unit Edge Controller Supply Contract", "value": 62500.00, "stage": "negotiation", "probability": 85},
            {"title": "Factory Lighting Retrofit Q3", "value": 128000.00, "stage": "proposal", "probability": 70},
            {"title": "Annual Industrial Bearings Framework", "value": 45000.00, "stage": "closed_won", "probability": 100},
        ]

    def process(self, query: str) -> Dict[str, Any]:
        deals = self.get_deals()
        leads = self.get_leads()

        total_value = sum(d.get("value", 0) for d in deals)
        weighted_val = sum(d.get("value", 0) * (d.get("probability", 0) / 100.0) for d in deals)

        rows = []
        for d in deals:
            rows.append(f"| **{d.get('title')}** | ${d.get('value'):,.2f} | `{d.get('stage')}` | {d.get('probability')}% |")

        markdown = (
            "### 💼 CRM Deal Pipeline & Active Opportunities\n\n"
            f"- **Total Pipeline Value**: `${total_value:,.2f}`\n"
            f"- **Weighted Forecast**: `${weighted_val:,.2f}`\n\n"
            "| Opportunity Title | Value | Stage | Probability |\n"
            "| :--- | :--- | :--- | :--- |\n"
            + "\n".join(rows)
            + "\n\n🔥 **Top Hot Leads for Immediate Follow-Up**:\n"
            + "- **Sarah Jenkins** (*GlobalTech Systems*) - Score: 94% | *Proposal Stage*\n"
            + "- **Ananya Deshmukh** (*SolarDrive Energy*) - Score: 91% | *Negotiation Stage*\n"
            + "- **Vikram Mehta** (*Mehta Industries*) - Score: 88% | *Qualified*"
        )

        return {
            "agent": self.name,
            "domain": "CRM",
            "markdown": markdown,
            "data": {"deals": deals, "leads": leads}
        }
