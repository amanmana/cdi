<?php
require_once __DIR__ . '/app/helpers.php';
require_once __DIR__ . '/vendor/autoload.php';

$app = new \App\Core\App();
$db = $app->make('db');
$hash = password_hash('password123', PASSWORD_BCRYPT);

if ($db->query("UPDATE users SET password_hash = ?", [$hash])) {
    echo "Passwords updated successfully to 'password123' for all users.";
} else {
    echo "Failed to update passwords.";
}
unlink(__FILE__);
