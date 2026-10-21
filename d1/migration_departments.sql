-- Migration: Add Departments and Org Structure Support
CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  manager_id INTEGER,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES users(id)
);

-- Add department and public display columns to units
ALTER TABLE units ADD COLUMN department_id INTEGER REFERENCES departments(id);
ALTER TABLE units ADD COLUMN public_label TEXT;
ALTER TABLE units ADD COLUMN is_public INTEGER DEFAULT 1;
ALTER TABLE units ADD COLUMN head_id INTEGER REFERENCES users(id);

-- Add department and unit head columns to users
ALTER TABLE users ADD COLUMN department_id INTEGER REFERENCES departments(id);
ALTER TABLE users ADD COLUMN is_unit_head INTEGER DEFAULT 0;

-- Add department_id to job_requests
ALTER TABLE job_requests ADD COLUMN department_id INTEGER REFERENCES departments(id);
