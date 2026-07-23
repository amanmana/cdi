<?php

namespace App\Models;

use App\Core\App;

class JobStaffReport
{
    protected static function db()
    {
        return App::getInstance()->make('db');
    }

    public static function create($data)
    {
        return self::db()->execute(
            "INSERT INTO job_staff_reports (job_request_id, staff_id, report_text, created_at) VALUES (?, ?, ?, ?)",
            [
                $data['job_request_id'],
                $data['staff_id'],
                $data['report_text'],
                date('Y-m-d H:i:s')
            ]
        );
    }

    public static function update($id, $text)
    {
        return self::db()->execute(
            "UPDATE job_staff_reports SET report_text = ? WHERE id = ?",
            [$text, $id]
        );
    }

    public static function delete($id)
    {
        return self::db()->execute("DELETE FROM job_staff_reports WHERE id = ?", [$id]);
    }

    public static function getByJobAndStaff($jobRequestId = null, $staffId = null)
    {
        $sql = "SELECT r.*, u.name as staff_name 
                FROM job_staff_reports r 
                JOIN users u ON r.staff_id = u.id 
                WHERE 1=1";
        $params = [];
        
        if ($jobRequestId) {
            $sql .= " AND r.job_request_id = ?";
            $params[] = $jobRequestId;
        }

        if ($staffId) {
            $sql .= " AND r.staff_id = ?";
            $params[] = $staffId;
        }
        
        $sql .= " ORDER BY r.created_at ASC";
        return self::db()->fetchAll($sql, $params);
    }

    public static function find($id)
    {
        return self::db()->fetch("SELECT * FROM job_staff_reports WHERE id = ?", [$id]);
    }
}
