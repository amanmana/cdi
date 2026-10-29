-- Migration for Mega Projects Feature
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_by_user_id INTEGER NOT NULL,
  status TEXT DEFAULT 'active', -- active, pending, completed, on_hold, cancelled
  status_note TEXT,
  start_date TEXT,
  target_deadline TEXT,
  assigned_unit_ids TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE job_requests ADD COLUMN project_id INTEGER REFERENCES projects(id);
