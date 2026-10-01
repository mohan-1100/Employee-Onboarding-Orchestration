import datetime
from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(Text, nullable=False)
    email = Column(Text, unique=True, nullable=False, index=True)
    role = Column(Text, nullable=False)
    department = Column(Text, nullable=False)
    start_date = Column(Date, nullable=False)
    work_mode = Column(Text, nullable=False, default="Hybrid") # Remote, Hybrid, On-site
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    # Relationships (1-to-1)
    hr_compliance = relationship("HRCompliance", back_populates="employee", uselist=False, cascade="all, delete-orphan")
    it_provisioning = relationship("ITProvisioning", back_populates="employee", uselist=False, cascade="all, delete-orphan")
    workplace_logistics = relationship("WorkplaceLogistics", back_populates="employee", uselist=False, cascade="all, delete-orphan")

class HRCompliance(Base):
    __tablename__ = "hr_compliance"

    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), primary_key=True)
    nda_signed = Column(Boolean, default=False, nullable=False)
    bgv_status = Column(Text, default="Pending", nullable=False) # 'Pending', 'In Progress', 'Verified', 'Failed'
    payroll_ready = Column(Boolean, default=False, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), onupdate=lambda: datetime.datetime.now(datetime.timezone.utc))

    employee = relationship("Employee", back_populates="hr_compliance")

class ITProvisioning(Base):
    __tablename__ = "it_provisioning"

    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), primary_key=True)
    sso_account_active = Column(Boolean, default=False, nullable=False)
    github_invited = Column(Boolean, default=False, nullable=False)
    aws_sandbox_ready = Column(Boolean, default=False, nullable=False)
    vpn_profile_issued = Column(Boolean, default=False, nullable=False)
    ticket_blocker = Column(Text, default="None", nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), onupdate=lambda: datetime.datetime.now(datetime.timezone.utc))

    employee = relationship("Employee", back_populates="it_provisioning")

class WorkplaceLogistics(Base):
    __tablename__ = "workplace_logistics"

    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), primary_key=True)
    laptop_assigned = Column(Text, default="Pending", nullable=False)
    shipping_status = Column(Text, default="Pending", nullable=False) # 'Pending', 'In Transit', 'Shipped', 'Delivered', 'Pickup Scheduled'
    building_badge_issued = Column(Boolean, default=False, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), onupdate=lambda: datetime.datetime.now(datetime.timezone.utc))

    employee = relationship("Employee", back_populates="workplace_logistics")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)
    user_role = Column(Text, nullable=False)
    action_taken = Column(Text, nullable=False)
