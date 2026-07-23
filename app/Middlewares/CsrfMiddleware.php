<?php

namespace App\Middlewares;

use App\Core\App;

class CsrfMiddleware
{
    public function handle($request, $next)
    {
        if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            $csrf = App::getInstance()->make('csrf');
            $token = $request->input('_token') ?: ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? null);
            
            if (!$csrf->verify($token)) {
                return (new \App\Core\Response())->view('errors/419', [], null, 419);
            }
        }

        return $next($request);
    }
}
