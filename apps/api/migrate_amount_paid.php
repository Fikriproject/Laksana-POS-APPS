<?php
require_once __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;
use App\Config\Database;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

// Get database connection
$database = new Database();
$db = $database->getConnection();

echo "Checking orders table structure...\n";

try {
    // Check if column exists
    $checkStmt = $db->query("SHOW COLUMNS FROM orders LIKE 'amount_paid'");
    $exists = $checkStmt->fetch();

    if ($exists) {
        echo "Column 'amount_paid' already exists.\n";
    } else {
        echo "Adding 'amount_paid' column to orders table...\n";
        
        // Add column
        $sql = "ALTER TABLE orders ADD COLUMN amount_paid DECIMAL(15, 2) NOT NULL DEFAULT 0 AFTER total_amount";
        $db->exec($sql);
        
        echo "Column 'amount_paid' added successfully.\n";
    }

    // Verify
    $checkStmt = $db->query("SHOW COLUMNS FROM orders LIKE 'amount_paid'");
    $exists = $checkStmt->fetch();
    
    if ($exists) {
        echo "Verification: Column 'amount_paid' exists.\n";
    } else {
        echo "Verification FAILED: Column still missing.\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
