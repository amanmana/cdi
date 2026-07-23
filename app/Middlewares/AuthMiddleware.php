<?php

namespace App\Middlewares;

use App\Core\App;

class AuthMiddleware
{
    public function handle($request, $next)
    {
        $auth = App::getInstance()->make('auth');
        
        if (!$auth->check()) {
            return (new \App\Core\Response())->redirect('/login');
        }

        return $next($request);
    }
}
