<?php

namespace App\Core;

abstract class Controller
{
    protected function view($name, $data = [], $layout = 'public')
    {
        return (new Response())->view($name, $data, $layout);
    }

    protected function json($data, $status = 200)
    {
        return (new Response())->json($data, $status);
    }

    protected function redirect($url)
    {
        return (new Response())->redirect($url);
    }

    protected function back()
    {
        return (new Response())->back();
    }
}
