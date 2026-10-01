-- ====================================================================
-- Employee Onboarding Orchestrator - Supabase PostgreSQL Schema
-- Database Schema for Phase 1
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if needed (in reverse dependency order)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS workplace_logistics CASCADE;
DROP TABLE IF EXISTS it_provisioning CASCADE;
DROP TABLE IF EXISTS hr_compliance CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- 2. Employees Table
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    start_date DATE NOT NULL,
    work_mode TEXT NOT NULL DEFAULT 'Hybrid',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HR Compliance Table
CREATE TABLE hr_compliance (
    employee_id INTEGER PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
    nda_signed BOOLEAN NOT NULL DEFAULT FALSE,
    bgv_status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'In Progress', 'Verified', 'Failed'
    payroll_ready BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. IT Provisioning Table
CREATE TABLE it_provisioning (
    employee_id INTEGER PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
    sso_account_active BOOLEAN NOT NULL DEFAULT FALSE,
    github_invited BOOLEAN NOT NULL DEFAULT FALSE,
    aws_sandbox_ready BOOLEAN NOT NULL DEFAULT FALSE,
    vpn_profile_issued BOOLEAN NOT NULL DEFAULT FALSE,
    ticket_blocker TEXT DEFAULT 'None',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Workplace Logistics Table
CREATE TABLE workplace_logistics (
    employee_id INTEGER PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
    laptop_assigned TEXT NOT NULL DEFAULT 'Pending',
    shipping_status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'In Transit', 'Shipped', 'Delivered'
    building_badge_issued BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Audit Logs Table (Silent table, do NOT display on the frontend)
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_role TEXT NOT NULL,
    action_taken TEXT NOT NULL
);

-- 7. Trigger Function for Role-Based Cascading Insert
CREATE OR REPLACE FUNCTION handle_new_employee_cascades()
RETURNS TRIGGER AS $$
DECLARE
    default_laptop TEXT;
BEGIN
    -- Determine default laptop based on role/department
    IF NEW.department = 'Engineering' OR NEW.role ILIKE '%engineer%' OR NEW.role ILIKE '%developer%' THEN
        default_laptop := 'MacBook Pro 16" (M3 Max)';
    ELSIF NEW.department = 'Design' THEN
        default_laptop := 'MacBook Pro 14" (M3 Pro)';
    ELSE
        default_laptop := 'Dell XPS 15 (i7/32GB)';
    END IF;

    -- Insert default HR Compliance
    INSERT INTO hr_compliance (employee_id, nda_signed, bgv_status, payroll_ready)
    VALUES (NEW.id, FALSE, 'Pending', FALSE)
    ON CONFLICT (employee_id) DO NOTHING;

    -- Insert default IT Provisioning
    INSERT INTO it_provisioning (employee_id, sso_account_active, github_invited, aws_sandbox_ready, vpn_profile_issued, ticket_blocker)
    VALUES (
        NEW.id,
        FALSE,
        CASE WHEN NEW.department = 'Engineering' THEN FALSE ELSE TRUE END,
        CASE WHEN NEW.role ILIKE '%devops%' OR NEW.role ILIKE '%cloud%' OR NEW.role ILIKE '%backend%' THEN FALSE ELSE TRUE END,
        FALSE,
        'None'
    )
    ON CONFLICT (employee_id) DO NOTHING;

    -- Insert default Workplace Logistics
    INSERT INTO workplace_logistics (employee_id, laptop_assigned, shipping_status, building_badge_issued)
    VALUES (
        NEW.id,
        default_laptop,
        CASE WHEN NEW.work_mode = 'Remote' THEN 'Pending' ELSE 'Pickup Scheduled' END,
        CASE WHEN NEW.work_mode = 'Remote' THEN TRUE ELSE FALSE END
    )
    ON CONFLICT (employee_id) DO NOTHING;

    -- Silent Audit Logging of the Cascade
    INSERT INTO audit_logs (user_role, action_taken)
    VALUES ('SYSTEM_TRIGGER', 'Automated cascading onboarding records initialized for employee ID ' || NEW.id || ' (' || NEW.full_name || ')');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to employees table
DROP TRIGGER IF EXISTS trigger_cascade_onboarding ON employees;
CREATE TRIGGER trigger_cascade_onboarding
AFTER INSERT ON employees
FOR EACH ROW
EXECUTE FUNCTION handle_new_employee_cascades();

-- 8. Row Level Security (RLS) Configuration for Supabase
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_provisioning ENABLE ROW LEVEL SECURITY;
ALTER TABLE workplace_logistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Select policies: Authenticated users can view recruit records
CREATE POLICY "Allow authenticated read on employees" ON employees FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read on hr_compliance" ON hr_compliance FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read on it_provisioning" ON it_provisioning FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read on workplace_logistics" ON workplace_logistics FOR SELECT USING (true);

-- Role-based mutation policies in Supabase
-- HR Manager: full access
CREATE POLICY "HR Manager full access employees" ON employees FOR ALL USING (auth.jwt() ->> 'role' = 'HR Manager');
CREATE POLICY "HR Manager full access hr" ON hr_compliance FOR ALL USING (auth.jwt() ->> 'role' = 'HR Manager');
CREATE POLICY "HR Manager full access it" ON it_provisioning FOR ALL USING (auth.jwt() ->> 'role' = 'HR Manager');
CREATE POLICY "HR Manager full access logistics" ON workplace_logistics FOR ALL USING (auth.jwt() ->> 'role' = 'HR Manager');

-- HR: access to employees and hr_compliance
CREATE POLICY "HR access employees" ON employees FOR ALL USING (auth.jwt() ->> 'role' = 'HR');
CREATE POLICY "HR access hr_compliance" ON hr_compliance FOR ALL USING (auth.jwt() ->> 'role' = 'HR');

-- IT: access to it_provisioning
CREATE POLICY "IT access it_provisioning" ON it_provisioning FOR ALL USING (auth.jwt() ->> 'role' = 'IT');

-- Facilities: access to workplace_logistics
CREATE POLICY "Facilities access workplace_logistics" ON workplace_logistics FOR ALL USING (auth.jwt() ->> 'role' = 'Facilities');

-- 9. Seed Realistic Sample Data
-- Notice start dates relative to current date (Oct 1, 2026):
-- Alex Rivera: starts in 1 day (Oct 2) -> Critical (<2 days)
-- Marcus Chen: starts in 3 days (Oct 4) -> At Risk (<4 days)
-- Elena Rostova: starts in 10 days (Oct 11) -> On Track (>4 days)
-- Sofia Patel: starts in 14 days (Oct 15) -> On Track (>4 days)
-- Liam Vance: starts in 1 day (Oct 2) -> Critical (<2 days) - Fully completed sample!

INSERT INTO employees (id, full_name, email, role, department, start_date, work_mode)
VALUES 
(1, 'Alex Rivera', 'alex.rivera@techcorp.io', 'Senior Backend Engineer', 'Engineering', CURRENT_DATE + INTERVAL '1 day', 'Hybrid'),
(2, 'Marcus Chen', 'marcus.chen@techcorp.io', 'DevOps & Cloud Architect', 'Infrastructure', CURRENT_DATE + INTERVAL '3 day', 'Remote'),
(3, 'Elena Rostova', 'elena.rostova@techcorp.io', 'Product Design Lead', 'Design', CURRENT_DATE + INTERVAL '10 day', 'Hybrid'),
(4, 'Sofia Patel', 'sofia.patel@techcorp.io', 'Engineering Manager', 'Engineering', CURRENT_DATE + INTERVAL '14 day', 'On-site'),
(5, 'Liam Vance', 'liam.vance@techcorp.io', 'Full Stack Developer', 'Engineering', CURRENT_DATE + INTERVAL '1 day', 'Remote')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence to continue after seed IDs
SELECT setval('employees_id_seq', (SELECT MAX(id) FROM employees));

-- Update HR Compliance for Seed Data
UPDATE hr_compliance SET nda_signed = TRUE, bgv_status = 'In Progress', payroll_ready = FALSE WHERE employee_id = 1;
UPDATE hr_compliance SET nda_signed = TRUE, bgv_status = 'Verified', payroll_ready = TRUE WHERE employee_id = 2;
UPDATE hr_compliance SET nda_signed = FALSE, bgv_status = 'Pending', payroll_ready = FALSE WHERE employee_id = 3;
UPDATE hr_compliance SET nda_signed = TRUE, bgv_status = 'Verified', payroll_ready = FALSE WHERE employee_id = 4;
UPDATE hr_compliance SET nda_signed = TRUE, bgv_status = 'Verified', payroll_ready = TRUE WHERE employee_id = 5;

-- Update IT Provisioning for Seed Data
UPDATE it_provisioning SET sso_account_active = TRUE, github_invited = FALSE, aws_sandbox_ready = FALSE, vpn_profile_issued = TRUE, ticket_blocker = 'Awaiting GitHub 2FA' WHERE employee_id = 1;
UPDATE it_provisioning SET sso_account_active = TRUE, github_invited = TRUE, aws_sandbox_ready = TRUE, vpn_profile_issued = TRUE, ticket_blocker = 'None' WHERE employee_id = 2;
UPDATE it_provisioning SET sso_account_active = FALSE, github_invited = FALSE, aws_sandbox_ready = TRUE, vpn_profile_issued = FALSE, ticket_blocker = 'None' WHERE employee_id = 3;
UPDATE it_provisioning SET sso_account_active = TRUE, github_invited = TRUE, aws_sandbox_ready = TRUE, vpn_profile_issued = FALSE, ticket_blocker = 'None' WHERE employee_id = 4;
UPDATE it_provisioning SET sso_account_active = TRUE, github_invited = TRUE, aws_sandbox_ready = TRUE, vpn_profile_issued = TRUE, ticket_blocker = 'None' WHERE employee_id = 5;

-- Update Workplace Logistics for Seed Data
UPDATE workplace_logistics SET laptop_assigned = 'MacBook Pro 16" (M3 Max)', shipping_status = 'In Transit', building_badge_issued = FALSE WHERE employee_id = 1;
UPDATE workplace_logistics SET laptop_assigned = 'MacBook Pro 16" (M3 Max)', shipping_status = 'Delivered', building_badge_issued = TRUE WHERE employee_id = 2;
UPDATE workplace_logistics SET laptop_assigned = 'MacBook Pro 14" (M3 Pro)', shipping_status = 'Pending', building_badge_issued = FALSE WHERE employee_id = 3;
UPDATE workplace_logistics SET laptop_assigned = 'Dell XPS 15 (i7/32GB)', shipping_status = 'Pickup Scheduled', building_badge_issued = TRUE WHERE employee_id = 4;
UPDATE workplace_logistics SET laptop_assigned = 'MacBook Pro 16" (M3 Max)', shipping_status = 'Delivered', building_badge_issued = TRUE WHERE employee_id = 5;

-- Initial audit log
INSERT INTO audit_logs (user_role, action_taken)
VALUES ('SYSTEM', 'Database initialized with schema and seed employee onboarding cohorts');
