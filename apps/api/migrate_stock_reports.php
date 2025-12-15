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

echo "Migrating stock_reports table...\n";

$sql = "
CREATE TABLE IF NOT EXISTS stock_reports (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    notes TEXT,
    status ENUM('pending', 'resolved') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
";

try {
    $db->exec($sql);
    echo "Table 'stock_reports' created successfully.\n";
    
    // Add index
    $db->exec("CREATE INDEX idx_stock_reports_status ON stock_reports(status);");
    echo "Index created.\n";

} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
