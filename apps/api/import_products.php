<?php
/**
 * Script Import Produk Terbaru untuk Laksana POS
 * Mendukung MySQL & PostgreSQL (Supabase, Railway, Neon, VPS, cPanel, Localhost)
 *
 * Penggunaan:
 *   php apps/api/import_products.php
 */

declare(strict_types=1);

// Locate autoload
$autoloadPaths = [
    __DIR__ . '/vendor/autoload.php',
    __DIR__ . '/../vendor/autoload.php',
    dirname(__DIR__, 2) . '/vendor/autoload.php'
];

$autoloadFound = false;
foreach ($autoloadPaths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $autoloadFound = true;
        break;
    }
}

if (!$autoloadFound) {
    echo "\033[31m[ERROR] vendor/autoload.php tidak ditemukan. Jalankan 'composer install' terlebih dahulu.\033[0m\n";
    exit(1);
}

use Dotenv\Dotenv;
use App\Config\Database;

// Load environment variables safely
$envDirs = [__DIR__, dirname(__DIR__), dirname(__DIR__, 2)];
foreach ($envDirs as $dir) {
    if (file_exists($dir . '/.env')) {
        $dotenv = Dotenv::createImmutable($dir);
        $dotenv->safeLoad();
        break;
    }
}

class CliColor {
    public static function green(string $text): string { return "\033[32m{$text}\033[0m"; }
    public static function red(string $text): string { return "\033[31m{$text}\033[0m"; }
    public static function yellow(string $text): string { return "\033[33m{$text}\033[0m"; }
    public static function cyan(string $text): string { return "\033[36m{$text}\033[0m"; }
    public static function bold(string $text): string { return "\033[1m{$text}\033[0m"; }
}

echo "\n" . CliColor::cyan(CliColor::bold("========================================================")) . "\n";
echo CliColor::cyan(CliColor::bold("       LAKSANA POS - IMPORT PRODUK TERBARU             ")) . "\n";
echo CliColor::cyan(CliColor::bold("========================================================")) . "\n";

try {
    $dbConfig = new Database();
    $db = $dbConfig->getConnection();
    $driver = $dbConfig->getDriver();
    $dbName = $dbConfig->getDbName();
    $host = $dbConfig->getHost();

    echo " " . CliColor::green("✓") . " Terhubung ke Database: " . CliColor::bold($dbName) . " di " . CliColor::bold($host) . "\n";
    echo " " . CliColor::green("✓") . " Driver Database     : " . CliColor::bold(strtoupper($driver)) . "\n";
    echo "--------------------------------------------------------\n\n";
} catch (\Exception $e) {
    echo " " . CliColor::red("✗") . " Gagal terhubung ke database!\n";
    echo "   Detail: " . $e->getMessage() . "\n\n";
    exit(1);
}

$jsonPath = __DIR__ . '/database/products_data.json';
if (!file_exists($jsonPath)) {
    echo CliColor::red("✗ File data produk tidak ditemukan: {$jsonPath}\n");
    exit(1);
}

$products = json_decode(file_get_contents($jsonPath), true);
if (!is_array($products)) {
    echo CliColor::red("✗ Format data produk tidak valid!\n");
    exit(1);
}

$isPg = ($driver === 'pgsql');
$total = count($products);
echo " Memproses " . CliColor::bold((string)$total) . " produk baru...\n\n";

$inserted = 0;
$updated = 0;

$db->beginTransaction();

try {
    $stmtCheck = $db->prepare("SELECT id FROM products WHERE sku = :sku OR name = :name LIMIT 1");

    $insertSql = "INSERT INTO products (
        id, sku, name, description, price, purchase_price, 
        stock_quantity, low_stock_threshold, category_id, image_url, 
        is_active, created_at, updated_at
    ) VALUES (
        :id, :sku, :name, NULL, :price, 0.00, 
        :stock_quantity, 10, NULL, NULL, 
        :is_active, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )";
    $stmtInsert = $db->prepare($insertSql);

    $updateSql = "UPDATE products SET 
        price = :price, 
        stock_quantity = :stock_quantity,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = :id";
    $stmtUpdate = $db->prepare($updateSql);

    foreach ($products as $p) {
        $stmtCheck->execute([
            'sku' => $p['sku'],
            'name' => $p['name']
        ]);
        $existing = $stmtCheck->fetch(\PDO::FETCH_ASSOC);

        if ($existing) {
            $stmtUpdate->execute([
                'id' => $existing['id'],
                'price' => $p['price'],
                'stock_quantity' => $p['stock_quantity']
            ]);
            $updated++;
        } else {
            $stmtInsert->execute([
                'id' => $p['id'],
                'sku' => $p['sku'],
                'name' => $p['name'],
                'price' => $p['price'],
                'stock_quantity' => $p['stock_quantity'],
                'is_active' => $isPg ? 'true' : 1
            ]);
            $inserted++;
        }
    }

    $db->commit();

    echo " " . CliColor::green("✓") . " Berhasil ditambahkan : " . CliColor::bold((string)$inserted) . " produk baru\n";
    if ($updated > 0) {
        echo " " . CliColor::yellow("•") . " Berhasil diperbarui   : " . CliColor::bold((string)$updated) . " produk yang sudah ada\n";
    }
    echo "\n" . CliColor::green(CliColor::bold("========================================================")) . "\n";
    echo CliColor::green(CliColor::bold("       ✓ PROSES IMPORT PRODUK SELESAI DENGAN SUKSES!    ")) . "\n";
    echo CliColor::green(CliColor::bold("========================================================")) . "\n\n";
} catch (\Exception $e) {
    $db->rollBack();
    echo "\n " . CliColor::red("✗ Gagal melakukan import: ") . $e->getMessage() . "\n\n";
    exit(1);
}
