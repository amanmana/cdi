<?php
require_once __DIR__ . '/app/helpers.php';
require_once __DIR__ . '/vendor/autoload.php';

$app = new \App\Core\App();
$db = $app->make('db');

echo "--- Settings Table ---\n";
$settings = $db->fetchAll("SELECT * FROM settings");
print_r($settings);

echo "\n--- Mail Helper Test ---\n";
echo "setting('site_email'): " . setting('site_email', 'noreply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost')) . "\n";
