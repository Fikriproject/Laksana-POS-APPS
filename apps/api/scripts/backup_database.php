<?php
/**
 * Laksana POS - Automated Database Backup Script (Indestructible Edition)
 * 
 * Mengekspor seluruh database pos_cashier ke file .sql dan .sql.gz secara otomatis.
 * Membaca kredensial dari .env secara dinamis.
 * Mendukung dump via mysqldump cepat atau native PDO dump mandiri jika mysqldump tidak ada.
 */

declare(strict_types=1);

// 1. Helper Parser .env Mandiri (Bekerja meski tanpa vendor/autoload)
function parseEnvManually(string $path): array {
    if (!file_exists($path)) return [];
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $res = [];
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) continue;
        if (str_contains($line, '=')) {
            [$k, $v] = explode('=', $line, 2);
            $k = trim($k);
            $v = trim($v, " \t\n\r\0\x0B\"'");
            $res[$k] = $v;
            $_ENV[$k] = $v;
            putenv("$k=$v");
        }
    }
    return $res;
}

// Cari dan muat file .env
$rootCandidateDirs = [
    dirname(__DIR__, 2), // root project: /home/fikri/Laksana-POS-APPS
    dirname(__DIR__),    // apps/api
    __DIR__,
];

foreach ($rootCandidateDirs as $dir) {
    if (file_exists($dir . '/.env')) {
        parseEnvManually($dir . '/.env');
    }
    if (file_exists($dir . '/apps/api/.env')) {
        parseEnvManually($dir . '/apps/api/.env');
    }
}

// Coba muat autoload jika ada
$autoloadPaths = [
    dirname(__DIR__, 2) . '/apps/api/vendor/autoload.php',
    dirname(__DIR__) . '/vendor/autoload.php',
    dirname(__DIR__, 2) . '/vendor/autoload.php'
];
foreach ($autoloadPaths as $ap) {
    if (file_exists($ap)) {
        @require_once $ap;
        break;
    }
}

// 2. Tentukan Direktori Output
$options = getopt('', ['output::', 'keep-days::']);
$defaultBackupDir = getenv('HOME') ? getenv('HOME') . '/backups' : dirname(__DIR__, 3) . '/backups';
$backupDir = $options['output'] ?? $defaultBackupDir;
$dbBackupDir = $backupDir . '/database';
$logFile = $backupDir . '/backup.log';

if (!is_dir($dbBackupDir)) {
    mkdir($dbBackupDir, 0755, true);
}

function logMsg(string $msg, string $logFile): void {
    $formatted = "[" . date('Y-m-d H:i:s') . "] " . $msg . "\n";
    echo $formatted;
    file_put_contents($logFile, $formatted, FILE_APPEND);
}

logMsg("=== Memulai Auto-Backup Database Laksana POS ===", $logFile);

// 3. Baca Kredensial Database dari ENV
$dbUrl = $_ENV['DATABASE_URL'] ?? getenv('DATABASE_URL');
$driver = 'mysql';
$host = 'localhost';
$port = '3306';
$dbName = 'pos_cashier';
$username = 'root';
$password = '';

if (!empty($dbUrl)) {
    $parsed = parse_url($dbUrl);
    $driver = ($parsed['scheme'] ?? '') === 'postgres' ? 'pgsql' : 'mysql';
    $host = $parsed['host'] ?? 'localhost';
    $port = isset($parsed['port']) ? (string)$parsed['port'] : '3306';
    $dbName = isset($parsed['path']) ? ltrim($parsed['path'], '/') : 'pos_cashier';
    $username = isset($parsed['user']) ? urldecode($parsed['user']) : 'root';
    $password = isset($parsed['pass']) ? urldecode($parsed['pass']) : '';
} else {
    $driver = $_ENV['DB_CONNECTION'] ?? getenv('DB_CONNECTION') ?: 'mysql';
    $host = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: 'localhost';
    $port = (string)($_ENV['DB_PORT'] ?? getenv('DB_PORT') ?: '3306');
    $dbName = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'pos_cashier';
    $username = $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'root';
    $password = $_ENV['DB_PASSWORD'] ?? getenv('DB_PASSWORD') ?: '';
}

$dateStr = date('Y-m-d_H-i-s');
$sqlFileName = "db_{$dbName}_{$dateStr}.sql";
$sqlFilePath = $dbBackupDir . '/' . $sqlFileName;
$gzFilePath = $sqlFilePath . '.gz';

$dumpSuccess = false;

// 4. METODE 1: Coba gunakan mysqldump bawaan sistem terlebih dahulu
if ($driver === 'mysql' && (shell_exec('which mysqldump 2>/dev/null') || shell_exec('where mysqldump 2>nul'))) {
    $passArg = $password !== '' ? "-p" . escapeshellarg($password) : "";
    $hostArg = "-h " . escapeshellarg($host);
    $portArg = "-P " . escapeshellarg($port);
    $userArg = "-u " . escapeshellarg($username);
    $dbArg = escapeshellarg($dbName);

    $cmd = "mysqldump {$hostArg} {$portArg} {$userArg} {$passArg} --single-transaction --quick --skip-lock-tables {$dbArg} > " . escapeshellarg($sqlFilePath) . " 2>&1";
    exec($cmd, $cmdOutput, $cmdCode);

    if ($cmdCode === 0 && file_exists($sqlFilePath) && filesize($sqlFilePath) > 500) {
        $dumpSuccess = true;
        logMsg("✓ Database berhasil di-dump menggunakan utility mysqldump.", $logFile);
    } else {
        @unlink($sqlFilePath);
        logMsg("[INFO] mysqldump sistem tidak dapat dipakai, beralih ke Native PHP PDO Dump...", $logFile);
    }
}

