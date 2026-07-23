<?php

namespace App\Core;

class Request
{
    protected $params = [];

    public function method()
    {
        return $_SERVER['REQUEST_METHOD'];
    }

    public function path()
    {
        $path = $_SERVER['REQUEST_URI'] ?? '/';
        
        // Remove query string
        if (($pos = strpos($path, '?')) !== false) {
            $path = substr($path, 0, $pos);
        }

        // Subdirectory fix
        $base = str_replace(['public/index.php', 'index.php'], '', $_SERVER['SCRIPT_NAME']);
        $base = rtrim($base, '/');
        
        if ($base !== '' && (strpos($path, $base) === 0)) {
            $path = substr($path, strlen($base));
        }

        return '/' . trim($path, '/');
    }

    public function all()
    {
        return array_merge($_GET, $_POST);
    }

    public function input($key, $default = null)
    {
        return $_POST[$key] ?? $default;
    }

    public function query($key, $default = null)
    {
        return $_GET[$key] ?? $default;
    }

    public function setParams($params)
    {
        $this->params = $params;
    }

    public function param($key, $default = null)
    {
        return $this->params[$key] ?? $default;
    }
}
