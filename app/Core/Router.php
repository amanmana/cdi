<?php

namespace App\Core;

class Router
{
    protected $routes = [];
    protected $request;
    protected $response;
    protected $groupStack = [];

    public function __construct(Request $request, Response $response)
    {
        $this->request = $request;
        $this->response = $response;
    }

    public static function get($path, $handler)
    {
        static::addRoute('GET', $path, $handler);
    }

    public static function post($path, $handler)
    {
        static::addRoute('POST', $path, $handler);
    }

    public static function group($attributes, $callback)
    {
        $instance = App::getInstance()->make('router');
        $instance->groupInstance($attributes, $callback);
    }

    protected static function addRoute($method, $path, $handler)
    {
        // We'll use a singleton-like approach via App container for the router instance during route definition
        $instance = App::getInstance()->make('router');
        $instance->register($method, $path, $handler);
    }

    protected $registeredRoutes = [];

    public function register($method, $path, $handler)
    {
        $prefix = '';
        $middleware = [];

        foreach ($this->groupStack as $group) {
            $prefix .= ($group['prefix'] ?? '');
            if (isset($group['middleware'])) {
                $middleware = array_merge($middleware, (array)$group['middleware']);
            }
        }

        $path = '/' . trim($prefix . $path, '/');
        if ($path === '') $path = '/';

        $this->registeredRoutes[] = [
            'method' => $method,
            'path' => $path,
            'handler' => $handler,
            'middleware' => $middleware
        ];
    }

    public function groupInstance($attributes, $callback)
    {
        $this->groupStack[] = $attributes;
        $callback($this);
        array_pop($this->groupStack);
    }

    public function dispatch()
    {
        $method = $this->request->method();
        $path = $this->request->path();

        foreach ($this->registeredRoutes as $route) {
            if ($route['method'] !== $method) continue;

            $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[^/]+)', $route['path']);
            $pattern = "#^" . $pattern . "$#";

            if (preg_match($pattern, $path, $matches)) {
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                $this->request->setParams($params);

                return $this->runRoute($route);
            }
        }

        return $this->response->view('errors/404', [], 'public', 404);
    }

    protected function runRoute($route)
    {
        $middlewares = $route['middleware'];
        
        $pipeline = function($request) use ($route) {
            list($controllerName, $method) = explode('@', $route['handler']);
            $controllerClass = "App\\Controllers\\" . $controllerName;
            
            if (!class_exists($controllerClass)) {
                throw new \Exception("Controller class {$controllerClass} not found");
            }

            $controller = new $controllerClass();
            if (!method_exists($controller, $method)) {
                throw new \Exception("Method {$method} not found in {$controllerClass}");
            }

            return $controller->$method($this->request, $this->response);
        };

        // Simple middleware execution
        foreach (array_reverse($middlewares) as $middlewareClass) {
            $next = $pipeline;
            $pipeline = function($request) use ($middlewareClass, $next) {
                // Check if it's RoleMiddleware with params
                if (str_contains($middlewareClass, ':')) {
                    list($class, $params) = explode(':', $middlewareClass, 2);
                    $params = explode(',', $params);
                    $middleware = new $class();
                    return $middleware->handle($this->request, $next, ...$params);
                }
                
                $middleware = new $middlewareClass();
                return $middleware->handle($this->request, $next);
            };
        }

        return $pipeline($this->request);
    }
}
