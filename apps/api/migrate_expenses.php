<?php
require_once __DIR__ . '/src/Config/Database.php';

use App\Config\Database;

// Load environment variables if not already loaded (assuming this runs in a context where they might not be)
// For simplicity in this dev environment, we assume the Database class handles env vars or defaults, 
// OR we rely on the fact that we're running this in the same env.
// If needed we can manually set them or include composer autoload.

require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$db = new Database();
$conn = $db->getConnection();

try {
    $sql = "
    CREATE TABLE IF NOT EXISTS expenses (
        id CHAR(36) PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        category ENUM('Tanah sewa', 'Arisan', 'Belanja', 'Tamu', 'Infaq', 'Lainnya') NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    ";
    
    $conn->exec($sql);
    echo "Expenses table created successfully.\n";
    
    $sqlIndex1 = "CREATE INDEX idx_expenses_date ON expenses(created_at);";
    $sqlIndex2 = "CREATE INDEX idx_expenses_category ON expenses(category);";
    
    // Attempt indices separately as they might exist
    try { $conn->exec($sqlIndex1); echo "Index date created.\n"; } catch (Exception $e) { echo "Index date might exist.\n"; }
    try { $conn->exec($sqlIndex2); echo "Index category created.\n"; } catch (Exception $e) { echo "Index category might exist.\n"; }

} catch (PDOException $e) {
    echo "Error creating table: " . $e->getMessage() . "\n";
}
