<?php

require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

// Load .env
$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

$host = $_ENV['DB_HOST'] ?? 'localhost';
$port = $_ENV['DB_PORT'] ?? '3306';
$dbName = $_ENV['DB_NAME'] ?? 'pos_cashier';
$username = $_ENV['DB_USER'] ?? 'root';
$password = $_ENV['DB_PASSWORD'] ?? '';

echo "Connecting to database: $dbName at $host\n";

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbName;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Connected successfully.\n";
    echo "Clearing transaction data...\n";

    // Disable Foreign Key Checks
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

    // Tables to truncate
    $tables = [
        'order_items',
        'orders',
        'inventory_logs',
        'shifts'
    ];

    foreach ($tables as $table) {
        $pdo->exec("TRUNCATE TABLE `$table`");
        echo " - Truncated `$table`\n";
    }

    // Enable Foreign Key Checks
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

    echo "Transaction data cleared successfully!\n";
    echo "Products, Users, and Categories remain intact.\n";

} catch (PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
    exit(1);
}
