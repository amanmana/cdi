<?php

namespace App\Models;

use App\Core\App;

class Delegation
{
    public static function create($data)
    {
        $db = App::getInstance()->make('db');
        return $db->execute("INSERT INTO delegations (manager_id, delegate_id, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)", [
            $data['manager_id'], $data['delegate_id'], $data['start_date'], $data['end_date'], 'active'
        ]);
    }

    public static function findActive($delegateId)
    {
        $db = App::getInstance()->make('db');
        $today = date('Y-m-d');
        
        // Find if this user is a delegate for any manager right now
        $sql = "
            SELECT d.*, m.unit as manager_unit, m.role as manager_role
            FROM delegations d
            JOIN users m ON d.manager_id = m.id
            WHERE d.delegate_id = ? 
              AND d.status = 'active' 
              AND d.start_date <= CURDATE() 
              AND d.end_date >= CURDATE()
            LIMIT 1
        ";
        return $db->fetch($sql, [$delegateId]);
    }

    public static function getByManager($managerId)
    {
        $db = App::getInstance()->make('db');
        return $db->fetchAll("
            SELECT d.*, u.name as delegate_name 
            FROM delegations d 
            JOIN users u ON d.delegate_id = u.id 
            WHERE d.manager_id = ? 
            ORDER BY d.created_at DESC
        ", [$managerId]);
    }

    public static function deactivate($id)
    {
        $db = App::getInstance()->make('db');
        return $db->execute("UPDATE delegations SET status = 'inactive' WHERE id = ?", [$id]);
    }
}