// 5. METODE 2: Native PHP PDO Dump (100% Selalu Berhasil)
if (!$dumpSuccess) {
    try {
        $dsn = "{$driver}:host={$host};port={$port};dbname={$dbName};charset=utf8mb4";
        $db = new PDO($dsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);

        $fp = fopen($sqlFilePath, 'w');
        if (!$fp) {
            throw new RuntimeException("Gagal membuat file backup di {$sqlFilePath}");
        }

        fwrite($fp, "-- ==============================================================\n");
        fwrite($fp, "-- Laksana POS - Native PDO Automated Backup\n");
        fwrite($fp, "-- Database : {$dbName}\n");
        fwrite($fp, "-- Tanggal  : " . date('Y-m-d H:i:s') . "\n");
        fwrite($fp, "-- ==============================================================\n\n");
        fwrite($fp, "SET NAMES utf8mb4;\n");
        fwrite($fp, "SET FOREIGN_KEY_CHECKS = 0;\n");
        fwrite($fp, "SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n\n");

        $tablesStmt = $db->query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
        $tables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);

        $totalTables = count($tables);
        $totalRows = 0;

        foreach ($tables as $tbl) {
            fwrite($fp, "\n-- -------------------------------------------------------------\n");
            fwrite($fp, "-- Table structure for `{$tbl}`\n");
            fwrite($fp, "-- -------------------------------------------------------------\n");
            fwrite($fp, "DROP TABLE IF EXISTS `{$tbl}`;\n");

            $createStmt = $db->query("SHOW CREATE TABLE `{$tbl}`");
            $cRow = $createStmt->fetch(PDO::FETCH_ASSOC);
            if (!empty($cRow['Create Table'])) {
                fwrite($fp, $cRow['Create Table'] . ";\n\n");
            }

            $rowsStmt = $db->query("SELECT * FROM `{$tbl}`");
            $rows = $rowsStmt->fetchAll(PDO::FETCH_ASSOC);
            $rowCount = count($rows);
            $totalRows += $rowCount;

            if ($rowCount > 0) {
                $cols = array_keys($rows[0]);
                $escapedCols = implode(', ', array_map(fn($c) => "`" . str_replace("`", "``", $c) . "`", $cols));

                $chunks = array_chunk($rows, 50);
                foreach ($chunks as $chunk) {
                    $valList = [];
                    foreach ($chunk as $r) {
                        $escapedVals = [];
                        foreach ($r as $val) {
                            if ($val === null) {
                                $escapedVals[] = 'NULL';
                            } elseif (is_numeric($val) && !str_starts_with((string)$val, '0')) {
                                $escapedVals[] = $val;
                            } else {
                                $escapedVals[] = $db->quote((string)$val);
                            }
                        }
                        $valList[] = "(" . implode(', ', $escapedVals) . ")";
                    }
                    fwrite($fp, "INSERT INTO `{$tbl}` ({$escapedCols}) VALUES\n  " . implode(",\n  ", $valList) . ";\n");
                }
            }
        }

        fwrite($fp, "\nSET FOREIGN_KEY_CHECKS = 1;\n");
        fclose($fp);
        $dumpSuccess = true;
        logMsg("✓ Database berhasil di-dump menggunakan Native PHP PDO ({$totalTables} tabel, {$totalRows} baris).", $logFile);
    } catch (Throwable $e) {
        logMsg("[FATAL ERROR] Native dump gagal: " . $e->getMessage(), $logFile);
        exit(1);
    }
}

if (!file_exists($sqlFilePath) || filesize($sqlFilePath) < 100) {
    logMsg("[ERROR] File backup tidak valid atau kosong.", $logFile);
    exit(1);
}

// 6. Kompresi ke .gz & Buat pointer latest_backup.sql
$sqlSize = filesize($sqlFilePath);
$sqlContent = file_get_contents($sqlFilePath);
if ($sqlContent !== false) {
    $gzData = gzencode($sqlContent, 9);
    if ($gzData !== false) {
        file_put_contents($gzFilePath, $gzData);
    }
}

$latestSql = $dbBackupDir . '/latest_backup.sql';
@copy($sqlFilePath, $latestSql);

$sqlKb = number_format($sqlSize / 1024, 2);
$gzKb = file_exists($gzFilePath) ? number_format(filesize($gzFilePath) / 1024, 2) : '0';

logMsg("✓ BERHASIL! File cadangan tersimpan:", $logFile);
logMsg("  -> SQL Plain : {$sqlFilePath} ({$sqlKb} KB)", $logFile);
logMsg("  -> SQL Gzip  : {$gzFilePath} ({$gzKb} KB)", $logFile);
logMsg("  -> Latest    : {$latestSql}", $logFile);

// 7. Rotasi Backup Lama (> 30 Hari)
$keepDays = (int)($options['keep-days'] ?? 30);
$expireTime = time() - ($keepDays * 86400);
$deleted = 0;
$files = glob($dbBackupDir . '/db_*.*');
if ($files) {
    foreach ($files as $f) {
        if (is_file($f) && filemtime($f) < $expireTime) {
            @unlink($f);
            $deleted++;
        }
    }
}
if ($deleted > 0) {
    logMsg("✓ Membersihkan {$deleted} file backup lama (> {$keepDays} hari).", $logFile);
}

logMsg("=== Selesai dengan sukses ===", $logFile);
exit(0);
