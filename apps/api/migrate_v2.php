<?php
require_once __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;
use App\Config\Database;

// Load env
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

$db = (new Database())->getConnection();

echo "Migrating database...\n";

try {
    // Add purchase_price to products
    $check = $db->query("SHOW COLUMNS FROM products LIKE 'purchase_price'");
    if ($check->rowCount() == 0) {
        $db->exec("ALTER TABLE products ADD COLUMN purchase_price DECIMAL(10, 2) DEFAULT 0 AFTER price");
        echo "Added purchase_price to products.\n";
    } else {
        echo "Column purchase_price already exists in products.\n";
    }

    // Add purchase_price to order_items
    $check = $db->query("SHOW COLUMNS FROM order_items LIKE 'purchase_price'");
    if ($check->rowCount() == 0) {
        $db->exec("ALTER TABLE order_items ADD COLUMN purchase_price DECIMAL(10, 2) DEFAULT 0 AFTER unit_price");
        echo "Added purchase_price to order_items.\n";
    } else {
        echo "Column purchase_price already exists in order_items.\n";
    }

    echo "Migration completed successfully.\n";

} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
