<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use App\Config\Database;

// Load env
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

$database = new Database();
$db = $database->getConnection();

echo "========================================================\n";
echo "   PEMBERSIH KATEGORI KOSONG (0 PRODUK) - LAKSANA POS   \n";
echo "========================================================\n\n";

try {
    // 1. Cari kategori yang tidak memiliki produk aktif maupun tidak aktif
    $stmt = $db->query("
        SELECT c.id, c.name, c.slug, COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
        GROUP BY c.id, c.name, c.slug
        HAVING product_count = 0
        ORDER BY c.name
    ");
    $emptyCats = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    if (empty($emptyCats)) {
        echo "✓ Tidak ada kategori kosong! Seluruh kategori di database memiliki produk.\n\n";
        exit(0);
    }

    echo "Ditemukan " . count($emptyCats) . " kategori yang TIDAK memiliki produk:\n";
    foreach ($emptyCats as $cat) {
        echo " - [ID: {$cat['id']}] {$cat['name']} (slug: {$cat['slug']})\n";
    }
    echo "\n";

    $ids = array_map(function($c) { return (int)$c['id']; }, $emptyCats);
    $inClause = implode(',', $ids);

    $deleteStmt = $db->prepare("DELETE FROM categories WHERE id IN ($inClause)");
    $deleteStmt->execute();
    $deletedCount = $deleteStmt->rowCount();

    echo "========================================================\n";
    echo "✓ SUKSES: Berhasil menghapus {$deletedCount} kategori kosong dari database!\n";
    echo "========================================================\n\n";
} catch (\Exception $e) {
    echo "✗ GAGAL: Terjadi kesalahan: " . $e->getMessage() . "\n\n";
    exit(1);
}
