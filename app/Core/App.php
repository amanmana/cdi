<?php

namespace App\Core;

class App
{
    protected static $instance;
    protected $container = [];

    public function __construct()
    {
        static::$instance = $this;
        $this->bootstrap();
    }

    public static function getInstance()
    {
        return static::$instance;
    }

    protected function bootstrap()
    {
        $this->loadDotEnv();
        date_default_timezone_set(config('app.timezone', 'UTC'));
        
        if (!file_exists(storage_path('logs'))) {
            mkdir(storage_path('logs'), 0777, true);
        }

        $this->container['session'] = new Session();
        $this->container['session']->start();
        
        $this->container['request'] = new Request();
        $this->container['response'] = new Response();
        $this->container['db'] = new DB();
        $this->container['auth'] = new Auth($this->container['db'], $this->container['session']);
        $this->container['csrf'] = new Csrf($this->container['session']);
    }

    protected function loadDotEnv()
    {
        $path = base_path('.env');
        if (file_exists($path)) {
            $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (str_contains($line, '=')) {
                    list($name, $value) = explode('=', $line, 2);
                    $name = trim($name);
                    $value = trim($value, " \t\n\r\0\x0B\"");
                    if (!array_key_exists($name, $_ENV)) {
                        putenv("{$name}={$value}");
                        $_ENV[$name] = $value;
                    }
                }
            }
        }
    }

    public function run()
    {
        try {
            $router = $this->make('router');
            if (!$router) {
                $router = new Router($this->container['request'], $this->container['response']);
                $this->bind('router', $router);
            }
            require_once base_path('routes/web.php');
            $router->dispatch();
        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }

    protected function handleException(\Exception $e)
    {
        Logger::error($e->getMessage() . "\n" . $e->getTraceAsString());
        
        if (config('app.debug')) {
            echo "<h1>Exception</h1>";
            echo "<p>{$e->getMessage()}</p>";
            echo "<pre>{$e->getTraceAsString()}</pre>";
        } else {
            (new Response())->view('errors/500', [], 'public', 500);
        }
    }

    public function make($key)
    {
        return $this->container[$key] ?? null;
    }

    public function bind($key, $value)
    {
        $this->container[$key] = $value;
    }
}
