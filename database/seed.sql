-- Seed Workflow
INSERT INTO workflows (id, code, name, created_at) VALUES (1, 'JOB_REQUEST_DEFAULT', 'Standard Job Request Workflow', NOW());

-- Seed Steps (Using fixed IDs for simplicity in references)
-- 1) submitted (role: public) -> approve to 2
-- 2) manager_approval (role: manager) -> approve to 3, reject to 5
-- 3) staff_processing (role: staff) -> complete to 4
-- 4) completed (terminal)
-- 5) rejected (terminal)

-- 1) manager_approval (role: manager) -> approve to 2, reject to 4
-- 2) staff_processing (role: staff) -> complete to 3
-- 3) completed (terminal)
-- 4) rejected (terminal)

INSERT INTO workflow_steps (id, workflow_id, step_order, step_key, name, role_required, on_approve_next_step_id, on_reject_step_id, is_terminal, created_at) 
VALUES 
(1, 1, 1, 'manager_approval', 'Manager Approval', 'manager', 2, 4, 0, NOW()),
(2, 1, 2, 'staff_processing', 'Staff Processing', 'staff', 3, NULL, 0, NOW()),
(3, 1, 3, 'completed', 'Completed', 'staff', NULL, NULL, 1, NOW()),
(4, 1, 4, 'rejected', 'Rejected', 'manager', NULL, NULL, 1, NOW());

-- Seed Users (password123 hashed)
-- admin@example.com / password123
-- manager@example.com / password123
-- staff@example.com / password123

INSERT INTO users (name, email, password_hash, role, created_at) VALUES 
('System Admin', 'admin@example.com', '$2y$10$8khu/HMqCgbsV4KMKaGWy.T3m1LlR3bqQxLk4EjmdNxIh93d8rQe2', 'admin', NOW()),
('Workflow Manager', 'manager@example.com', '$2y$10$8khu/HMqCgbsV4KMKaGWy.T3m1LlR3bqQxLk4EjmdNxIh93d8rQe2', 'manager', NOW()),
('Staff Member', 'staff@example.com', '$2y$10$8khu/HMqCgbsV4KMKaGWy.T3m1LlR3bqQxLk4EjmdNxIh93d8rQe2', 'staff', NOW()),
('Client User', 'client@example.com', '$2y$10$8khu/HMqCgbsV4KMKaGWy.T3m1LlR3bqQxLk4EjmdNxIh93d8rQe2', 'client', NOW());
