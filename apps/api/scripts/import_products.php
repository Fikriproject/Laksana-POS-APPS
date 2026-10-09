<?php
/**
 * Laksana POS - Import Products Script
 * Mengimpor file products.sql ke database pos_cashier secara aman
 * 
 * Penggunaan:
 *   php apps/api/scripts/import_products.php
 *   php apps/api/scripts/import_products.php --fresh  (Hapus dan timpa tabel products lama)
 */

declare(strict_types=1);

// Locate autoload
$autoloadPaths = [
    __DIR__ . '/../vendor/autoload.php',
    __DIR__ . '/../../vendor/autoload.php',
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

// Load environment variables
$envDirs = [__DIR__ . '/..', dirname(__DIR__, 2), dirname(__DIR__, 3)];
foreach ($envDirs as $dir) {
    if (file_exists($dir . '/.env')) {
        $dotenv = Dotenv::createImmutable($dir);
        $dotenv->safeLoad();
        break;
    }
}

// Parse args
$options = getopt('f', ['fresh', 'force']);
$isFresh = isset($options['f']) || isset($options['fresh']) || isset($options['force']);

$sqlFile = __DIR__ . '/../database/products.sql';
if (!file_exists($sqlFile)) {
    echo "\033[31m[ERROR] File products.sql tidak ditemukan di: {$sqlFile}\033[0m\n";
    exit(1);
}

try {
    $dbConfig = new Database();
    $db = $dbConfig->getConnection();
    $dbName = $dbConfig->getDbName();
    $driver = $dbConfig->getDriver();

    echo "\n\033[1;36m========================================================\033[0m\n";
    echo "\033[1;36m       LAKSANA POS - IMPORT PRODUK DARI SQL            \033[0m\n";
    echo "\033[1;36m========================================================\033[0m\n";
    echo " Terhubung ke Database : \033[1;32m{$dbName}\033[0m ({$driver})\n";
    echo " Sumber File           : \033[33m{$sqlFile}\033[0m\n";
    echo " Mode                  : " . ($isFresh ? "\033[33mFresh (Timpa tabel lama)\033[0m" : "\033[32mAman (Upsert / Pertahankan tabel)\033[0m") . "\n";
    echo "--------------------------------------------------------\n\n";

    $rawSql = file_get_contents($sqlFile);
    if ($rawSql === false) {
        throw new RuntimeException("Gagal membaca file {$sqlFile}");
    }

    // Matikan Foreign Key Checks
    if ($driver === 'mysql') {
        $db->exec("SET FOREIGN_KEY_CHECKS = 0");
    }

    // Cek apakah tabel products sudah ada
    $tableExists = false;
    if ($driver === 'pgsql') {
        $stmt = $db->query("SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products'");
        $tableExists = (bool) $stmt->fetchColumn();
    } else {
        $stmt = $db->query("SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'products'");
        $tableExists = (bool) $stmt->fetchColumn();
    }

    if ($isFresh || !$tableExists) {
        echo " [•] Menyiapkan struktur tabel `products`...\n";
        if ($isFresh && $tableExists) {
            $db->exec("DROP TABLE IF EXISTS `products`");
            echo "     - Tabel `products` lama berhasil dihapus.\n";
        }

        // Eksekusi raw dump secara langsung dengan mematikan foreign key checks
        // Eksekusi statement demi statement
        $queries = explode(";\n", str_replace("\r\n", "\n", $rawSql));
        $count = 0;
        foreach ($queries as $query) {
            $trimmed = trim($query);
            if (!empty($trimmed)) {
                try {
                    $db->exec($trimmed);
                    $count++;
                } catch (PDOException $ex) {
                    // Abaikan duplicate index jika sudah ada
                    if (str_contains($ex->getMessage(), 'Duplicate key') || str_contains($ex->getMessage(), 'already exists')) {
                        continue;
                    }
                    throw $ex;
                }
            }
        }
    } else {
        echo " [•] Tabel `products` sudah ada, mengekstrak data produk...\n";
        
        // Ekstrak blok INSERT
        if (preg_match('/INSERT INTO\s+[`"]products[`"].*?VALUES\s*(.*?);/si', $rawSql, $matches)) {
            $valuesSql = trim($matches[1]);
            
            // Lakukan INSERT ... ON DUPLICATE KEY UPDATE agar aman dari duplikasi id/sku
            $upsertSql = "INSERT INTO `products` (`id`, `sku`, `name`, `description`, `price`, `purchase_price`, `stock_quantity`, `low_stock_threshold`, `category_id`, `image_url`, `is_active`, `created_at`, `updated_at`)
                          VALUES {$valuesSql}
                          ON DUPLICATE KEY UPDATE
                            sku = VALUES(sku),
                            name = VALUES(name),
                            description = VALUES(description),
                            price = VALUES(price),
                            purchase_price = VALUES(purchase_price),
                            stock_quantity = VALUES(stock_quantity),
                            low_stock_threshold = VALUES(low_stock_threshold),
                            category_id = VALUES(category_id),
                            image_url = VALUES(image_url),
                            is_active = VALUES(is_active),
                            updated_at = VALUES(updated_at)";
            
            $db->exec($upsertSql);
        } else {
            throw new RuntimeException("Tidak dapat menemukan query INSERT INTO products di dalam file SQL.");
        }
    }

    if ($driver === 'mysql') {
        $db->exec("SET FOREIGN_KEY_CHECKS = 1");
    }

    // Hitung total produk saat ini
    $totalProducts = (int) $db->query("SELECT COUNT(*) FROM products")->fetchColumn();

    echo "\n\033[1;32m========================================================\033[0m\n";
    echo "\033[1;32m   ✓ IMPORT PRODUK BERHASIL SELESAI!\033[0m\n";
    echo "\033[1;32m========================================================\033[0m\n";
    echo " Total data produk di database sekarang : \033[1m{$totalProducts} produk\033[0m\n\n";

} catch (\Exception $e) {
    if (isset($db) && $driver === 'mysql') {
        $db->exec("SET FOREIGN_KEY_CHECKS = 1");
    }
    echo "\n\033[31m[ERROR] Gagal mengimpor produk: " . $e->getMessage() . "\033[0m\n\n";
    exit(1);
}
