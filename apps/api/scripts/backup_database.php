<?php
/**
 * Laksana POS - Automated Database Backup Script
 * 
 * Mengekspor seluruh database pos_cashier ke file .sql dan .sql.gz secara otomatis,
 * aman, dan mandiri (menggunakan koneksi PDO internal dari .env tanpa ketergantungan mysqldump).
 * 
 * Penggunaan:
 *   php apps/api/scripts/backup_database.php
 *   php apps/api/scripts/backup_database.php --output=/path/to/custom/dir
 */

declare(strict_types=1);

// 1. Load Autoload
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
    echo "[" . date('Y-m-d H:i:s') . "] [ERROR] vendor/autoload.php tidak ditemukan.\n";
    exit(1);
}

use Dotenv\Dotenv;
use App\Config\Database;

// 2. Load Environment Variables (.env)
$envDirs = [__DIR__ . '/..', dirname(__DIR__, 2), dirname(__DIR__, 3)];
foreach ($envDirs as $dir) {
    if (file_exists($dir . '/.env')) {
        $dotenv = Dotenv::createImmutable($dir);
        $dotenv->safeLoad();
        break;
    }
}

// 3. Tentukan Folder Tujuan Backup
$options = getopt('', ['output::', 'keep-days::']);
$defaultBackupDir = getenv('HOME') ? getenv('HOME') . '/backups' : dirname(__DIR__, 3) . '/backups';
$backupDir = $options['output'] ?? $defaultBackupDir;
$dbBackupDir = $backupDir . '/database';
$logFile = $backupDir . '/backup.log';

if (!is_dir($dbBackupDir)) {
    mkdir($dbBackupDir, 0755, true);
}

// Logger helper
function logMessage(string $msg, string $logFile): void {
    $formatted = "[" . date('Y-m-d H:i:s') . "] " . $msg . "\n";
    echo $formatted;
    file_put_contents($logFile, $formatted, FILE_APPEND);
}

logMessage("=== Memulai Auto-Backup Database Laksana POS ===", $logFile);

