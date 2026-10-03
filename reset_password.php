<?php
/**
 * Script Cepat Reset Password Admin Laksana POS
 * Jalankan via CLI: php reset_password.php
 */

require_once __DIR__ . '/apps/api/vendor/autoload.php';

use Dotenv\Dotenv;
use App\Config\Database;

$dotenv = Dotenv::createImmutable(__DIR__ . '/apps/api');
$dotenv->safeLoad();

$db = (new Database())->getConnection();
$newPassword = 'admin123';
$hash = password_hash($newPassword, PASSWORD_BCRYPT);

echo "====================================================\n";
echo "       RESET PASSWORD AKUN ADMIN LAKSANA POS        \n";
echo "====================================================\n\n";

// Cek apakah user admin ada
$stmt = $db->query("SELECT id, username, email, role FROM users WHERE username = 'admin' OR role = 'admin' LIMIT 1");
$admin = $stmt->fetch();

if ($admin) {
    $updateStmt = $db->prepare("UPDATE users SET password_hash = :hash, is_active = 1 WHERE id = :id");
    $updateStmt->execute([
        'hash' => $hash,
        'id' => $admin['id']
    ]);
    
    echo " [✓] Berhasil mereset password untuk akun: \n";
    echo "     - Username : " . $admin['username'] . "\n";
    echo "     - Role     : " . $admin['role'] . "\n";
    echo "     - Password : " . $newPassword . "\n\n";
} else {
    // Buat akun baru jika belum ada
    $id = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000, mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff));
    $insertStmt = $db->prepare("
        INSERT INTO users (id, username, employee_id, password_hash, full_name, email, role, is_active)
        VALUES (:id, 'admin', 'EMP001', :hash, 'Administrator', 'admin@pos.local', 'admin', 1)
    ");
    $insertStmt->execute([
        'id' => $id,
        'hash' => $hash
    ]);
    
    echo " [✓] Akun Admin baru berhasil dibuat:\n";
    echo "     - Username : admin\n";
    echo "     - Password : " . $newPassword . "\n\n";
}

echo "Daftar seluruh user di database:\n";
$all = $db->query("SELECT id, username, email, role, is_active FROM users")->fetchAll();
foreach ($all as $u) {
    echo " • Username: " . str_pad($u['username'], 12) . " | Role: " . str_pad($u['role'], 10) . " | Active: " . ($u['is_active'] ? 'Ya' : 'Tidak') . "\n";
}

echo "\nSelesai! Silakan gunakan username di atas dengan password: admin123\n";
