<?php

namespace App\Core\Approval;

use App\Core\App;

class WorkflowService
{
    protected $db;

    public function __construct()
    {
        $this->db = App::getInstance()->make('db');
    }

    public function start($entityType, $entityId, $workflowCode, $actorUserId = null)
    {
        $workflow = $this->db->fetch("SELECT * FROM workflows WHERE code = ? AND is_active = 1", [$workflowCode]);
        if (!$workflow) throw new \Exception("Workflow not found");

        $firstStep = $this->db->fetch("SELECT * FROM workflow_steps WHERE workflow_id = ? ORDER BY step_order ASC LIMIT 1", [$workflow['id']]);
        if (!$firstStep) throw new \Exception("Initial workflow step not found");

        // Update entity (hardcoded for now to job_requests as per requirement)
        $this->db->execute("UPDATE job_requests SET workflow_id = ?, current_step_id = ?, status = ? WHERE id = ?", [
            $workflow['id'], $firstStep['id'], $firstStep['step_key'], $entityId
        ]);

        // Log approval
        $this->db->execute("INSERT INTO approvals (workflow_id, step_id, entity_type, entity_id, action, from_step_id, to_step_id, actor_user_id, comment, created_at) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
            $workflow['id'], $firstStep['id'], $entityType, $entityId, 'submit', null, $firstStep['id'], $actorUserId, 'Initial submission', date('Y-m-d H:i:s')
        ]);

        return true;
    }

    public function approve($entityType, $entityId, $actorUserId, $comment = null, $action = 'approve')
    {
        $entity = $this->db->fetch("SELECT * FROM job_requests WHERE id = ?", [$entityId]);
        $currentStep = $this->db->fetch("SELECT * FROM workflow_steps WHERE id = ?", [$entity['current_step_id']]);
        
        if (!$currentStep['on_approve_next_step_id']) {
            throw new \Exception("No next step defined for approval");
        }

        $nextStep = $this->db->fetch("SELECT * FROM workflow_steps WHERE id = ?", [$currentStep['on_approve_next_step_id']]);

        $this->db->execute("UPDATE job_requests SET current_step_id = ?, status = ? WHERE id = ?", [
            $nextStep['id'], $nextStep['step_key'], $entityId
        ]);

        $this->db->execute("INSERT INTO approvals (workflow_id, step_id, entity_type, entity_id, action, from_step_id, to_step_id, actor_user_id, comment, created_at) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
            $entity['workflow_id'], $currentStep['id'], $entityType, $entityId, $action, $currentStep['id'], $nextStep['id'], $actorUserId, $comment, date('Y-m-d H:i:s')
        ]);
    }

    public function reject($entityType, $entityId, $actorUserId, $comment = null)
    {
        $entity = $this->db->fetch("SELECT * FROM job_requests WHERE id = ?", [$entityId]);
        $currentStep = $this->db->fetch("SELECT * FROM workflow_steps WHERE id = ?", [$entity['current_step_id']]);
        
        if (!$currentStep['on_reject_step_id']) {
            throw new \Exception("No rejection step defined");
        }

        $nextStep = $this->db->fetch("SELECT * FROM workflow_steps WHERE id = ?", [$currentStep['on_reject_step_id']]);

        $this->db->execute("UPDATE job_requests SET current_step_id = ?, status = ? WHERE id = ?", [
            $nextStep['id'], $nextStep['step_key'], $entityId
        ]);

        $this->db->execute("INSERT INTO approvals (workflow_id, step_id, entity_type, entity_id, action, from_step_id, to_step_id, actor_user_id, comment, created_at) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
            $entity['workflow_id'], $currentStep['id'], $entityType, $entityId, 'reject', $currentStep['id'], $nextStep['id'], $actorUserId, $comment, date('Y-m-d H:i:s')
        ]);
    }

    public function complete($entityType, $entityId, $actorUserId, $comment = null)
    {
        $entity = $this->db->fetch("SELECT * FROM job_requests WHERE id = ?", [$entityId]);
        $currentStep = $this->db->fetch("SELECT * FROM workflow_steps WHERE id = ?", [$entity['current_step_id']]);
        
        return $this->approve($entityType, $entityId, $actorUserId, $comment, 'complete');
    }

    public function history($entityType, $entityId)
    {
        return $this->db->fetchAll("
            SELECT a.*, u.name as actor_name, u.email as actor_email, 
                   fs.name as from_step_name, ts.name as to_step_name
            FROM approvals a
            LEFT JOIN users u ON a.actor_user_id = u.id
            LEFT JOIN workflow_steps fs ON a.from_step_id = fs.id
            LEFT JOIN workflow_steps ts ON a.to_step_id = ts.id
            WHERE a.entity_type = ? AND a.entity_id = ?
            ORDER BY a.created_at ASC
        ", [$entityType, $entityId]);
    }

    public function logAction($entityType, $entityId, $action, $actorUserId, $comment = null)
    {
        $entity = $this->db->fetch("SELECT * FROM job_requests WHERE id = ?", [$entityId]);
        
        $this->db->execute("INSERT INTO approvals (workflow_id, step_id, entity_type, entity_id, action, actor_user_id, comment, created_at) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
            ($entity['workflow_id'] ?? null), ($entity['current_step_id'] ?? null), $entityType, $entityId, $action, $actorUserId, $comment, date('Y-m-d H:i:s')
        ]);
    }

    public function logActivity($entityId, $actorUserId, $action, $comment = null)
    {
        $this->db->execute("INSERT INTO approvals (entity_type, entity_id, action, actor_user_id, comment, created_at) 
                           VALUES (?, ?, ?, ?, ?, ?)", [
            'system', $entityId, $action, $actorUserId, $comment, date('Y-m-d H:i:s')
        ]);
    }

    public function canAct($user, $requiredRole)
    {
        if (!$user) return false;

        // Admin Override: Admin can act on anything
        if ($user['role'] === 'admin') return true;

        if ($requiredRole === 'public') return true;
        
        // Normal role check
        if ($user['role'] === $requiredRole) return true;

        // Delegation check: Is this user an "Acting Manager" right now?
        if ($requiredRole === 'manager') {
            $delegation = \App\Models\Delegation::findActive($user['id']);
            if ($delegation) {
                return true;
            }
        }

        return false;
    }
}
