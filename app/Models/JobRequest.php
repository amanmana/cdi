<?php

namespace App\Models;

use App\Core\App;

class JobRequest
{
    public static function all($search = null)
    {
        $user = auth()->user();
        $where = "";
        $params = [];
        if ($user) {
            if ($user['role'] === 'client') {
                $where = " WHERE jr.client_email = ?";
                $params[] = $user['email'];
            } elseif ($user['role'] === 'staff') {
                $delegation = \App\Models\Delegation::findActive($user['id']);
                if ($delegation) {
                    $where = " WHERE (EXISTS (SELECT 1 FROM job_request_staff jrs WHERE jrs.job_request_id = jr.id AND jrs.staff_id = ?) OR jr.unit = ?)";
                    $params[] = $user['id'];
                    $params[] = $delegation['manager_unit'];
                } else {
                    $where = " WHERE EXISTS (SELECT 1 FROM job_request_staff jrs WHERE jrs.job_request_id = jr.id AND jrs.staff_id = ?)";
                    $params[] = $user['id'];
                }
            } elseif ($user['role'] !== 'admin') {
                $where = " WHERE jr.unit = ?";
                $params[] = $user['unit'];
            }
        }

        if ($search) {
            $searchTerm = '%' . $search . '%';
            $searchWhere = "(jr.id LIKE ? OR jr.ticket_no LIKE ? OR jr.title LIKE ? OR jr.client_name LIKE ? OR jr.client_email LIKE ? OR jr.additional_data LIKE ?)";
            
            if ($where === "") {
                $where = " WHERE " . $searchWhere;
            } else {
                $where .= " AND " . $searchWhere;
            }
            
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $selectExtra = "";
        if ($user && $user['role'] === 'staff') {
            $selectExtra = ", (SELECT completed_at FROM job_request_staff WHERE job_request_id = jr.id AND staff_id = " . (int)$user['id'] . ") as my_completed_at";
        }

        return App::getInstance()->make('db')->fetchAll("
            SELECT jr.*, ws.name as current_step_name $selectExtra, 
                   (SELECT GROUP_CONCAT(u.name SEPARATOR ', ') FROM users u JOIN job_request_staff jrs ON u.id = jrs.staff_id WHERE jrs.job_request_id = jr.id) as assigned_staff_name,
                   (SELECT COUNT(*) FROM job_request_staff jrs WHERE jrs.job_request_id = jr.id) as total_staff,
                   (SELECT COUNT(*) FROM job_request_staff jrs WHERE jrs.job_request_id = jr.id AND jrs.completed_at IS NOT NULL) as completed_staff,
                   (SELECT JSON_ARRAYAGG(JSON_OBJECT('name', u.name, 'completed', IF(jrs.completed_at IS NOT NULL, 1, 0))) 
                    FROM users u 
                    JOIN job_request_staff jrs ON u.id = jrs.staff_id 
                    WHERE jrs.job_request_id = jr.id) as staff_details
            FROM job_requests jr
            LEFT JOIN workflow_steps ws ON jr.current_step_id = ws.id
            $where
            ORDER BY (jr.status = 'manager_approval') DESC, jr.created_at DESC
        ", $params);
    }

    public static function findByTicket($ticket)
    {
        return App::getInstance()->make('db')->fetch("
            SELECT jr.*, ws.name as current_step_name, ws.step_key, ws.role_required,
                   (SELECT GROUP_CONCAT(u.name SEPARATOR ', ') FROM users u JOIN job_request_staff jrs ON u.id = jrs.staff_id WHERE jrs.job_request_id = jr.id) as assigned_staff_name,
                   (SELECT GROUP_CONCAT(jrs.staff_id) FROM job_request_staff jrs WHERE jrs.job_request_id = jr.id) as assigned_staff_ids,
                   (SELECT GROUP_CONCAT(ti.invitee_id) FROM task_invitations ti WHERE ti.job_request_id = jr.id) as invited_staff_ids,
                   (SELECT COUNT(*) FROM job_request_staff jrs WHERE jrs.job_request_id = jr.id) as total_staff,
                   (SELECT COUNT(*) FROM job_request_staff jrs WHERE jrs.job_request_id = jr.id AND jrs.completed_at IS NOT NULL) as completed_staff
            FROM job_requests jr
            LEFT JOIN workflow_steps ws ON jr.current_step_id = ws.id
            WHERE jr.ticket_no = ?
        ", [$ticket]);
    }

    public static function assignStaff($id, $staffIds)
    {
        $db = App::getInstance()->make('db');
        
        if (!is_array($staffIds)) {
            $staffIds = empty($staffIds) ? [] : [$staffIds];
        }

        // Get current assignments
        $currentStaff = $db->fetchAll("SELECT staff_id FROM job_request_staff WHERE job_request_id = ?", [$id]);
        $currentStaffIds = array_column($currentStaff, 'staff_id');

        // Identify staff to remove (those currently assigned but not in the new list)
        $toRemove = array_diff($currentStaffIds, $staffIds);
        if (!empty($toRemove)) {
            $placeholders = implode(',', array_fill(0, count($toRemove), '?'));
            $db->execute("DELETE FROM job_request_staff WHERE job_request_id = ? AND staff_id IN ($placeholders)", array_merge([$id], $toRemove));
            
            // Also clean up their invitations if any
            $db->execute("DELETE FROM task_invitations WHERE job_request_id = ? AND invitee_id IN ($placeholders)", array_merge([$id], $toRemove));
        }

        // Identify staff to add (those in the new list but not currently assigned)
        $toAdd = array_diff($staffIds, $currentStaffIds);
        foreach ($toAdd as $staffId) {
            $db->execute("INSERT INTO job_request_staff (job_request_id, staff_id, created_at) VALUES (?, ?, ?)", [
                $id, $staffId, date('Y-m-d H:i:s')
            ]);
        }

        return $toAdd;
    }

    public static function create($data)
    {
        $db = App::getInstance()->make('db');
        
        // Generate ticket: 2 uppercase letters + 6 numbers (e.g., DA793272)
        $letters = substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 0, 2);
        $numbers = substr(str_shuffle('0123456789'), 0, 6);
        $ticketNo = $letters . $numbers;
        
        $db->execute("INSERT INTO job_requests (ticket_no, client_name, client_email, title, additional_data, unit, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [
            $ticketNo, $data['client_name'], $data['client_email'], $data['title'], $data['additional_data'] ?? null, $data['unit'], date('Y-m-d H:i:s')
        ]);
        return $db->lastInsertId();
    }

    public static function find($id)
    {
        return App::getInstance()->make('db')->fetch("
            SELECT jr.*, ws.name as current_step_name, ws.step_key, ws.role_required,
                   (SELECT GROUP_CONCAT(u.name SEPARATOR ', ') FROM users u JOIN job_request_staff jrs ON u.id = jrs.staff_id WHERE jrs.job_request_id = jr.id) as assigned_staff_name,
                   (SELECT GROUP_CONCAT(jrs.staff_id) FROM job_request_staff jrs WHERE jrs.job_request_id = jr.id) as assigned_staff_ids,
                   (SELECT GROUP_CONCAT(ti.invitee_id) FROM task_invitations ti WHERE ti.job_request_id = jr.id) as invited_staff_ids,
                   (SELECT COUNT(*) FROM job_request_staff jrs WHERE jrs.job_request_id = jr.id) as total_staff,
                   (SELECT COUNT(*) FROM job_request_staff jrs WHERE jrs.job_request_id = jr.id AND jrs.completed_at IS NOT NULL) as completed_staff
            FROM job_requests jr
            LEFT JOIN workflow_steps ws ON jr.current_step_id = ws.id
            WHERE jr.id = ?
        ", [$id]);
    }

    public static function markStaffComplete($jobRequestId, $staffId)
    {
        $db = App::getInstance()->make('db');
        return $db->execute("UPDATE job_request_staff SET completed_at = ? WHERE job_request_id = ? AND staff_id = ?", [
            date('Y-m-d H:i:s'), $jobRequestId, $staffId
        ]);
    }

    public static function isStaffCompleted($jobRequestId, $staffId)
    {
        $db = App::getInstance()->make('db');
        $row = $db->fetch("SELECT completed_at FROM job_request_staff WHERE job_request_id = ? AND staff_id = ?", [$jobRequestId, $staffId]);
        return ($row && $row['completed_at'] !== null);
    }

    public static function getAssignedStaffDetails($id)
    {
        return App::getInstance()->make('db')->fetchAll("
            SELECT u.id as staff_id, u.name, u.email, jrs.completed_at, 
                   ti.task_description, inviter.name as inviter_name
            FROM users u 
            JOIN job_request_staff jrs ON u.id = jrs.staff_id 
            LEFT JOIN task_invitations ti ON jrs.job_request_id = ti.job_request_id AND jrs.staff_id = ti.invitee_id
            LEFT JOIN users inviter ON ti.inviter_id = inviter.id
            WHERE jrs.job_request_id = ?
        ", [$id]);
    }

    public static function getByStaff($staffId)
    {
        return App::getInstance()->make('db')->fetchAll("
            SELECT jr.*, ws.name as current_step_name, jrs.completed_at as staff_part_completed_at,
                   (SELECT COUNT(*) FROM job_request_staff WHERE job_request_id = jr.id) as total_staff,
                   (SELECT COUNT(*) FROM job_request_staff WHERE job_request_id = jr.id AND completed_at IS NOT NULL) as completed_staff
            FROM job_requests jr
            JOIN job_request_staff jrs ON jr.id = jrs.job_request_id
            LEFT JOIN workflow_steps ws ON jr.current_step_id = ws.id
            WHERE jrs.staff_id = ?
            ORDER BY jr.created_at DESC
        ", [$staffId]);
    }

    public static function updateDates($id, $startDate, $deadline)
    {
        $db = App::getInstance()->make('db');
        return $db->execute("UPDATE job_requests SET start_date = ?, deadline = ? WHERE id = ?", [
            $startDate ?: null, 
            $deadline ?: null, 
            $id
        ]);
    }

    public static function updateDescription($id, $description)
    {
        $db = App::getInstance()->make('db');
        return $db->execute("UPDATE job_requests SET description = ? WHERE id = ?", [
            $description, 
            $id
        ]);
    }

    public static function delete($id)
    {
        $db = App::getInstance()->make('db');
        
        // Remove from related tables first
        $db->execute("DELETE FROM approvals WHERE entity_id = ? AND entity_type = 'job_request'", [$id]);
        $db->execute("DELETE FROM job_request_staff WHERE job_request_id = ?", [$id]);
        
        // Remove the request itself
        return $db->execute("DELETE FROM job_requests WHERE id = ?", [$id]);
    }
}
