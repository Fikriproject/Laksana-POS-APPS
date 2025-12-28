<?php
require __DIR__ . '/../vendor/autoload.php';
use App\Config\Database;
use PDO;

header('Content-Type: text/plain');

try {
    $db = (new Database())->getConnection();
    echo "Database Connected.\n\n";
    
    // ---------------------------------------------------------
    // TEST 1: Get Sales By Category
    // ---------------------------------------------------------
    echo "TEST 1: getSalesByCategory\n";
    echo "--------------------------\n";
    $sql1 = "SELECT 
                c.name as category,
                COUNT(DISTINCT o.id) as transactions,
                SUM(oi.quantity) as items_sold,
                COALESCE(SUM(oi.subtotal), 0) as revenue
             FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             JOIN products p ON oi.product_id = p.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE o.status = 'completed'
             GROUP BY c.id, c.name
             ORDER BY revenue DESC
             LIMIT 5";
    
    try {
        $stmt = $db->prepare($sql1);
        $stmt->execute();
        $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "✅ SUCCESS! Found " . count($res) . " rows.\n";
        print_r($res);
    } catch (Exception $e) {
        echo "❌ FAILED: " . $e->getMessage() . "\n";
    }

    echo "\n";
    
    // ---------------------------------------------------------
    // TEST 2: Low Stock (Boolean Check)
    // ---------------------------------------------------------
    echo "TEST 2: getLowStock (Boolean Check)\n";
    echo "----------------------------------\n";
    $sql2 = "SELECT p.*, c.name as category_name 
             FROM products p 
             LEFT JOIN categories c ON p.category_id = c.id 
             WHERE p.stock_quantity <= p.low_stock_threshold AND p.is_active = true
             LIMIT 5";

    try {
        $stmt = $db->prepare($sql2);
        $stmt->execute();
        $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "✅ SUCCESS! Found " . count($res) . " products.\n";
    } catch (Exception $e) {
        echo "❌ FAILED: " . $e->getMessage() . "\n";
    }
    
    echo "\n";

    // ---------------------------------------------------------
    // TEST 3: Postgres Date Function
    // ---------------------------------------------------------
    echo "TEST 3: Date Function\n";
    echo "---------------------\n";
    $sql3 = "SELECT CAST(created_at AS DATE) as date_only FROM orders LIMIT 1";
    
    try {
        $stmt = $db->prepare($sql3);
        $stmt->execute();
        $res = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "✅ SUCCESS! Result: " . print_r($res, true) . "\n";
    } catch (Exception $e) {
        echo "❌ FAILED: " . $e->getMessage() . "\n";
    }

} catch (Exception $e) {
    echo "CRITICAL ERROR: " . $e->getMessage();
}
