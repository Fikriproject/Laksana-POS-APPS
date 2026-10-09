<?php
/**
 * Laksana POS - Database Restore / Importer Tool
 * Mengimpor database lengkap pos_cashier secara aman
 *
 * Penggunaan:
 *   php apps/api/scripts/restore_database.php          -> Restore database bersih (Master data: Kategori asli, 55 Produk asli, Akun, Supplier, 0 transaksi lama)
 *   php apps/api/scripts/restore_database.php --full   -> Restore 100% full dump (Termasuk 24 riwayat transaksi lama)
 */

declare(strict_types=1);

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
    echo "\033[31m[ERROR] vendor/autoload.php tidak ditemukan.\033[0m\n";
    exit(1);
}

use Dotenv\Dotenv;
use App\Config\Database;

$envDirs = [__DIR__ . '/..', dirname(__DIR__, 2), dirname(__DIR__, 3)];
foreach ($envDirs as $dir) {
    if (file_exists($dir . '/.env')) {
        $dotenv = Dotenv::createImmutable($dir);
        $dotenv->safeLoad();
        break;
    }
}

$options = getopt('f', ['full']);
$isFull = isset($options['f']) || isset($options['full']);

$targetFile = $isFull 
    ? __DIR__ . '/../database/pos_cashier.sql' 
    : __DIR__ . '/../database/pos_cashier_clean.sql';

if (!file_exists($targetFile)) {
    echo "\033[31m[ERROR] File SQL tidak ditemukan di: {$targetFile}\033[0m\n";
    exit(1);
}

try {
    $dbConfig = new Database();
    $db = $dbConfig->getConnection();
    $dbName = $dbConfig->getDbName();
    $driver = $dbConfig->getDriver();

    echo "\n\033[1;36m========================================================\033[0m\n";
    echo "\033[1;36m       LAKSANA POS - DATABASE RESTORE & SEED           \033[0m\n";
    echo "\033[1;36m========================================================\033[0m\n";
    echo " Target Database : \033[1;32m{$dbName}\033[0m ({$driver})\n";
    echo " File SQL        : \033[33m" . basename($targetFile) . "\033[0m\n";
    echo " Mode            : " . ($isFull ? "\033[33mFull Dump (Dengan Transaksi Lama)\033[0m" : "\033[32mClean Master (Kategori Asli + 55 Produk + 0 Transaksi)\033[0m") . "\n";
    echo "--------------------------------------------------------\n\n";

    $sqlContent = file_get_contents($targetFile);
    if ($sqlContent === false) {
        throw new RuntimeException("Gagal membaca file {$targetFile}");
    }

    if ($driver === 'mysql') {
        $db->exec("SET FOREIGN_KEY_CHECKS = 0;");
    }

    // Split SQL into individual statements
    // Handle standard semicolon delimiter
    $queries = explode(";\n", str_replace("\r\n", "\n", $sqlContent));
    $executed = 0;

    foreach ($queries as $query) {
        $trimmed = trim($query);
        if (!empty($trimmed)) {
            try {
                $db->exec($trimmed);
                $executed++;
            } catch (PDOException $ex) {
                // Ignore harmless index duplicates
                if (str_contains($ex->getMessage(), 'Duplicate key') || str_contains($ex->getMessage(), 'already exists')) {
                    continue;
                }
                throw $ex;
            }
        }
    }

    if ($driver === 'mysql') {
        $db->exec("SET FOREIGN_KEY_CHECKS = 1;");
    }

    // Status Summary
    $prodCount = (int) $db->query("SELECT COUNT(*) FROM products")->fetchColumn();
    $catCount = (int) $db->query("SELECT COUNT(*) FROM categories")->fetchColumn();
    $orderCount = (int) $db->query("SELECT COUNT(*) FROM orders")->fetchColumn();

    echo "\033[1;32m========================================================\033[0m\n";
    echo "\033[1;32m   ✓ DATABASE BERHASIL DI-RESTORE SEMPURNA!            \033[0m\n";
    echo "\033[1;32m========================================================\033[0m\n";
    echo " • Total Kategori  : \033[1m{$catCount}\033[0m (Peci, Jam, Kertas, ATK, Kalkulator, Jasa, Figura)\n";
    echo " • Total Produk    : \033[1m{$prodCount}\033[0m produk\n";
    echo " • Total Transaksi : \033[1m{$orderCount}\033[0m riwayat transaksi\n\n";

} catch (\Exception $e) {
    if (isset($db) && $driver === 'mysql') {
        $db->exec("SET FOREIGN_KEY_CHECKS = 1;");
    }
    echo "\n\033[31m[ERROR] Gagal merestore database: " . $e->getMessage() . "\033[0m\n\n";
    exit(1);
}
