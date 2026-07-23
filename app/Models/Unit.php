<?php

namespace App\Models;

use App\Core\App;

class Unit
{
    public static function all()
    {
        return App::getInstance()->make('db')->fetchAll("SELECT * FROM units ORDER BY name ASC");
    }

    public static function create($name)
    {
        $db = App::getInstance()->make('db');
        return $db->execute("INSERT INTO units (name) VALUES (?)", [$name]);
    }

    public static function update($id, $name)
    {
        $db = App::getInstance()->make('db');
        
        // Get old name first to update users
        $oldUnit = $db->fetch("SELECT name FROM units WHERE id = ?", [$id]);
        
        $db->execute("UPDATE units SET name = ? WHERE id = ?", [$name, $id]);
        
        if ($oldUnit) {
            $db->execute("UPDATE users SET unit = ? WHERE unit = ?", [$name, $oldUnit['name']]);
            $db->execute("UPDATE job_requests SET unit = ? WHERE unit = ?", [$name, $oldUnit['name']]);
        }
        
        return true;
    }

    public static function delete($id)
    {
        $db = App::getInstance()->make('db');
        return $db->execute("DELETE FROM units WHERE id = ?", [$id]);
    }
    
    public static function findByName($name)
    {
        $db = App::getInstance()->make('db');
        return $db->fetch("SELECT * FROM units WHERE name = ?", [$name]);
    }
}