try {
    $dbConfig = new Database();
    $db = $dbConfig->getConnection();
    $dbName = $dbConfig->getDbName();
    $driver = $dbConfig->getDriver();

    $dateStr = date('Y-m-d_H-i-s');
    $sqlFileName = "db_{$dbName}_{$dateStr}.sql";
    $sqlFilePath = $dbBackupDir . '/' . $sqlFileName;
    $gzFilePath = $sqlFilePath . '.gz';

    // Buka file stream untuk menulis SQL
    $fp = fopen($sqlFilePath, 'w');
    if (!$fp) {
        throw new RuntimeException("Gagal membuka file untuk penulisan: {$sqlFilePath}");
    }

    // Header SQL
    fwrite($fp, "-- ==============================================================\n");
    fwrite($fp, "-- Laksana POS - Automated Database Backup\n");
    fwrite($fp, "-- Database  : {$dbName} ({$driver})\n");
    fwrite($fp, "-- Tanggal   : " . date('Y-m-d H:i:s') . "\n");
    fwrite($fp, "-- ==============================================================\n\n");

    if ($driver === 'mysql') {
        fwrite($fp, "SET NAMES utf8mb4;\n");
        fwrite($fp, "SET FOREIGN_KEY_CHECKS = 0;\n");
        fwrite($fp, "SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n\n");

        // Ambil daftar semua tabel
        $tablesStmt = $db->query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
        $tables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);

        $totalTables = count($tables);
        $totalRowsAll = 0;
        logMessage("Terhubung ke database '{$dbName}'. Ditemukan {$totalTables} tabel.", $logFile);

        foreach ($tables as $table) {
            fwrite($fp, "\n-- -------------------------------------------------------------\n");
            fwrite($fp, "-- Struktur & Data Tabel `{$table}`\n");
            fwrite($fp, "-- -------------------------------------------------------------\n");
            fwrite($fp, "DROP TABLE IF EXISTS `{$table}`;\n");

            // Create Table Definition
            $createStmt = $db->query("SHOW CREATE TABLE `{$table}`");
            $createRow = $createStmt->fetch(PDO::FETCH_ASSOC);
            if (isset($createRow['Create Table'])) {
                fwrite($fp, $createRow['Create Table'] . ";\n\n");
            }

            // Export Data
            $dataStmt = $db->query("SELECT * FROM `{$table}`");
            $rows = $dataStmt->fetchAll(PDO::FETCH_ASSOC);
            $rowCount = count($rows);
            $totalRowsAll += $rowCount;

            if ($rowCount > 0) {
                // Tulis insert dalam batch per 50 baris
                $columns = array_keys($rows[0]);
                $escapedColumns = array_map(fn($col) => "`" . str_replace("`", "``", $col) . "`", $columns);
                $columnsSql = implode(', ', $escapedColumns);

                $batchSize = 50;
                $chunks = array_chunk($rows, $batchSize);

                foreach ($chunks as $chunk) {
                    $valueStrings = [];
                    foreach ($chunk as $row) {
                        $escapedValues = [];
                        foreach ($row as $val) {
                            if ($val === null) {
                                $escapedValues[] = 'NULL';
                            } elseif (is_numeric($val) && !str_starts_with((string)$val, '0')) {
                                $escapedValues[] = $val;
                            } else {
                                $escapedValues[] = $db->quote((string)$val);
                            }
                        }
                        $valueStrings[] = "(" . implode(', ', $escapedValues) . ")";
                    }
                    fwrite($fp, "INSERT INTO `{$table}` ({$columnsSql}) VALUES\n  " . implode(",\n  ", $valueStrings) . ";\n");
                }
            }
            fwrite($fp, "\n");
        }

        fwrite($fp, "SET FOREIGN_KEY_CHECKS = 1;\n");
    } else {
        // Fallback untuk PostgreSQL
        fwrite($fp, "-- PostgreSQL Backup Mode\n");
        $tablesStmt = $db->query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
        $tables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);
        foreach ($tables as $table) {
            $dataStmt = $db->query("SELECT * FROM \"{$table}\"");
            $rows = $dataStmt->fetchAll(PDO::FETCH_ASSOC);
            if (!empty($rows)) {
                $cols = array_keys($rows[0]);
                foreach ($rows as $row) {
                    $vals = array_map(fn($v) => $v === null ? 'NULL' : $db->quote((string)$v), array_values($row));
                    fwrite($fp, "INSERT INTO \"{$table}\" (\"" . implode('", "', $cols) . "\") VALUES (" . implode(', ', $vals) . ");\n");
                }
            }
        }
    }

    fclose($fp);

    $sqlSize = filesize($sqlFilePath);
    if ($sqlSize === false || $sqlSize < 100) {
        throw new RuntimeException("File backup terlalu kecil ({$sqlSize} bytes), kemungkinan gagal dump.");
    }

    // Kompresi ke .gz untuk hemat disk
    $sqlContent = file_get_contents($sqlFilePath);
    if ($sqlContent !== false) {
        $gzContent = gzencode($sqlContent, 9);
        if ($gzContent !== false) {
            file_put_contents($gzFilePath, $gzContent);
        }
    }

    // Buat pointer 'latest_backup.sql' agar mudah diambil/restore
    $latestPath = $dbBackupDir . '/latest_backup.sql';
    @copy($sqlFilePath, $latestPath);

    $sqlSizeKb = number_format($sqlSize / 1024, 2);
    $gzSizeKb = file_exists($gzFilePath) ? number_format(filesize($gzFilePath) / 1024, 2) : '0';

    logMessage("✓ BERHASIL! Database telah di-backup:", $logFile);
    logMessage("  - File SQL : {$sqlFilePath} ({$sqlSizeKb} KB)", $logFile);
    logMessage("  - File GZ  : {$gzFilePath} ({$gzSizeKb} KB)", $logFile);
    logMessage("  - Total    : {$totalTables} tabel, {$totalRowsAll} total baris data.", $logFile);

    // 4. Rotasi Backup Lama (> 30 Hari)
    $keepDays = (int)($options['keep-days'] ?? 30);
    $expireTime = time() - ($keepDays * 86400);
    $deletedCount = 0;

    $backupFiles = glob($dbBackupDir . '/db_*.*');
    if ($backupFiles) {
        foreach ($backupFiles as $f) {
            if (is_file($f) && filemtime($f) < $expireTime) {
                @unlink($f);
                $deletedCount++;
            }
        }
    }
    if ($deletedCount > 0) {
        logMessage("✓ Rotasi: Menghapus {$deletedCount} file backup lama (> {$keepDays} hari).", $logFile);
    }

    logMessage("=== Selesai dengan sukses ===", $logFile);
    exit(0);

} catch (Throwable $e) {
    logMessage("[FATAL ERROR] Backup gagal: " . $e->getMessage(), $logFile);
    exit(1);
}
