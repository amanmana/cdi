-- Performance Optimization Indexes for CDI Database
-- Dramatically reduces rows read across all queries and eliminates full table scans

CREATE INDEX IF NOT EXISTS idx_job_requests_unit ON job_requests(unit);
CREATE INDEX IF NOT EXISTS idx_job_requests_unit_id ON job_requests(unit_id);
CREATE INDEX IF NOT EXISTS idx_job_requests_status ON job_requests(status);
CREATE INDEX IF NOT EXISTS idx_job_requests_dept_id ON job_requests(department_id);
CREATE INDEX IF NOT EXISTS idx_job_requests_updated_at ON job_requests(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_requests_created_at ON job_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_requests_client_email ON job_requests(client_email);

CREATE INDEX IF NOT EXISTS idx_workflow_logs_job_id ON workflow_logs(job_request_id);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_created_at ON workflow_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_tasks_job_id ON job_tasks(job_request_id);
CREATE INDEX IF NOT EXISTS idx_job_tasks_assigned_to ON job_tasks(assigned_to_user_id);

CREATE INDEX IF NOT EXISTS idx_staff_reports_job_id ON staff_reports(job_request_id);

CREATE INDEX IF NOT EXISTS idx_users_unit ON users(unit);
CREATE INDEX IF NOT EXISTS idx_users_unit_id ON users(unit_id);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_units_head_id ON units(head_id);
CREATE INDEX IF NOT EXISTS idx_units_dept_id ON units(department_id);

CREATE INDEX IF NOT EXISTS idx_delegations_lookup ON delegations(delegate_id, status, start_date, end_date);
