import os
import re
import json
import datetime
from typing import Dict, Any, Optional, Tuple, List
from dotenv import load_dotenv
from openai import OpenAI
from sqlalchemy.orm import Session

# Ensure environment variables are loaded
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from .models import Employee, HRCompliance, ITProvisioning, WorkplaceLogistics
from .access_control import (
    can_role_access_table, 
    UNAUTHORIZED_MESSAGE, 
    get_role_based_cascading_defaults
)
from .schemas import DiffProposal, ChatResponse

# Initialize OpenAI client targeting OpenRouter
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY or "dummy_key_until_set"
)

# OpenRouter fallback models specification (OpenRouter accepts up to 3 fallback models)
FALLBACK_MODELS = [
    "google/gemini-2.5-flash",
    "google/gemini-2.5-flash-lite",
    "deepseek/deepseek-chat",
    "meta-llama/llama-3.3-70b-instruct"
]

class OnboardingOrchestratorAgent:
    """
    AI Agent orchestrating enterprise employee onboarding via OpenRouter LLM.
    Enforces strict Human-in-the-Loop governance:
    - Zero direct database writes.
    - All mutations returned as staged proposals requiring explicit confirmation.
    - Strict Role-Based Access Control (RBAC) enforcement.
    """

    def __init__(self, db_session: Session):
        self.db = db_session

    def process_command(self, message: str, user_role: str) -> ChatResponse:
        """
        Processes natural language commands using OpenRouter LLM with fallback models,
        enforcing RBAC boundaries and Human-In-The-Loop proposal staging.
        """
        clean_msg = message.strip()
        if not clean_msg:
            return ChatResponse(
                reply="Please enter a command or query.",
                requires_approval=False,
                is_error=False,
                proposal=None
            )

        # Retrieve current employees context for the LLM
        employees_context = self._get_employees_context()

        # Step 1: Call OpenRouter LLM for structured extraction
        parsed_data = self._call_openrouter_llm(clean_msg, user_role, employees_context)

        # If LLM parsing fails or key is missing, utilize deterministic NLP fallback
        if not parsed_data:
            parsed_data = self._fallback_rule_parser(clean_msg, user_role)

        action_type = parsed_data.get("action_type", "QUERY")
        target_table = parsed_data.get("target_table")
        target_employee_id = parsed_data.get("target_employee_id")
        target_employee_name = parsed_data.get("target_employee_name")
        field_changes = parsed_data.get("field_changes") or {}
        llm_reply = parsed_data.get("reply") or ""

        # Step 2: Informational query handling
        if action_type == "QUERY" or not target_table:
            reply_text = llm_reply or (
                f"Hello **{user_role}**! Currently orchestrating {len(employees_context)} recruits. "
                "You can command me to onboard new recruits or update onboarding compliance, IT provisioning, and logistics. "
                "All database changes require your manual confirmation."
            )
            return ChatResponse(
                reply=reply_text,
                requires_approval=False,
                is_error=False,
                proposal=None
            )

        # Step 3: Enforce Strict Role-Based Access Control (RBAC)
        if not can_role_access_table(user_role, target_table):
            # Strict mandate: strictly return UNAUTHORIZED_MESSAGE with no follow-up escalations
            return ChatResponse(
                reply=UNAUTHORIZED_MESSAGE,
                requires_approval=False,
                is_error=True,
                proposal=None
            )

        # Step 4: Handle INSERT_EMPLOYEE Proposal Assembly
        if action_type == "INSERT_EMPLOYEE":
            return self._assemble_insert_proposal(clean_msg, field_changes, llm_reply)

        # Step 5: Handle UPDATE_FIELDS Proposal Assembly
        if action_type == "UPDATE_FIELDS":
            return self._assemble_update_proposal(
                clean_msg, 
                target_table, 
                target_employee_id, 
                target_employee_name, 
                field_changes, 
                llm_reply
            )

        # Default fallback
        return ChatResponse(
            reply=llm_reply or "Command processed. No database modifications requested.",
            requires_approval=False,
            is_error=False,
            proposal=None
        )

    def _get_employees_context(self) -> List[Dict[str, Any]]:
        """
        Reads existing employees from DB to give the LLM full name/ID matching context.
        Zero DB writes performed.
        """
        employees = self.db.query(Employee).all()
        context = []
        for e in employees:
            context.append({
                "id": e.id,
                "full_name": e.full_name,
                "role": e.role,
                "department": e.department,
                "start_date": e.start_date.isoformat(),
                "work_mode": e.work_mode
            })
        return context

    def _call_openrouter_llm(
        self, 
        message: str, 
        user_role: str, 
        employees_context: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """
        Invokes OpenRouter LLM (primary: openai/gpt-4o-mini with fallbacks)
        enforcing structured JSON output.
        """
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            return None

        today_str = datetime.date.today().isoformat()

        system_prompt = f"""You are the AI Onboarding Governance Orchestrator for an IT enterprise.
You parse natural language requests into structured database proposals.
STRICT HUMAN-IN-THE-LOOP RULE: You do NOT write to the database. You only output a structured JSON proposal for human approval.

Today's Date: {today_str}
Active User Persona: {user_role}

Available Database Tables & Columns:
1. "employees": [full_name (str), email (str), role (str), department (str), start_date (YYYY-MM-DD), work_mode ("Hybrid", "Remote", "On-site")]
2. "hr_compliance": [nda_signed (bool), bgv_status ("Pending", "In Progress", "Verified", "Failed"), payroll_ready (bool)]
3. "it_provisioning": [sso_account_active (bool), github_invited (bool), aws_sandbox_ready (bool), vpn_profile_issued (bool), ticket_blocker (str)]
4. "workplace_logistics": [laptop_assigned (str), shipping_status ("Pending", "In Transit", "Shipped", "Delivered", "Pickup Scheduled"), building_badge_issued (bool)]

Existing Recruits in DB:
{json.dumps(employees_context, indent=2)}

You must respond ONLY with a valid JSON object with these exact keys:
{{
  "action_type": "INSERT_EMPLOYEE" | "UPDATE_FIELDS" | "QUERY",
  "target_table": "employees" | "hr_compliance" | "it_provisioning" | "workplace_logistics" | null,
  "target_employee_id": <int or null>,
  "target_employee_name": <str or null>,
  "field_changes": {{ <key>: <value> }},
  "reply": <natural language explanation of the proposed changes or answer to user>
}}

Instructions:
- If the user asks to add or hire an employee, set action_type="INSERT_EMPLOYEE", target_table="employees". Extract full_name, role, department, start_date (calculate exact YYYY-MM-DD from relative dates like 'in 3 days' or 'next week'), and work_mode.
- If the user asks to update compliance, IT status, or logistics, match the employee from the list, set action_type="UPDATE_FIELDS", target_table to the appropriate table, and extract exact boolean/text field_changes.
- If the user asks an informational question or does not ask for modifications, set action_type="QUERY", target_table=null.
"""

        try:
            # Update client api key in case it was refreshed in env
            client.api_key = api_key

            response = client.chat.completions.create(
                model="openai/gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                response_format={"type": "json_object"},
                extra_body={
                    "models": FALLBACK_MODELS[:3]
                },
                temperature=0.1
            )

            raw_content = response.choices[0].message.content
            if raw_content:
                parsed = json.loads(raw_content)

                # Normalize action_type
                act = str(parsed.get("action_type", "")).upper()
                if any(w in act for w in ["INSERT", "ADD", "CREATE", "HIRE"]):
                    parsed["action_type"] = "INSERT_EMPLOYEE"
                elif any(w in act for w in ["UPDATE", "MODIFY", "CHANGE", "SET"]):
                    parsed["action_type"] = "UPDATE_FIELDS"
                else:
                    parsed["action_type"] = "QUERY"

                # Normalize field changes keys
                fc = parsed.get("field_changes") or {}
                if "name" in fc and "full_name" not in fc:
                    fc["full_name"] = fc.pop("name")
                if "position" in fc and "role" not in fc:
                    fc["role"] = fc.pop("position")
                parsed["field_changes"] = fc

                return parsed
        except Exception as e:
            print(f"[OpenRouter Agent Notice] LLM call error: {e}. Falling back to deterministic parser.")
            return None

        return None

    def _assemble_insert_proposal(
        self, 
        raw_msg: str, 
        field_changes: Dict[str, Any], 
        llm_reply: str
    ) -> ChatResponse:
        """
        Assembles a validated DiffProposal for INSERT_EMPLOYEE with cascading defaults.
        Zero DB writes performed.
        """
        today = datetime.date.today()

        # Extract / Validate full_name
        full_name = field_changes.get("full_name")
        if not full_name:
            match = re.search(r'(?:add|recruit|onboard|hire)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+)', raw_msg, re.IGNORECASE)
            full_name = match.group(1).strip() if match else "Jordan Hayes"

        # Role & Department
        role = field_changes.get("role") or "Software Engineer"
        department = field_changes.get("department")
        if not department:
            role_lower = role.lower()
            if "design" in role_lower:
                department = "Design"
            elif any(w in role_lower for w in ["devops", "cloud", "infra", "sre"]):
                department = "Infrastructure"
            elif "product" in role_lower:
                department = "Product"
            else:
                department = "Engineering"

        # Work Mode
        work_mode = field_changes.get("work_mode") or ("Remote" if "remote" in raw_msg.lower() else "Hybrid")

        # Start Date
        start_date_val = field_changes.get("start_date")
        if not start_date_val:
            days_match = re.search(r'in\s+(\d+)\s+day', raw_msg, re.IGNORECASE)
            days = int(days_match.group(1)) if days_match else 7
            start_date_val = (today + datetime.timedelta(days=days)).isoformat()

        # Email
        email = field_changes.get("email")
        if not email:
            clean_name = re.sub(r'[^a-zA-Z\s]', '', full_name).lower().replace(' ', '.')
            email = f"{clean_name}@techcorp.io"
            # Ensure unique email
            existing = self.db.query(Employee).filter(Employee.email == email).first()
            if existing:
                email = f"{clean_name}.{today.strftime('%y%m%d')}@techcorp.io"

        sanitized_fields = {
            "full_name": full_name,
            "email": email,
            "role": role,
            "department": department,
            "start_date": start_date_val,
            "work_mode": work_mode
        }

        # Role-based cascading defaults
        cascade_defaults = get_role_based_cascading_defaults(role, department, work_mode)

        proposal = DiffProposal(
            action_type="INSERT_EMPLOYEE",
            target_table="employees",
            target_employee_id=None,
            target_employee_name=full_name,
            field_changes=sanitized_fields,
            previous_values=None,
            cascade_defaults=cascade_defaults,
            explanation=f"Agent proposed onboarding new recruit **{full_name}** ({role}, {department}) with automated cascading records for HR, IT, and Workplace Logistics."
        )

        reply = llm_reply or (
            f"I have staged the onboarding profile for **{full_name}** as **{role}**. "
            "Please review the proposed employee profile and cascading checklist defaults below before confirming."
        )

        return ChatResponse(
            reply=reply,
            requires_approval=True,
            is_error=False,
            proposal=proposal
        )

    def _assemble_update_proposal(
        self,
        raw_msg: str,
        target_table: str,
        target_employee_id: Optional[int],
        target_employee_name: Optional[str],
        field_changes: Dict[str, Any],
        llm_reply: str
    ) -> ChatResponse:
        """
        Assembles a validated DiffProposal for UPDATE_FIELDS, capturing previous DB values.
        Zero DB writes performed.
        """
        # Match employee from DB
        employee = None
        if target_employee_id:
            employee = self.db.query(Employee).filter(Employee.id == target_employee_id).first()

        if not employee and target_employee_name:
            employee = self.db.query(Employee).filter(
                Employee.full_name.ilike(f"%{target_employee_name}%")
            ).first()

        if not employee:
            for emp in self.db.query(Employee).all():
                if emp.full_name.lower() in raw_msg.lower() or emp.full_name.split()[0].lower() in raw_msg.lower():
                    employee = emp
                    break

        if not employee:
            return ChatResponse(
                reply="Could not identify the target recruit to update. Please specify their name.",
                requires_approval=False,
                is_error=True,
                proposal=None
            )

        if not field_changes:
            return ChatResponse(
                reply=f"Identified {employee.full_name}, but no specific field updates were detected.",
                requires_approval=False,
                is_error=False,
                proposal=None
            )

        # Retrieve current DB values for diff comparison
        previous_values = {}
        if target_table == "hr_compliance":
            rec = employee.hr_compliance
            for k in field_changes.keys():
                previous_values[k] = getattr(rec, k, None) if rec else None
        elif target_table == "it_provisioning":
            rec = employee.it_provisioning
            for k in field_changes.keys():
                previous_values[k] = getattr(rec, k, None) if rec else None
        elif target_table == "workplace_logistics":
            rec = employee.workplace_logistics
            for k in field_changes.keys():
                previous_values[k] = getattr(rec, k, None) if rec else None
        elif target_table == "employees":
            for k in field_changes.keys():
                val = getattr(employee, k, None)
                if isinstance(val, (datetime.date, datetime.datetime)):
                    val = val.isoformat()
                previous_values[k] = val

        explanation = f"Update `{target_table}` for {employee.full_name}: " + ", ".join(
            [f"{k} -> {v}" for k, v in field_changes.items()]
        )

        proposal = DiffProposal(
            action_type="UPDATE_FIELDS",
            target_table=target_table,
            target_employee_id=employee.id,
            target_employee_name=employee.full_name,
            field_changes=field_changes,
            previous_values=previous_values,
            cascade_defaults=None,
            explanation=explanation
        )

        reply = llm_reply or (
            f"I have staged the requested modifications for **{employee.full_name}** in `{target_table}`. "
            "Please review the diff below and confirm to apply the changes to the database."
        )

        return ChatResponse(
            reply=reply,
            requires_approval=True,
            is_error=False,
            proposal=proposal
        )

    def _fallback_rule_parser(self, text: str, user_role: str) -> Dict[str, Any]:
        """
        Deterministic NLP fallback in case OpenRouter API key is not yet set or network fails.
        """
        lower = text.lower()

        # Check for employee creation intent
        if any(w in lower for w in ["add employee", "add recruit", "new employee", "new recruit", "hire", "onboard"]):
            name_match = re.search(r'(?:add|recruit|onboard|hire)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*?)(?=\s+(?:as|starting|in|with|dept|to|\.|$))', text, re.IGNORECASE)
            full_name = name_match.group(1).strip() if name_match else "Jordan Hayes"

            role = "Software Engineer"
            if "devops" in lower:
                role = "Senior DevOps Engineer"
            elif "cloud architect" in lower:
                role = "Cloud Architect"
            elif "security" in lower:
                role = "Cloud Security Specialist"
            elif "product" in lower:
                role = "Product Manager"
            elif "frontend" in lower:
                role = "Frontend Developer"

            dept = "Infrastructure" if "infra" in lower or "devops" in role.lower() or "cloud" in role.lower() else "Engineering"
            mode = "Remote" if "remote" in lower else "Hybrid"

            days_match = re.search(r'in\s+(\d+)\s+day', lower)
            days = int(days_match.group(1)) if days_match else 7
            start_date = (datetime.date.today() + datetime.timedelta(days=days)).isoformat()

            return {
                "action_type": "INSERT_EMPLOYEE",
                "target_table": "employees",
                "target_employee_id": None,
                "target_employee_name": full_name,
                "field_changes": {
                    "full_name": full_name,
                    "role": role,
                    "department": dept,
                    "work_mode": mode,
                    "start_date": start_date
                },
                "reply": f"Staged new employee profile for **{full_name}** as **{role}**."
            }

        # Check for HR Compliance intent
        if any(w in lower for w in ["nda", "bgv", "background", "payroll"]):
            changes = {}
            if "nda" in lower:
                changes["nda_signed"] = False if "not" in lower or "revok" in lower else True
            if "bgv" in lower or "background" in lower:
                changes["bgv_status"] = "Verified" if any(w in lower for w in ["pass", "verif", "clear", "done", "approv"]) else "In Progress"
            if "payroll" in lower:
                changes["payroll_ready"] = False if "not" in lower else True

            return {
                "action_type": "UPDATE_FIELDS",
                "target_table": "hr_compliance",
                "target_employee_id": None,
                "target_employee_name": None,
                "field_changes": changes,
                "reply": f"Staged HR Compliance changes: {changes}"
            }

        # Check for IT Provisioning intent
        if any(w in lower for w in ["sso", "single sign", "github", "aws", "sandbox", "vpn", "blocker"]):
            changes = {}
            if "sso" in lower or "single sign" in lower:
                changes["sso_account_active"] = False if "deactivat" in lower or "disable" in lower else True
            if "github" in lower:
                changes["github_invited"] = False if "revok" in lower or "remov" in lower else True
            if "aws" in lower or "sandbox" in lower:
                changes["aws_sandbox_ready"] = False if "terminat" in lower else True
            if "vpn" in lower:
                changes["vpn_profile_issued"] = False if "revok" in lower else True
            if "blocker" in lower:
                changes["ticket_blocker"] = "None" if any(w in lower for w in ["clear", "resolv", "none"]) else "Awaiting 2FA"

            return {
                "action_type": "UPDATE_FIELDS",
                "target_table": "it_provisioning",
                "target_employee_id": None,
                "target_employee_name": None,
                "field_changes": changes,
                "reply": f"Staged IT Provisioning changes: {changes}"
            }

        # Check for Workplace Logistics intent
        if any(w in lower for w in ["laptop", "macbook", "dell", "shipping", "shipped", "deliver", "badge"]):
            changes = {}
            if "laptop" in lower or "macbook" in lower or "dell" in lower:
                changes["laptop_assigned"] = 'MacBook Pro 16" (M3 Max)' if "16" in lower or "macbook" in lower else 'Dell XPS 15 (i7/32GB)'
            if "ship" in lower or "deliver" in lower:
                changes["shipping_status"] = "Delivered" if "deliver" in lower else "Shipped"
            if "badge" in lower:
                changes["building_badge_issued"] = False if "revok" in lower else True

            return {
                "action_type": "UPDATE_FIELDS",
                "target_table": "workplace_logistics",
                "target_employee_id": None,
                "target_employee_name": None,
                "field_changes": changes,
                "reply": f"Staged Workplace Logistics changes: {changes}"
            }

        return {
            "action_type": "QUERY",
            "target_table": None,
            "target_employee_id": None,
            "target_employee_name": None,
            "field_changes": {},
            "reply": f"Hello {user_role}. How can I assist with employee onboarding orchestration today?"
        }
