<?php

namespace App\Core;

class Session
{
    public function start()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_set_cookie_params([
                'httponly' => true,
                'samesite' => 'Lax'
            ]);
            session_start();
        }
    }

    public function set($key, $value)
    {
        $_SESSION[$key] = $value;
    }

    public function get($key, $default = null)
    {
        return $_SESSION[$key] ?? $default;
    }

    public function forget($key)
    {
        unset($_SESSION[$key]);
    }

    public function flashSet($key, $value)
    {
        $_SESSION['_flash'][$key] = $value;
    }

    public function flashGet($key, $default = null)
    {
        $value = $_SESSION['_flash'][$key] ?? $default;
        unset($_SESSION['_flash'][$key]);
        return $value;
    }

    public function has($key)
    {
        return isset($_SESSION[$key]);
    }
}
