import os
import datetime
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any

try:
    from .database import engine, Base, SessionLocal, get_db, log_audit_silent, supabase_client
    from .models import Employee, HRCompliance, ITProvisioning, WorkplaceLogistics, AuditLog
    from .schemas import (
        EmployeeDetailSchema, 
        DashboardMetrics, 
        ChatRequest, 
        ChatResponse, 
        ConfirmActionRequest, 
        DirectProcessUpdateRequest
    )
    from .access_control import (
        can_role_access_table, 
        UNAUTHORIZED_MESSAGE, 
        calculate_progress_metrics, 
        get_role_based_cascading_defaults
    )
    from .agent import OnboardingOrchestratorAgent
except ImportError:
    from database import engine, Base, SessionLocal, get_db, log_audit_silent, supabase_client
    from models import Employee, HRCompliance, ITProvisioning, WorkplaceLogistics, AuditLog
    from schemas import (
        EmployeeDetailSchema, 
        DashboardMetrics, 
        ChatRequest, 
        ChatResponse, 
        ConfirmActionRequest, 
        DirectProcessUpdateRequest
    )
    from access_control import (
        can_role_access_table, 
        UNAUTHORIZED_MESSAGE, 
        calculate_progress_metrics, 
        get_role_based_cascading_defaults
    )
    from agent import OnboardingOrchestratorAgent

# Initialize tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Employee Onboarding Orchestrator API",
    description="Enterprise Onboarding Orchestrator with AI Governance and RBAC",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

@app.get("/")
@app.get("/api")
def root_status():
    return {
        "status": "online",
        "service": "Employee Onboarding Orchestrator Backend",
        "version": "1.0.0"
    }

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def seed_initial_cohort(db: Session):
    """Seeds the initial cohort of recruits if the database is empty."""
    if db.query(Employee).count() > 0:
        return

    today = datetime.date.today()


    cohort = [
        {
            "id": 1,
            "full_name": "Alex Rivera",
            "email": "alex.rivera@techcorp.io",
            "role": "Senior Backend Engineer",
            "department": "Engineering",
            "start_date": today + datetime.timedelta(days=1), # Critical (<2 days)
            "work_mode": "Hybrid",
            "hr": {"nda_signed": True, "bgv_status": "In Progress", "payroll_ready": False},
            "it": {"sso_account_active": True, "github_invited": False, "aws_sandbox_ready": False, "vpn_profile_issued": True, "ticket_blocker": "Awaiting GitHub 2FA"},
            "fac": {"laptop_assigned": 'MacBook Pro 16" (M3 Max)', "shipping_status": "In Transit", "building_badge_issued": False}
        },
        {
            "id": 2,
            "full_name": "Marcus Chen",
            "email": "marcus.chen@techcorp.io",
            "role": "DevOps & Cloud Architect",
            "department": "Infrastructure",
            "start_date": today + datetime.timedelta(days=3), # At Risk (<4 days)
            "work_mode": "Remote",
            "hr": {"nda_signed": True, "bgv_status": "Verified", "payroll_ready": True},
            "it": {"sso_account_active": True, "github_invited": True, "aws_sandbox_ready": True, "vpn_profile_issued": True, "ticket_blocker": "None"},
            "fac": {"laptop_assigned": 'MacBook Pro 16" (M3 Max)', "shipping_status": "Delivered", "building_badge_issued": True}
        },
        {
            "id": 3,
            "full_name": "Elena Rostova",
            "email": "elena.rostova@techcorp.io",
            "role": "Product Design Lead",
            "department": "Design",
            "start_date": today + datetime.timedelta(days=10), # On Track (>4 days)
            "work_mode": "Hybrid",
            "hr": {"nda_signed": False, "bgv_status": "Pending", "payroll_ready": False},
            "it": {"sso_account_active": False, "github_invited": False, "aws_sandbox_ready": True, "vpn_profile_issued": False, "ticket_blocker": "None"},
            "fac": {"laptop_assigned": 'MacBook Pro 14" (M3 Pro)', "shipping_status": "Pending", "building_badge_issued": False}
        },
        {
            "id": 4,
            "full_name": "Sofia Patel",
            "email": "sofia.patel@techcorp.io",
            "role": "Engineering Manager",
            "department": "Engineering",
            "start_date": today + datetime.timedelta(days=14), # On Track (>4 days)
            "work_mode": "On-site",
            "hr": {"nda_signed": True, "bgv_status": "Verified", "payroll_ready": False},
            "it": {"sso_account_active": True, "github_invited": True, "aws_sandbox_ready": True, "vpn_profile_issued": False, "ticket_blocker": "None"},
            "fac": {"laptop_assigned": 'Dell XPS 15 (i7/32GB)', "shipping_status": "Pickup Scheduled", "building_badge_issued": True}
        },
        {
            "id": 5,
            "full_name": "Liam Vance",
            "email": "liam.vance@techcorp.io",
            "role": "Full Stack Developer",
            "department": "Engineering",
            "start_date": today + datetime.timedelta(days=1), # Critical (<2 days) - Fully completed sample!
            "work_mode": "Remote",
            "hr": {"nda_signed": True, "bgv_status": "Verified", "payroll_ready": True},
            "it": {"sso_account_active": True, "github_invited": True, "aws_sandbox_ready": True, "vpn_profile_issued": True, "ticket_blocker": "None"},
            "fac": {"laptop_assigned": 'MacBook Pro 16" (M3 Max)', "shipping_status": "Delivered", "building_badge_issued": True}
        }
    ]

    for item in cohort:
        emp = Employee(
            id=item["id"],
            full_name=item["full_name"],
            email=item["email"],
            role=item["role"],
            department=item["department"],
            start_date=item["start_date"],
            work_mode=item["work_mode"]
        )
        db.add(emp)
        db.flush()

        hr = HRCompliance(employee_id=emp.id, **item["hr"])
        it = ITProvisioning(employee_id=emp.id, **item["it"])
        fac = WorkplaceLogistics(employee_id=emp.id, **item["fac"])
        db.add(hr)
        db.add(it)
        db.add(fac)

    db.commit()
    log_audit_silent(db, "SYSTEM", "Initial onboarding cohort of 5 employees seeded")

