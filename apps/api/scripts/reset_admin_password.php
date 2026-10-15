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

$newPassword = $argv[1] ?? 'admin123';
$hash = password_hash($newPassword, PASSWORD_BCRYPT);

try {
    // Check if admin exists
    $stmt = $db->prepare("SELECT id, username, full_name, role FROM users WHERE username = 'admin' OR role = 'admin' LIMIT 1");
    $stmt->execute();
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($admin) {
        $update = $db->prepare("UPDATE users SET password_hash = :hash, is_active = 1 WHERE id = :id");
        $update->execute([':hash' => $hash, ':id' => $admin['id']]);
        echo "========================================\n";
        echo "✓ Password admin berhasil di-reset!\n";
        echo "  Username : {$admin['username']}\n";
        echo "  Password : {$newPassword}\n";
        echo "========================================\n";
    } else {
        // Create admin if not exists
        $id = 'c2bc802f-508b-4a57-8974-9892c5890001';
        $insert = $db->prepare("INSERT INTO users (id, username, employee_id, password_hash, full_name, email, role, is_active) 
                               VALUES (:id, 'admin', 'EMP001', :hash, 'Administrator', 'admin@pos.local', 'admin', 1)");
        $insert->execute([':id' => $id, ':hash' => $hash]);
        echo "========================================\n";
        echo "✓ User admin baru berhasil dibuat!\n";
        echo "  Username : admin\n";
        echo "  Password : {$newPassword}\n";
        echo "========================================\n";
    }
} catch (PDOException $e) {
    echo "✗ Gagal mereset password: " . $e->getMessage() . "\n";
    exit(1);
}
