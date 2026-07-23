<?php

function env($key, $default = null) {
    return $_ENV[$key] ?? $default;
}

function config($key, $default = null) {
    static $configs = [];
    
    $parts = explode('.', $key);
    $filename = $parts[0];
    
    if (!isset($configs[$filename])) {
        $path = base_path("config/{$filename}.php");
        if (file_exists($path)) {
            $configs[$filename] = require $path;
        } else {
            return $default;
        }
    }
    
    $current = $configs[$filename];
    for ($i = 1; $i < count($parts); $i++) {
        if (!isset($current[$parts[$i]])) return $default;
        $current = $current[$parts[$i]];
    }
    
    return $current;
}

function base_path($path = '') {
    return __DIR__ . '/../' . ltrim($path, '/');
}

function public_path($path = '') {
    return __DIR__ . '/../public/' . ltrim($path, '/');
}

function storage_path($path = '') {
    return __DIR__ . '/../storage/' . ltrim($path, '/');
}

function e($str) {
    return htmlspecialchars($str ?? '', ENT_QUOTES, 'UTF-8');
}

function csrf_token() {
    return \App\Core\App::getInstance()->make('csrf')->token();
}

function csrf_field() {
    return '<input type="hidden" name="_token" value="' . csrf_token() . '">';
}

function auth() {
    return \App\Core\App::getInstance()->make('auth');
}

function session() {
    return \App\Core\App::getInstance()->make('session');
}

function url($path = '') {
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    // Handle both /public/index.php and root index.php
    $basePath = str_replace(['/public/index.php', '/index.php'], '', $scriptName);
    return '/' . ltrim($basePath, '/') . '/' . ltrim($path, '/');
}

function full_url($path = '') {
    $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    return $protocol . '://' . $host . url($path);
}

function old($key, $default = null) {
    static $oldInput = null;
    if ($oldInput === null) {
        $oldInput = session()->flashGet('old') ?? [];
    }
    return $oldInput[$key] ?? $default;
}

function setting($key, $default = null) {
    return \App\Models\Setting::get($key, $default);
}
