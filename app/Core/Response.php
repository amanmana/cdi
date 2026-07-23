<?php

namespace App\Core;

class Response
{
    public function view($viewName, $data = [], $layout = null, $status = 200)
    {
        http_response_code($status);
        echo View::render($viewName, $data, $layout);
        return $this;
    }

    public function json($data, $status = 200)
    {
        header('Content-Type: application/json');
        http_response_code($status);
        echo json_encode($data);
        return $this;
    }

    public function redirect($url)
    {
        if (str_starts_with($url, '/') && !str_starts_with($url, '//')) {
            $url = url($url);
        }
        header("Location: {$url}");
        exit;
    }

    public function back()
    {
        $url = $_SERVER['HTTP_REFERER'] ?? '/';
        $this->redirect($url);
    }
}
