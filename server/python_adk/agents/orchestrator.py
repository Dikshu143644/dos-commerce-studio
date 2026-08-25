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
        query_lower = user_query.strip().lower()

        # 0. Greetings & Conversational Inquiries
        if query_lower in ["hi", "hello", "hey"] or query_lower.startswith("hello") or query_lower.startswith("hi ") or query_lower.startswith("hey "):
            return {
                "agent": "StockFlow General Copilot",
                "status": "success",
                "message": (
                    "### 👋 Hello! Welcome to StockFlow Enterprise Copilot\n\n"
                    "I am your **AI Multi-Agent Assistant**, integrated directly into the StockFlow inventory, supply chain, and CRM platform.\n\n"
                    "**Here is what you can ask me to do:**\n"
                    "- 📦 **\"Show me all products and stock availability\"**\n"
                    "- ⚠️ **\"Which items are running low on stock?\"**\n"
                    "- 💼 **\"Give me a breakdown of our high priority deals & CRM leads\"**\n"
                    "- 🏬 **\"Check warehouse capacity across Mumbai and Delhi\"**\n"
                    "- 📊 **\"What is our revenue and gross margin this month?\"**\n\n"
                    "How can I help you today?"
                )
            }

        if any(w in query_lower for w in ["about your web", "about this web", "what is stockflow", "tell me about stockflow", "features", "how does this work"]):
            return {
                "agent": "StockFlow General Copilot",
                "status": "success",
                "message": (
                    "### 🌐 StockFlow Enterprise Platform Overview\n\n"
                    "**StockFlow** unifies **multi-warehouse inventory management** with an **intelligent CRM deal pipeline** and **autonomous Python ADK multi-agent workflows**.\n\n"
                    "- 📦 **Multi-Warehouse Stock Tracking**: Real-time telemetry across 6 regional hubs (*Mumbai, Delhi, Bangalore, Kolkata, Pune, Ahmedabad*).\n"
                    "- 💼 **CRM Deals & Pipelines**: Visual Kanban stages, deal velocity calculations, and client lifetime value metrics.\n"
                    "- 🤖 **Python ADK Automation**: Background predictive reorder PO drafting and Excel reports.\n"
                    "- 🛡️ **Opal SMS OTP Security**: Real-time 6-digit cryptographic verification with SHA-256 validation."
                )
            }

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

