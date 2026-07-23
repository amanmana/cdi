<?php

namespace App\Middlewares;

use App\Core\App;

class RoleMiddleware
{
    public function handle($request, $next, ...$roles)
    {
        $auth = App::getInstance()->make('auth');
        
        if (!$auth->check() || !$auth->hasRole($roles)) {
            return (new \App\Core\Response())->view('errors/403', [], null, 403);
        }

        return $next($request);
    }
}
