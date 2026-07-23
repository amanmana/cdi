<?php

require_once __DIR__ . '/../app/helpers.php';
require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\App;
use App\Core\Router;

$app = new App();

// Register router in container for static access helper
$router = new Router($app->make('request'), $app->make('response'));
$app->bind('router', $router);

$app->run();
