<?php
require_once __DIR__ . '/app/helpers.php';
require_once __DIR__ . '/vendor/autoload.php';

$app = new \App\Core\App();
$db = $app->make('db');

echo "--- Testing User::getByUnitAndRole('Graphic', 'manager') ---\n";
$managers = \App\Models\User::getByUnitAndRole('Graphic', 'manager');
print_r($managers);

echo "\n--- Distinct Units in database ---\n";
$units = $db->fetchAll("SELECT DISTINCT unit FROM users");
print_r($units);

echo "\n--- Latest Job Request ---\n";
$latestJob = $db->fetch("SELECT ticket_no, title, unit, client_name FROM job_requests ORDER BY id DESC LIMIT 1");
print_r($latestJob);
