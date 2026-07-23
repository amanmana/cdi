<?php

namespace App\Models;

use App\Core\DB;

class TaskInvitation {
    
    protected static function db() {
        return \App\Core\App::getInstance()->make('db');
    }
    
    public static function create($jobRequestId, $inviterId, $inviteeId, $taskDescription) {
        $db = self::db();
        $db->beginTransaction();
        try {
            $sql = "INSERT INTO task_invitations (job_request_id, inviter_id, invitee_id, task_description, status) 
                    VALUES (?, ?, ?, ?, 'accepted')";
            $db->execute($sql, [$jobRequestId, $inviterId, $inviteeId, $taskDescription]);
            
            // Also add to job_request_staff table
            $sql2 = "INSERT IGNORE INTO job_request_staff (job_request_id, staff_id, created_at) VALUES (?, ?, ?)";
            $db->execute($sql2, [$jobRequestId, $inviteeId, date('Y-m-d H:i:s')]);
            
            $db->commit();
            return true;
        } catch (\Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }
    
    public static function getByJobRequest($jobRequestId) {
        $sql = "SELECT ti.*, 
                        inviter.name as inviter_name,
                        invitee.name as invitee_name,
                        invitee.email as invitee_email
                FROM task_invitations ti
                LEFT JOIN users inviter ON ti.inviter_id = inviter.id
                LEFT JOIN users invitee ON ti.invitee_id = invitee.id
                WHERE ti.job_request_id = ?
                ORDER BY ti.created_at DESC";
        return self::db()->fetchAll($sql, [$jobRequestId]);
    }
    
    public static function isAlreadyInvited($jobRequestId, $inviteeId) {
        $sql = "SELECT COUNT(*) as count FROM task_invitations 
                WHERE job_request_id = ? AND invitee_id = ?";
        $result = self::db()->fetch($sql, [$jobRequestId, $inviteeId]);
        return ($result['count'] ?? 0) > 0;
    }
    
    public static function isStaffAssigned($jobRequestId, $staffId) {
        $sql = "SELECT COUNT(*) as count FROM job_request_staff 
                WHERE job_request_id = ? AND staff_id = ?";
        $result = self::db()->fetch($sql, [$jobRequestId, $staffId]);
        return ($result['count'] ?? 0) > 0;
    }

    public static function isStaffInvolved($jobRequestId, $staffId) {
        $sql = "SELECT 
                    (SELECT COUNT(*) FROM job_request_staff WHERE job_request_id = ? AND staff_id = ?) +
                    (SELECT COUNT(*) FROM task_invitations WHERE job_request_id = ? AND invitee_id = ?) as total";
        $result = self::db()->fetch($sql, [$jobRequestId, $staffId, $jobRequestId, $staffId]);
        return ($result['total'] ?? 0) > 0;
    }
}
