import os
from typing import Dict, Any, Optional
from agents.inventory_agent import InventoryADKAgent
from agents.crm_agent import CRMADKAgent
from agents.procurement_and_finance import ProcurementADKAgent, FinanceADKAgent
from agents.excel_agent import ExcelAutomationAgent

class ADKOrchestrator:
    def __init__(self, api_keys: Optional[Dict[str, str]] = None, supabase_url: str = "", supabase_key: str = ""):
        self.api_keys = api_keys or {
            "OPENAI_API_KEY": os.environ.get("OPENAI_API_KEY", ""),
            "ANTHROPIC_API_KEY": os.environ.get("ANTHROPIC_API_KEY", ""),
            "GEMINI_API_KEY": os.environ.get("GEMINI_API_KEY", ""),
            "OPENROUTER_API_KEY": os.environ.get("OPENROUTER_API_KEY", ""),
        }
        self.supabase_url = supabase_url or os.environ.get("VITE_SUPABASE_URL", "https://dkypdrocnebusgdlndhn.supabase.co")
        self.supabase_key = supabase_key or os.environ.get("VITE_SUPABASE_ANON_KEY", "")

        # Initialize Domain Agents
        self.inventory_agent = InventoryADKAgent(self.api_keys, self.supabase_url, self.supabase_key)
        self.crm_agent = CRMADKAgent(self.api_keys, self.supabase_url, self.supabase_key)
        self.procurement_agent = ProcurementADKAgent(self.api_keys, self.supabase_url, self.supabase_key)
        self.finance_agent = FinanceADKAgent(self.api_keys, self.supabase_url, self.supabase_key)
        self.excel_agent = ExcelAutomationAgent()

    def route_and_execute(self, user_query: str) -> Dict[str, Any]:
        query_lower = user_query.lower()

        # 1. Excel / Report / Import Intent
        if any(w in query_lower for w in ["excel", "export", "import", "spreadsheet", "csv", "xlsx", "download report"]):
            return self.excel_agent.process(user_query)

        # 2. CRM & Deals Intent
        elif any(w in query_lower for w in ["lead", "deal", "pipeline", "client", "customer", "prospect", "crm", "sales opportunity"]):
            return self.crm_agent.process(user_query)

        # 3. Procurement & Supplier Intent
        elif any(w in query_lower for w in ["supplier", "procurement", "vendor", "po", "purchase order"]):
            return self.procurement_agent.process(user_query)

        # 4. Finance & Revenue Intent
        elif any(w in query_lower for w in ["revenue", "finance", "profit", "margin", "cogs", "invoice", "payment", "cash flow", "financial"]):
            return self.finance_agent.process(user_query)

        # 5. Inventory & Product Intent (Default for product questions)
        else:
            return self.inventory_agent.process(user_query)

