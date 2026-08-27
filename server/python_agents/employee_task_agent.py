"""
DOS-CRM-ERP Multi-Department Employee Task Assignment & SLA Monitoring AI Agent
Enforces role-based category delegation:
- Admin: Unrestricted Enterprise Governance
- Manager: Branch Oversight, Pipeline Approvals & Reorder Approvals
- Staff/Employee: Category segregated task execution (Sales, Warehouse, Finance)
"""

import os
import json
from datetime import datetime
from typing import Dict, Any, List

class EmployeeTaskAssignmentAgent:
    def __init__(self):
        self.role_permissions = {
            "admin": ["ALL_MODULES", "USER_MANAGEMENT", "BRANCH_CONFIG", "FINANCIAL_AUDIT", "AI_AGENT_ADMIN"],
            "manager": ["BRANCH_OPERATIONS", "DISBURSEMENT_APPROVAL", "DEAL_PIPELINE", "STOCK_TRANSFERS"],
            "sales_staff": ["CRM_LEADS", "DEALS", "QUOTATIONS", "CUSTOMER_ACTIVITIES"],
            "warehouse_staff": ["INVENTORY_PRODUCTS", "STOCK_MOVEMENTS", "GRN_RECEIVING", "BARCODE_SCANNING"],
            "finance_staff": ["INVOICES", "PAYMENT_ENTRIES", "EXPENSE_VOUCHERS", "GST_REPORTS"],
            "client": ["ECOMMERCE_CATALOG", "ORDER_CART", "MY_ORDERS", "INVOICES", "GPS_TRACKING"]
        }

    def evaluate_task_assignment(self, task_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Routes enterprise operational tasks to the right employee role and department.
        """
        routing_map = {
            "lead_inquiry": {
                "role": "sales_staff",
                "department": "CRM Commercial",
                "sla_hours": 2,
                "priority": "HIGH"
            },
            "low_stock_reorder": {
                "role": "warehouse_staff",
                "department": "Supply Chain & Logistics",
                "sla_hours": 4,
                "priority": "CRITICAL"
            },
            "expense_voucher_approval": {
                "role": "manager",
                "department": "Branch Executive",
                "sla_hours": 24,
                "priority": "MEDIUM"
            },
            "gst_itc_reconciliation": {
                "role": "finance_staff",
                "department": "Statutory Accounts",
                "sla_hours": 12,
                "priority": "HIGH"
            }
        }

        config = routing_map.get(task_type, {
            "role": "manager",
            "department": "General Operations",
            "sla_hours": 8,
            "priority": "NORMAL"
        })

        return {
            "task_id": f"task_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "task_type": task_type,
            "assigned_role": config["role"],
            "department": config["department"],
            "sla_window_hours": config["sla_hours"],
            "priority": config["priority"],
            "allowed_actions": self.role_permissions.get(config["role"], []),
            "metadata": payload,
            "created_at": datetime.now().isoformat()
        }

if __name__ == "__main__":
    agent = EmployeeTaskAssignmentAgent()
    sample_assignment = agent.evaluate_task_assignment("lead_inquiry", {"client": "Apex Industrial", "budget_inr": 500000})
    print(json.dumps(sample_assignment, indent=2))
