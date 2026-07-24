-- Seed Initial Admin, Manager, Staff Users (Password: password123)
-- PBKDF2 WebCrypto hashes for password123
INSERT OR IGNORE INTO users (id, name, email, password_hash, role, unit) VALUES
(1, 'System Admin', 'admin@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'admin', 'IT Support'),
(2, 'Workflow Manager', 'manager@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'manager', 'Events'),
(3, 'Staff Member', 'staff@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'staff', 'Graphic'),
(4, 'Lead Designer', 'designer@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'staff', 'Graphic'),
(5, 'Client User', 'client@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'client', 'Business Unit');

-- Seed Units
INSERT OR IGNORE INTO units (id, name, form_schema) VALUES
(1, 'Events', '[{"id":"event_name","label":"Event Name","type":"text","required":true},{"id":"event_date","label":"Event Date","type":"date","required":true}]'),
(2, 'Graphic', '[{"id":"media_type","label":"Media Type","type":"select","options":["Banner","Poster","Brosur"],"required":true}]'),
(3, 'Socmed', '[{"id":"platform","label":"Platform","type":"select","options":["Facebook","Instagram","TikTok"],"required":true}]'),
(4, 'Writer', '[{"id":"word_count","label":"Estimated Words","type":"number","required":false}]');

-- Seed Sample Job Request
INSERT OR IGNORE INTO job_requests (id, ticket_no, client_name, client_email, title, description, unit, status, current_step_name, assigned_staff_ids, start_date, deadline, additional_data) VALUES
(1, 'VT397304', 'Ahmad Client', 'ahmad@mimos.my', 'Annual Gala Dinner Design Request', 'Need poster and social media banner designs for annual gala dinner.', 'Graphic', 'staff_processing', 'Staff Processing', '3,4', '2026-07-20', '2026-07-30', '{"media_type":"Poster"}');

-- Seed Sub-Tasks for Job Request 1
INSERT OR IGNORE INTO job_tasks (id, job_request_id, title, description, assigned_to_user_id, assigned_by_user_id, status, due_date) VALUES
(1, 1, 'Design Main Gala Dinner Poster', 'Create 3 poster layout options in A3 format', 3, 2, 'in_progress', '2026-07-25'),
(2, 1, 'Social Media Banners (FB & IG)', 'Adapt poster design into 1080x1080 and 1920x1080 formats', 4, 2, 'pending', '2026-07-28');

-- Seed Initial System Settings
INSERT OR IGNORE INTO system_settings (key, value) VALUES
('app_name', 'CDI Job Request System'),
('app_email', 'admin@mimos.my'),
('primary_color', '#3b82f6');