# Ensure seed data is populated immediately
_init_db = SessionLocal()
try:
    seed_initial_cohort(_init_db)
finally:
    _init_db.close()

def build_employee_response(emp: Employee) -> EmployeeDetailSchema:
    """Helper to transform Employee ORM into rich schema with calculated progress and risk."""
    metrics = calculate_progress_metrics(emp)
    return EmployeeDetailSchema(
        id=emp.id,
        full_name=emp.full_name,
        email=emp.email,
        role=emp.role,
        department=emp.department,
        start_date=emp.start_date,
        work_mode=emp.work_mode,
        created_at=emp.created_at,
        hr_compliance=emp.hr_compliance,
        it_provisioning=emp.it_provisioning,
        workplace_logistics=emp.workplace_logistics,
        **metrics
    )

@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()}

@app.get("/api/employees", response_model=List[EmployeeDetailSchema])
def get_employees(db: Session = Depends(get_db)):
    """Fetch all employees with onboarding details, progress fractions, and risk status."""
    employees = db.query(Employee).order_by(Employee.start_date.asc()).all()
    return [build_employee_response(emp) for emp in employees]

@app.get("/api/employees/{employee_id}", response_model=EmployeeDetailSchema)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    """Fetch a single employee with complete onboarding progress."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return build_employee_response(emp)

@app.get("/api/metrics", response_model=DashboardMetrics)
def get_metrics(db: Session = Depends(get_db)):
    """Metric cards: Total number of recruits, Completed recruits, Uncompleted recruits."""
    employees = db.query(Employee).all()
    total = len(employees)
    completed = 0
    uncompleted = 0
    critical = 0
    at_risk = 0
    on_track = 0

    for emp in employees:
        metrics = calculate_progress_metrics(emp)
        if metrics["is_completed"]:
            completed += 1
        else:
            uncompleted += 1
            risk = metrics["risk_level"]
            if risk == "Critical":
                critical += 1
            elif risk == "At Risk":
                at_risk += 1
            else:
                on_track += 1

    return DashboardMetrics(
        total_recruits=total,
        completed_recruits=completed,
        uncompleted_recruits=uncompleted,
        critical_count=critical,
        at_risk_count=at_risk,
        on_track_count=on_track
    )

@app.post("/api/chat", response_model=ChatResponse)
def chat_command(req: ChatRequest, db: Session = Depends(get_db)):
    """
    AI Chat Endpoint:
    Accepts natural language command and user role.
    Uses CrewAI agent logic to parse into a proposal with strict RBAC check.
    Does NOT write to DB immediately (Human-in-the-loop).
    """
    agent = OnboardingOrchestratorAgent(db)
    response = agent.process_command(req.message, req.role)
    return response

@app.post("/api/actions/confirm")
def confirm_action(req: ConfirmActionRequest, db: Session = Depends(get_db)):
    """
    Human-In-The-Loop Confirmation:
    Executes database mutation only when user clicks [Confirm & Apply].
    Handles role-based cascading inserts and logs silently to audit_logs.
    """
    proposal = req.proposal
    user_role = req.user_role

    # Enforce Role-Based Access Control at mutation boundary
    if not can_role_access_table(user_role, proposal.target_table):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=UNAUTHORIZED_MESSAGE
        )

    if proposal.action_type == "INSERT_EMPLOYEE":
        fields = proposal.field_changes
        start_date_val = fields.get("start_date")
        if isinstance(start_date_val, str):
            start_date_obj = datetime.date.fromisoformat(start_date_val)
        else:
            start_date_obj = datetime.date.today() + datetime.timedelta(days=7)

        # 1. Insert into employees
        new_emp = Employee(
            full_name=fields["full_name"],
            email=fields["email"],
            role=fields["role"],
            department=fields["department"],
            start_date=start_date_obj,
            work_mode=fields.get("work_mode", "Hybrid")
        )
        db.add(new_emp)
        db.flush()

        # 2. Role-Based Cascading: automatically execute default INSERTs into hr_compliance,
        # it_provisioning, and workplace_logistics based on the employee's role
        cascades = proposal.cascade_defaults or get_role_based_cascading_defaults(
            new_emp.role, new_emp.department, new_emp.work_mode
        )

        hr_rec = HRCompliance(employee_id=new_emp.id, **cascades.get("hr_compliance", {}))
        it_rec = ITProvisioning(employee_id=new_emp.id, **cascades.get("it_provisioning", {}))
        fac_rec = WorkplaceLogistics(employee_id=new_emp.id, **cascades.get("workplace_logistics", {}))

        db.add(hr_rec)
        db.add(it_rec)
        db.add(fac_rec)
        db.commit()

        # 3. Live Supabase Sync
        if supabase_client:
            try:
                supabase_client.table("employees").insert({
                    "id": new_emp.id,
                    "full_name": new_emp.full_name,
                    "email": new_emp.email,
                    "role": new_emp.role,
                    "department": new_emp.department,
                    "start_date": new_emp.start_date.isoformat(),
                    "work_mode": new_emp.work_mode
                }).execute()
            except Exception as e:
                print(f"Supabase employee insert sync notice: {e}")

        # 4. Silent Auditing
        action_msg = f"INSERT employees (ID {new_emp.id}, {new_emp.full_name}, {new_emp.role}) with automated cascading records in hr_compliance, it_provisioning, and workplace_logistics"
        log_audit_silent(db, user_role, action_msg)

        return {
            "success": True,
            "message": f"Successfully onboarded {new_emp.full_name} and provisioned role-based cascading tasks.",
            "employee_id": new_emp.id
        }

    elif proposal.action_type == "UPDATE_FIELDS":
        emp_id = proposal.target_employee_id
        if not emp_id:
            raise HTTPException(status_code=400, detail="Missing target employee ID for update.")

        target_table = proposal.target_table
        changes = proposal.field_changes

        if target_table == "hr_compliance":
            record = db.query(HRCompliance).filter(HRCompliance.employee_id == emp_id).first()
            if not record:
                record = HRCompliance(employee_id=emp_id)
                db.add(record)
            for k, v in changes.items():
                if hasattr(record, k):
                    setattr(record, k, v)

        elif target_table == "it_provisioning":
            record = db.query(ITProvisioning).filter(ITProvisioning.employee_id == emp_id).first()
            if not record:
                record = ITProvisioning(employee_id=emp_id)
                db.add(record)
            for k, v in changes.items():
                if hasattr(record, k):
                    setattr(record, k, v)

        elif target_table == "workplace_logistics":
            record = db.query(WorkplaceLogistics).filter(WorkplaceLogistics.employee_id == emp_id).first()
            if not record:
                record = WorkplaceLogistics(employee_id=emp_id)
                db.add(record)
            for k, v in changes.items():
                if hasattr(record, k):
                    setattr(record, k, v)

        elif target_table == "employees":
            record = db.query(Employee).filter(Employee.id == emp_id).first()
            if not record:
                raise HTTPException(status_code=404, detail="Employee not found")
            for k, v in changes.items():
                if hasattr(record, k):
                    if k == "start_date" and isinstance(v, str):
                        v = datetime.date.fromisoformat(v)
                    setattr(record, k, v)

        db.commit()

        # Live Supabase Sync
        if supabase_client:
            try:
                pk_field = "id" if target_table == "employees" else "employee_id"
                supabase_client.table(target_table).update(changes).eq(pk_field, emp_id).execute()
            except Exception as e:
                print(f"Supabase update sync notice: {e}")

        # Silent Auditing
        action_msg = f"UPDATE {target_table} for employee ID {emp_id}: {changes}"
        log_audit_silent(db, user_role, action_msg)

        return {
            "success": True,
            "message": f"Successfully updated {target_table} for employee #{emp_id}.",
            "employee_id": emp_id
        }

    raise HTTPException(status_code=400, detail="Unsupported action type")

@app.put("/api/employees/{employee_id}/process")
def update_process_field(employee_id: int, req: DirectProcessUpdateRequest, db: Session = Depends(get_db)):
    """
    Direct field update from the interactive UI detail modal.
    Enforces the exact same role boundaries and silent audit logging.
    """
    # Enforce role boundaries
    if not can_role_access_table(req.user_role, req.table):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=UNAUTHORIZED_MESSAGE
        )

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    if req.table == "hr_compliance":
        record = emp.hr_compliance or HRCompliance(employee_id=emp.id)
    elif req.table == "it_provisioning":
        record = emp.it_provisioning or ITProvisioning(employee_id=emp.id)
    elif req.table == "workplace_logistics":
        record = emp.workplace_logistics or WorkplaceLogistics(employee_id=emp.id)
    else:
        raise HTTPException(status_code=400, detail="Invalid table")

    for field, val in req.fields.items():
        if hasattr(record, field):
            setattr(record, field, val)

    db.add(record)
    db.commit()

    # Live Supabase Sync
    if supabase_client:
        try:
            supabase_client.table(req.table).update(req.fields).eq("employee_id", employee_id).execute()
        except Exception as e:
            print(f"Supabase process update sync notice: {e}")

    # Silent audit logging
    log_audit_silent(db, req.user_role, f"DIRECT_UPDATE {req.table} for employee {emp.full_name} (ID {emp.id}): {req.fields}")

    db.refresh(emp)
    return build_employee_response(emp)

@app.post("/api/reset-data")
def reset_database(db: Session = Depends(get_db)):
    """Resets the database with the clean initial cohort for demo purposes."""
    db.query(HRCompliance).delete()
    db.query(ITProvisioning).delete()
    db.query(WorkplaceLogistics).delete()
    db.query(Employee).delete()
    db.commit()
    seed_initial_cohort(db)
    return {"success": True, "message": "Demo data reset successfully."}
