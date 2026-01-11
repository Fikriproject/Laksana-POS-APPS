<?php
require_once __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;
use App\Config\Database;

// Load env
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

$db = (new Database())->getConnection();

echo "Migrating price levels...\n";

try {
    // Add price_grosir to products
    $check = $db->query("SHOW COLUMNS FROM products LIKE 'price_grosir'");
    if ($check->rowCount() == 0) {
        // Default to same as price (retail) initially
        $db->exec("ALTER TABLE products ADD COLUMN price_grosir DECIMAL(10, 2) DEFAULT 0 AFTER price");
        // Initialize with default price
        $db->exec("UPDATE products SET price_grosir = price");
        echo "Added price_grosir to products.\n";
    } else {
        echo "Column price_grosir already exists in products.\n";
    }

    // Add price_reseller to products
    $check = $db->query("SHOW COLUMNS FROM products LIKE 'price_reseller'");
    if ($check->rowCount() == 0) {
        $db->exec("ALTER TABLE products ADD COLUMN price_reseller DECIMAL(10, 2) DEFAULT 0 AFTER price_grosir");
        // Initialize with default price
        $db->exec("UPDATE products SET price_reseller = price");
        echo "Added price_reseller to products.\n";
    } else {
        echo "Column price_reseller already exists in products.\n";
    }

    echo "Migration completed successfully.\n";

} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
