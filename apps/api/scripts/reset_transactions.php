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

$options = getopt('fy', ['force', 'yes']);
$isForce = isset($options['f']) || isset($options['y']) || isset($options['force']) || isset($options['yes']);

if (!$isForce) {
    echo "⚠️  PERINGATAN: Perintah ini akan MENGHAPUS SELURUH riwayat:\n";
    echo "  - Riwayat Transaksi (Orders & Order Items)\n";
    echo "  - Riwayat Barang Masuk/Keluar (Inventory Logs)\n";
    echo "  - Riwayat Shift Kasir (Shifts)\n";
    echo "  - Riwayat Pengeluaran (Expenses)\n";
    echo "  - Laporan Stok (Stock Reports)\n\n";
    echo "Ketik 'yes' untuk melanjutkan: ";
    $handle = fopen("php://stdin", "r");
    $line = trim((string) fgets($handle));

    if ($line !== 'yes') {
        echo "Dibatalkan.\n";
        exit;
    }
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
            $db->exec("TRUNCATE TABLE $table");
            echo " [✓] Berhasil membersihkan tabel : $table\n";
        } catch (PDOException $e) {
            echo " [•] Lewati tabel $table : " . $e->getMessage() . "\n";
        }
    }

    // Enable FK checks
    $db->exec("SET FOREIGN_KEY_CHECKS = 1");

    // Clean receipts storage directory
    $receiptsDir = __DIR__ . '/../public/storage/receipts';
    if (is_dir($receiptsDir)) {
        $files = glob($receiptsDir . '/*');
        $deletedReceipts = 0;
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
                $deletedReceipts++;
            }
        }
        if ($deletedReceipts > 0) {
            echo " [✓] Berhasil menghapus $deletedReceipts file struk lama di storage.\n";
        }
    }
    
    echo "\n🎉 SELURUH DATA RIWAYAT TRANSAKSI & HISTORY BARANG BERHASIL DIBERSIHKAN (CLEAR FRESH)!\n";
    echo "   Data Master Produk, Kategori, dan Akun Kasir/Admin tetap aman.\n\n";

} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
