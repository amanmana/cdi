<?php
# File: app/Core/Route.php

namespace App\Core;

class Route
{
    public static function get($path, $handler)
    {
        App::getInstance()->make('router')->register('GET', $path, $handler);
    }

    public static function post($path, $handler)
    {
        App::getInstance()->make('router')->register('POST', $path, $handler);
    }

    public static function group($attributes, $callback)
    {
        App::getInstance()->make('router')->groupInstance($attributes, $callback);
    }
}
