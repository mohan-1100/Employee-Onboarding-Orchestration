import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr, Field

class HRComplianceSchema(BaseModel):
    nda_signed: bool = False
    bgv_status: str = "Pending"
    payroll_ready: bool = False
    updated_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class ITProvisioningSchema(BaseModel):
    sso_account_active: bool = False
    github_invited: bool = False
    aws_sandbox_ready: bool = False
    vpn_profile_issued: bool = False
    ticket_blocker: str = "None"
    updated_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class WorkplaceLogisticsSchema(BaseModel):
    laptop_assigned: str = "Pending"
    shipping_status: str = "Pending"
    building_badge_issued: bool = False
    updated_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class EmployeeDetailSchema(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    department: str
    start_date: datetime.date
    work_mode: str
    created_at: Optional[datetime.datetime] = None
    
    # Nested relations
    hr_compliance: Optional[HRComplianceSchema] = None
    it_provisioning: Optional[ITProvisioningSchema] = None
    workplace_logistics: Optional[WorkplaceLogisticsSchema] = None

    # Calculated metrics
    completed_tasks: int = 0
    total_tasks: int = 12
    progress_fraction: str = "0/12"
    progress_percentage: int = 0
    days_until_start: int = 0
    risk_level: str = "On Track" # 'Critical', 'At Risk', 'On Track'
    is_completed: bool = False

    class Config:
        from_attributes = True

class DashboardMetrics(BaseModel):
    total_recruits: int
    completed_recruits: int
    uncompleted_recruits: int
    critical_count: int
    at_risk_count: int
    on_track_count: int

# AI Chat & Human-In-The-Loop Proposal Schemas
class ChatRequest(BaseModel):
    message: str
    role: str # 'HR Manager', 'HR', 'IT', 'Facilities'

class DiffProposal(BaseModel):
    action_type: str # 'INSERT_EMPLOYEE' | 'UPDATE_FIELDS'
    target_table: str # 'employees', 'hr_compliance', 'it_provisioning', 'workplace_logistics'
    target_employee_id: Optional[int] = None
    target_employee_name: Optional[str] = None
    field_changes: Dict[str, Any]
    previous_values: Optional[Dict[str, Any]] = None
    cascade_defaults: Optional[Dict[str, Any]] = None
    explanation: str

class ChatResponse(BaseModel):
    reply: str
    requires_approval: bool = False
    is_error: bool = False
    proposal: Optional[DiffProposal] = None

class ConfirmActionRequest(BaseModel):
    proposal: DiffProposal
    user_role: str

class DirectProcessUpdateRequest(BaseModel):
    table: str
    fields: Dict[str, Any]
    user_role: str
