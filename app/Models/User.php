<?php

namespace App\Models;

use App\Core\App;

class User
{
    public static function find($id)
    {
        return App::getInstance()->make('db')->fetch("SELECT * FROM users WHERE id = ?", [$id]);
    }

    public static function findByEmail($email)
    {
        return App::getInstance()->make('db')->fetch("SELECT * FROM users WHERE email = ? LIMIT 1", [$email]);
    }

    public static function all($includeArchived = false)
    {
        $sql = "SELECT * FROM users";
        if (!$includeArchived) {
            $sql .= " WHERE status = 'active'";
        }
        $sql .= " ORDER BY created_at DESC";
        return App::getInstance()->make('db')->fetchAll($sql);
    }

    public static function getByRole($role, $unit = null, $includeArchived = false)
    {
        $sql = "SELECT id, name, email, unit, status FROM users WHERE role = ?";
        $params = [$role];
        
        if (!$includeArchived) {
            $sql .= " AND status = 'active'";
        }

        if ($unit) {
            $sql .= " AND unit = ?";
            $params[] = $unit;
        }
        $sql .= " ORDER BY name ASC";
        return App::getInstance()->make('db')->fetchAll($sql, $params);
    }

    public static function getByUnitAndRole($unit, $role, $includeArchived = false)
    {
        $sql = "SELECT id, name, email, status FROM users WHERE role = ? AND unit = ?";
        if (!$includeArchived) {
            $sql .= " AND status = 'active'";
        }
        return App::getInstance()->make('db')->fetchAll($sql, [$role, $unit]);
    }

    public static function create($data)
    {
        $db = App::getInstance()->make('db');
        $db->execute("INSERT INTO users (name, email, password_hash, role, unit, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [
            $data['name'], $data['email'], password_hash($data['password'], PASSWORD_BCRYPT), $data['role'], $data['unit'] ?? null, 'active', date('Y-m-d H:i:s')
        ]);
        return $db->lastInsertId();
    }

    public static function update($id, $data)
    {
        $db = App::getInstance()->make('db');
        
        $updates = [];
        $params = [];
        
        $updatableFields = ['name', 'email', 'role', 'unit'];
        foreach ($updatableFields as $field) {
            if (array_key_exists($field, $data)) {
                $updates[] = "$field = ?";
                $params[] = $data[$field];
            }
        }

        if (!empty($data['password'])) {
            $updates[] = "password_hash = ?";
            $params[] = password_hash($data['password'], PASSWORD_BCRYPT);
        }

        if (empty($updates)) return;

        $params[] = $id;
        $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
        $db->execute($sql, $params);
    }

    public static function archive($id)
    {
        return App::getInstance()->make('db')->execute("UPDATE users SET status = 'archived' WHERE id = ?", [$id]);
    }

    public static function delete($id)
    {
        // For security and data integrity, we now archive by default
        return self::archive($id);
    }

    public static function forceDelete($id)
    {
        App::getInstance()->make('db')->execute("DELETE FROM users WHERE id = ?", [$id]);
    }
}
