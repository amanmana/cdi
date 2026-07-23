# Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'staff') NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Workflow Steps table
CREATE TABLE IF NOT EXISTS workflow_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workflow_id INT NOT NULL,
    step_order INT NOT NULL,
    step_key VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role_required VARCHAR(50) NOT NULL,
    on_approve_next_step_id INT NULL,
    on_reject_step_id INT NULL,
    is_terminal TINYINT(1) DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    INDEX (workflow_id, step_order)
);

-- Job Requests table (Entity)
CREATE TABLE IF NOT EXISTS job_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_no VARCHAR(20) UNIQUE,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    workflow_id INT NULL,
    current_step_id INT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_by INT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id),
    FOREIGN KEY (current_step_id) REFERENCES workflow_steps(id)
);

-- Approvals table (History)
CREATE TABLE IF NOT EXISTS approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workflow_id INT NOT NULL,
    step_id INT NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    action VARCHAR(50) NOT NULL, -- submit, approve, reject, complete
    from_step_id INT NULL,
    to_step_id INT NULL,
    actor_user_id INT NULL,
    comment TEXT,
    created_at DATETIME NOT NULL,
    INDEX (entity_type, entity_id),
    FOREIGN KEY (workflow_id) REFERENCES workflows(id),
    FOREIGN KEY (step_id) REFERENCES workflow_steps(id),
    FOREIGN KEY (actor_user_id) REFERENCES users(id)
);

-- Job Request Staff table (Many-to-Many relationship between job requests and staff)
CREATE TABLE IF NOT EXISTS job_request_staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_request_id INT NOT NULL,
    staff_id INT NOT NULL,
    completed_at DATETIME NULL COMMENT 'When this staff member completed their part',
    created_at DATETIME NOT NULL,
    FOREIGN KEY (job_request_id) REFERENCES job_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignment (job_request_id, staff_id),
    INDEX idx_job_request (job_request_id),
    INDEX idx_staff (staff_id)
);

-- Task Invitations table (Staff collaboration invitations)
CREATE TABLE IF NOT EXISTS task_invitations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_request_id INT NOT NULL,
    inviter_id INT NOT NULL COMMENT 'Staff who sent the invitation',
    invitee_id INT NOT NULL COMMENT 'Staff who was invited',
    task_description TEXT COMMENT 'Description of what the invitee should do',
    status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (job_request_id) REFERENCES job_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invitee_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_invitation (job_request_id, invitee_id)
);
