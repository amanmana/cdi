<?php

namespace App\Models;

use App\Core\App;

class Setting
{
    public static function get($key, $default = null)
    {
        $db = App::getInstance()->make('db');
        $row = $db->fetch("SELECT `value` FROM settings WHERE `key` = ?", [$key]);
        return $row ? $row['value'] : $default;
    }

    public static function set($key, $value)
    {
        $db = App::getInstance()->make('db');
        $exists = $db->fetch("SELECT `key` FROM settings WHERE `key` = ?", [$key]);
        
        if ($exists) {
            return $db->execute("UPDATE settings SET `value` = ? WHERE `key` = ?", [$value, $key]);
        } else {
            return $db->execute("INSERT INTO settings (`key`, `value`) VALUES (?, ?)", [$key, $value]);
        }
    }
}
