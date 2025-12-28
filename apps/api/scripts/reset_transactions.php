<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use App\Config\Database;

// Load env
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

// Get database connection
$database = new Database();
$db = $database->getConnection();

echo "⚠️ WARNING: This will delete ALL transaction data (Orders, Expenses, Shifts, Logs)!\n";
echo "Are you sure you want to proceed? (yes/no): ";
$handle = fopen("php://stdin", "r");
$line = trim(fgets($handle));

if ($line !== 'yes') {
    echo "Aborted.\n";
    exit;
}

try {
    // Disable FK checks
    $db->exec("SET FOREIGN_KEY_CHECKS = 0");

    $tables = [
        'order_items', 
        'orders', 
        'inventory_logs', 
        'expenses', 
        'shifts',
        'stock_reports'
    ];

    foreach ($tables as $table) {
        try {
            // Check if table exists first (optional but good practice)
            $db->exec("TRUNCATE TABLE $table");
            echo "✅ Truncated table: $table\n";
        } catch (PDOException $e) {
            echo "⚠️ Could not truncate $table (might not exist): " . $e->getMessage() . "\n";
        }
    }

    // Enable FK checks
    $db->exec("SET FOREIGN_KEY_CHECKS = 1");
    
    echo "\n🎉 Transaction data reset successfully!\n";

} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
