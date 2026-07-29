-- CDI System Cloudflare D1 Database Schema

-- Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client', -- admin, manager, staff, client
  unit_id INTEGER,                     -- Foreign Key to units(id)
  unit TEXT,                           -- Associated unit/company name
  phone TEXT,                          -- Contact Phone number
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id)
);

-- Service Units Table
CREATE TABLE IF NOT EXISTS units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  form_schema TEXT, -- JSON string representing custom dynamic fields
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Acting Manager Delegations Table
CREATE TABLE IF NOT EXISTS delegations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  manager_id INTEGER NOT NULL,
  delegate_id INTEGER NOT NULL,
  unit_id INTEGER,                     -- Foreign Key to units(id)
  unit TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, expired, cancelled
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES users(id),
  FOREIGN KEY (delegate_id) REFERENCES users(id),
  FOREIGN KEY (unit_id) REFERENCES units(id)
);

-- Job Requests Table
CREATE TABLE IF NOT EXISTS job_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_no TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  unit_id INTEGER,                     -- Foreign Key to units(id)
  unit TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'manager_approval', -- manager_approval, staff_processing, completed, rejected
  current_step_name TEXT DEFAULT 'Manager Review',
  assigned_staff_ids TEXT,                         -- Comma-separated user IDs
  start_date TEXT,
  deadline TEXT,
  additional_data TEXT,                             -- JSON string for dynamic fields
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id)
);

-- Sub-Tasks Table for Designers / Staff
CREATE TABLE IF NOT EXISTS job_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_request_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to_user_id INTEGER NOT NULL,
  assigned_by_user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed
  due_date TEXT,
  completed_at TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_request_id) REFERENCES job_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to_user_id) REFERENCES users(id),
  FOREIGN KEY (assigned_by_user_id) REFERENCES users(id)
);

-- Staff Progress Reports Table
CREATE TABLE IF NOT EXISTS staff_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_request_id INTEGER NOT NULL,
  staff_id INTEGER NOT NULL,
  report_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_request_id) REFERENCES job_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES users(id)
);

-- Audit History / Workflow Log Table
CREATE TABLE IF NOT EXISTS workflow_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_request_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  actor_id INTEGER,
  actor_name TEXT,
  from_step_name TEXT,
  to_step_name TEXT,
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_request_id) REFERENCES job_requests(id) ON DELETE CASCADE
);

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
