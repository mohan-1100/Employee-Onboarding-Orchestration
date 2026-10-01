import datetime
from typing import Dict, Any, Tuple

UNAUTHORIZED_MESSAGE = "You do not have access to modify this data."

ROLE_PERMISSIONS = {
    "HR Manager": {"employees", "hr_compliance", "it_provisioning", "workplace_logistics"},
    "HR": {"employees", "hr_compliance"},
    "IT": {"it_provisioning"},
    "Facilities": {"workplace_logistics"}
}

def can_role_access_table(user_role: str, target_table: str) -> bool:
    """
    Checks if a user role has permission to modify a specific database table.
    - HR Manager: all tables
    - HR: employees, hr_compliance
    - IT: it_provisioning
    - Facilities: workplace_logistics
    """
    allowed_tables = ROLE_PERMISSIONS.get(user_role, set())
    return target_table in allowed_tables

def calculate_time_risk(start_date: datetime.date) -> Tuple[str, int]:
    """
    Strictly calculates risk badge based on days remaining until start_date:
    🔴 Critical: < 2 days remaining
    🟡 At Risk: < 4 days remaining (2 to 3 days)
    🟢 On Track: > 4 days remaining (>= 4 days)
    """
    today = datetime.date.today()
    delta_days = (start_date - today).days

    if delta_days < 2:
        return "Critical", delta_days
    elif delta_days < 4:
        return "At Risk", delta_days
    else:
        return "On Track", delta_days

def calculate_progress_metrics(employee) -> Dict[str, Any]:
    """
    Calculates progress fraction (e.g., 5/12) across HR, IT, and Facilities onboarding criteria.
    12 Defined Checklist Criteria:
    HR:
      1. NDA signed
      2. BGV verified (bgv_status == 'Verified')
      3. Payroll setup ready
    IT:
      4. SSO account active
      5. GitHub organization invited
      6. AWS sandbox environment ready
      7. VPN profile issued
      8. Zero active ticket blockers (ticket_blocker in ['None', '', None])
    Facilities:
      9. Laptop assigned (not 'Pending')
      10. Logistics shipping underway (shipping_status in ['Shipped', 'Delivered', 'Pickup Scheduled'])
      11. Building physical badge issued
      12. IT Access Bundle verified (sso_account_active and vpn_profile_issued)
    """
    completed = 0
    total = 12

    hr = employee.hr_compliance
    it = employee.it_provisioning
    fac = employee.workplace_logistics

    # HR compliance (3 tasks)
    if hr:
        if hr.nda_signed:
            completed += 1
        if hr.bgv_status == "Verified":
            completed += 1
        if hr.payroll_ready:
            completed += 1

    # IT provisioning (5 tasks)
    if it:
        if it.sso_account_active:
            completed += 1
        if it.github_invited:
            completed += 1
        if it.aws_sandbox_ready:
            completed += 1
        if it.vpn_profile_issued:
            completed += 1
        if it.ticket_blocker in ["None", "", None]:
            completed += 1

    # Facilities logistics (3 tasks)
    if fac:
        if fac.laptop_assigned and fac.laptop_assigned != "Pending":
            completed += 1
        if fac.shipping_status in ["Shipped", "Delivered", "Pickup Scheduled"]:
            completed += 1
        if fac.building_badge_issued:
            completed += 1

    # Combined readiness verification (1 task)
    if it and it.sso_account_active and it.vpn_profile_issued and hr and hr.nda_signed:
        completed += 1

    percentage = int((completed / total) * 100)
    risk_level, days_until_start = calculate_time_risk(employee.start_date)
    is_completed = (completed == total)

    # Bypass risk calculation for 100% completed recruits
    if is_completed:
        risk_level = "Done"

    return {
        "completed_tasks": completed,
        "total_tasks": total,
        "progress_fraction": f"{completed}/{total}",
        "progress_percentage": percentage,
        "days_until_start": days_until_start,
        "risk_level": risk_level,
        "is_completed": is_completed
    }

def get_role_based_cascading_defaults(role_name: str, department: str, work_mode: str) -> Dict[str, Any]:
    """
    Generates intelligent cascading onboarding defaults across HR, IT, and Workplace Logistics
    tailored to the new employee's role, department, and work mode.
    """
    role_lower = role_name.lower()
    dept_lower = department.lower()
    
    # IT Defaults
    is_engineer = "engineer" in role_lower or "developer" in role_lower or "architect" in role_lower or "engineering" in dept_lower
    is_devops = "devops" in role_lower or "cloud" in role_lower or "infrastructure" in dept_lower or "site reliability" in role_lower
    
    it_defaults = {
        "sso_account_active": False,
        "github_invited": False if is_engineer else True, # Non-engineers auto-cleared or not needed
        "aws_sandbox_ready": False if (is_devops or is_engineer) else True,
        "vpn_profile_issued": False,
        "ticket_blocker": "None"
    }

    # Workplace Logistics Defaults
    if "mac" in role_lower or is_engineer:
        laptop = 'MacBook Pro 16" (M3 Max)'
    elif "design" in dept_lower or "designer" in role_lower:
        laptop = 'MacBook Pro 14" (M3 Pro)'
    elif "product" in role_lower or "manager" in role_lower:
        laptop = 'MacBook Air 15" (M3/24GB)'
    else:
        laptop = 'Dell XPS 15 (i7/32GB)'

    is_remote = work_mode.lower() == "remote"

    fac_defaults = {
        "laptop_assigned": laptop,
        "shipping_status": "Pending" if is_remote else "Pickup Scheduled",
        "building_badge_issued": True if is_remote else False # Remotes don't need office badge immediately
    }

    # HR Compliance Defaults
    hr_defaults = {
        "nda_signed": False,
        "bgv_status": "Pending",
        "payroll_ready": False
    }

    return {
        "hr_compliance": hr_defaults,
        "it_provisioning": it_defaults,
        "workplace_logistics": fac_defaults
    }
