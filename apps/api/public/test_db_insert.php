<?php
require __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;

header('Content-Type: text/plain');

try {
    $db = (new Database())->getConnection();
    echo "Database Connected.\n";

    $db->beginTransaction();
    echo "Transaction Started.\n";

    // 1. Test Order Insert
    echo "Testing Order Insert... ";
    $orderId = insert($db, 'orders', [
        'order_number' => 'TEST-' . time(),
        'total_amount' => 1000,
        'subtotal' => 1000,
        'status' => 'completed',
        // 'user_id' => 1, // Assume ID 1 exists, or skip nullable FKs for now to test table structure
        'notes' => 'Test Transaction',
        'amount_paid' => 1000
    ]);
    echo "OK (ID: $orderId)\n";

    // 2. Test Order Item Insert
    echo "Testing Order Item Insert... ";
    $itemId = insert($db, 'order_items', [
        'order_id' => $orderId,
        'quantity' => 1,
        'unit_price' => 1000,
        'subtotal' => 1000,
        'product_name' => 'Test Product'
    ]);
    echo "OK (ID: $itemId)\n";

    // 3. Test Inventory Log Insert
    echo "Testing Inventory Log Insert... ";
    // Need a product ID. Let's create a dummy product or fail gracefully.
    // We'll skip product_id FK constraint check by passing NULL if allowed, or we must assume usage.
    // But inventory_logs usually requires product_id.
    // Let's just test the COLUMNS existence.
    $logId = insert($db, 'inventory_logs', [
        'type' => 'sale',
        'quantity_change' => -1,
        'quantity_after' => 99,
        'status' => 'completed',
        'notes' => 'Test Log'
    ]);
    echo "OK (ID: $logId)\n";

    $db->rollBack(); // Always rollback test
    echo "\nTEST COMPLETED SUCCESSFULLY (Rolled back to keep clean).";

} catch (Exception $e) {
    echo "\n\nERROR FAILED: " . $e->getMessage();
    if ($db->inTransaction()) {
        $db->rollBack();
    }
}

function insert($db, $table, $data) {
    $columns = implode(', ', array_keys($data));
    $placeholders = ':' . implode(', :', array_keys($data));
    
    $stmt = $db->prepare("INSERT INTO $table ($columns) VALUES ($placeholders)");
    $stmt->execute($data);
    return $db->lastInsertId();
}
