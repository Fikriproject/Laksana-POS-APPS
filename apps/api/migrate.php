<?php
/**
 * Master Database Migration Script for Laksana POS
 * Supports both MySQL and PostgreSQL (Supabase, Railway, Neon, VPS, cPanel, Localhost)
 *
 * Usage:
 *   php migrate.php           -> Run all migrations safely (create missing tables & columns)
 *   php migrate.php --seed    -> Migrate and seed sample data
 *   php migrate.php --fresh   -> Drop all tables and re-migrate (requires confirmation or --force)
 *   php migrate.php --status  -> Show database connection and table status
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

// Load environment variables safely from multiple possible locations
$envDirs = [__DIR__, dirname(__DIR__), dirname(__DIR__, 2)];
foreach ($envDirs as $dir) {
    if (file_exists($dir . '/.env')) {
        $dotenv = Dotenv::createImmutable($dir);
        $dotenv->safeLoad();
        break;
    }
}

// Colors for terminal output
class CliColor {
    public static function green(string $text): string { return "\033[32m{$text}\033[0m"; }
    public static function red(string $text): string { return "\033[31m{$text}\033[0m"; }
    public static function yellow(string $text): string { return "\033[33m{$text}\033[0m"; }
    public static function cyan(string $text): string { return "\033[36m{$text}\033[0m"; }
    public static function bold(string $text): string { return "\033[1m{$text}\033[0m"; }
}

// Parse arguments
$options = getopt('hfs', ['help', 'fresh', 'force', 'seed', 'status']);
$isHelp = isset($options['h']) || isset($options['help']);
$isFresh = isset($options['f']) || isset($options['fresh']);
$isForce = isset($options['force']);
$isSeed = isset($options['s']) || isset($options['seed']);
$isStatus = isset($options['status']);

if ($isHelp) {
    echo "\n" . CliColor::bold("LAKSANA POS - DATABASE MIGRATION TOOL") . "\n";
    echo "========================================================\n";
    echo "Perintah untuk migrasi database satu langkah:\n\n";
    echo "  php migrate.php           Migrasi aman (buat tabel & kolom baru tanpa hapus data)\n";
    echo "  php migrate.php --seed    Migrasi lengkap dan isi data sampel\n";
    echo "  php migrate.php --fresh   Reset total: hapus semua tabel dan migrasi ulang\n";
    echo "  php migrate.php --status  Cek status koneksi dan daftar tabel\n";
    echo "  php migrate.php --help    Tampilkan bantuan ini\n\n";
    exit(0);
}

echo "\n" . CliColor::cyan(CliColor::bold("========================================================")) . "\n";
echo CliColor::cyan(CliColor::bold("        LAKSANA POS - FULL DATABASE MIGRATION          ")) . "\n";
echo CliColor::cyan(CliColor::bold("========================================================")) . "\n";

// 1. Establish Database Connection
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
    echo "   Pastikan file .env sudah berisi kredensial yang benar:\n";
    echo "   - DB_CONNECTION=mysql (atau pgsql)\n";
    echo "   - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD\n";
    echo "   - atau DATABASE_URL=postgresql://user:pass@host:port/dbname\n\n";
    exit(1);
}

// Helper functions for checking tables and columns
function tableExists(PDO $db, string $driver, string $tableName): bool {
    if ($driver === 'pgsql') {
        $stmt = $db->prepare("SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = :name");
    } else {
        $stmt = $db->prepare("SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = :name");
    }
    $stmt->execute(['name' => $tableName]);
    return (bool) $stmt->fetchColumn();
}

function columnExists(PDO $db, string $driver, string $tableName, string $columnName): bool {
    if ($driver === 'pgsql') {
        $stmt = $db->prepare("SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = :tbl AND column_name = :col");
    } else {
        $stmt = $db->prepare("SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :tbl AND column_name = :col");
    }
    $stmt->execute(['tbl' => $tableName, 'col' => $columnName]);
    return (bool) $stmt->fetchColumn();
}

function indexExists(PDO $db, string $driver, string $tableName, string $indexName): bool {
    if ($driver === 'pgsql') {
        $stmt = $db->prepare("SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = :tbl AND indexname = :idx");
        $stmt->execute(['tbl' => $tableName, 'idx' => $indexName]);
        return (bool) $stmt->fetchColumn();
    } else {
        $stmt = $db->prepare("SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = :tbl AND index_name = :idx");
        $stmt->execute(['tbl' => $tableName, 'idx' => $indexName]);
        return (bool) $stmt->fetchColumn();
    }
}

// 2. Status Mode
$tableNames = [
    'users', 'categories', 'products', 'customers', 'suppliers',
    'shifts', 'orders', 'order_items', 'inventory_logs', 'expenses', 'stock_reports'
];

if ($isStatus) {
    echo CliColor::bold("STATUS TABEL DATABASE:") . "\n";
    foreach ($tableNames as $tbl) {
        $exists = tableExists($db, $driver, $tbl);
        if ($exists) {
            $count = $db->query("SELECT COUNT(*) FROM {$tbl}")->fetchColumn();
            echo " - " . str_pad($tbl, 18) . ": " . CliColor::green("ADA") . " ({$count} baris data)\n";
        } else {
            echo " - " . str_pad($tbl, 18) . ": " . CliColor::yellow("BELUM ADA") . "\n";
        }
    }
    echo "\n";
    exit(0);
}

// 3. Fresh Migration (Drop all tables)
if ($isFresh) {
    if (!$isForce) {
        echo CliColor::yellow("PERINGATAN: Perintah --fresh akan MENGHAPUS SEMUA DATA tabel POS!\n");
        echo "Ketik 'yes' untuk melanjutkan: ";
        $confirm = trim((string) fgets(STDIN));
        if (strtolower($confirm) !== 'yes') {
            echo "Dibatalkan.\n";
            exit(0);
        }
    }

    echo CliColor::yellow("Membersihkan tabel yang ada...") . "\n";
    $reverseTables = array_reverse($tableNames);

    if ($driver === 'pgsql') {
        foreach ($reverseTables as $tbl) {
            $db->exec("DROP TABLE IF EXISTS {$tbl} CASCADE");
            echo " - Dropped table: {$tbl}\n";
        }
    } else {
        $db->exec("SET FOREIGN_KEY_CHECKS = 0");
        foreach ($reverseTables as $tbl) {
            $db->exec("DROP TABLE IF EXISTS {$tbl}");
            echo " - Dropped table: {$tbl}\n";
        }
        $db->exec("SET FOREIGN_KEY_CHECKS = 1");
    }
    echo CliColor::green("✓ Semua tabel berhasil dibersihkan.") . "\n\n";
}

// 4. Table Definitions
$isPg = ($driver === 'pgsql');

$tableDefinitions = [
    'users' => $isPg ? "
        CREATE TABLE IF NOT EXISTS users (
            id CHAR(36) PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            employee_id VARCHAR(20) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            pin_code VARCHAR(10),
            full_name VARCHAR(100) NOT NULL,
            email VARCHAR(100),
            role VARCHAR(20) NOT NULL DEFAULT 'cashier',
            avatar_url VARCHAR(500),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    " : "
        CREATE TABLE IF NOT EXISTS users (
            id CHAR(36) PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            employee_id VARCHAR(20) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            pin_code VARCHAR(10),
            full_name VARCHAR(100) NOT NULL,
            email VARCHAR(100),
            role ENUM('admin', 'cashier', 'manager') NOT NULL DEFAULT 'cashier',
            avatar_url VARCHAR(500),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ",

    'categories' => $isPg ? "
        CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL,
            icon VARCHAR(50),
            slug VARCHAR(50) UNIQUE NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    " : "
        CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL,
            icon VARCHAR(50),
            slug VARCHAR(50) UNIQUE NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ",

    'products' => $isPg ? "
        CREATE TABLE IF NOT EXISTS products (
            id CHAR(36) PRIMARY KEY,
            sku VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            price DECIMAL(15, 2) NOT NULL DEFAULT 0,
            purchase_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
            stock_quantity INTEGER NOT NULL DEFAULT 0,
            low_stock_threshold INTEGER NOT NULL DEFAULT 10,
            category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
            image_url VARCHAR(500),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    " : "
        CREATE TABLE IF NOT EXISTS products (
            id CHAR(36) PRIMARY KEY,
            sku VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            price DECIMAL(15, 2) NOT NULL DEFAULT 0,
            purchase_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
            stock_quantity INTEGER NOT NULL DEFAULT 0,
            low_stock_threshold INTEGER NOT NULL DEFAULT 10,
            category_id INT,
            image_url VARCHAR(500),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ",

    'customers' => $isPg ? "
        CREATE TABLE IF NOT EXISTS customers (
            id CHAR(36) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            phone VARCHAR(20),
            email VARCHAR(100),
            loyalty_points INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    " : "
        CREATE TABLE IF NOT EXISTS customers (
            id CHAR(36) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            phone VARCHAR(20),
            email VARCHAR(100),
            loyalty_points INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ",

    'suppliers' => $isPg ? "
        CREATE TABLE IF NOT EXISTS suppliers (
            id CHAR(36) PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            contact_person VARCHAR(100),
            phone VARCHAR(20),
            email VARCHAR(100),
            address TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    " : "
        CREATE TABLE IF NOT EXISTS suppliers (
            id CHAR(36) PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            contact_person VARCHAR(100),
            phone VARCHAR(20),
            email VARCHAR(100),
            address TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ",

    'shifts' => $isPg ? "
        CREATE TABLE IF NOT EXISTS shifts (
            id CHAR(36) PRIMARY KEY,
            user_id CHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ended_at TIMESTAMP NULL,
            opening_cash DECIMAL(15, 2) DEFAULT 0,
            closing_cash DECIMAL(15, 2),
            status VARCHAR(20) DEFAULT 'open'
        );
    " : "
        CREATE TABLE IF NOT EXISTS shifts (
            id CHAR(36) PRIMARY KEY,
            user_id CHAR(36) NOT NULL,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ended_at TIMESTAMP NULL,
            opening_cash DECIMAL(15, 2) DEFAULT 0,
            closing_cash DECIMAL(15, 2),
            status ENUM('open', 'closed') DEFAULT 'open',
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ",

    'orders' => $isPg ? "
        CREATE TABLE IF NOT EXISTS orders (
            id CHAR(36) PRIMARY KEY,
            order_number VARCHAR(50) UNIQUE NOT NULL,
            user_id CHAR(36) NOT NULL REFERENCES users(id),
            customer_id CHAR(36) REFERENCES customers(id) ON DELETE SET NULL,
            shift_id CHAR(36) REFERENCES shifts(id) ON DELETE SET NULL,
            subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
            tax_amount DECIMAL(15, 2) DEFAULT 0,
            discount_amount DECIMAL(15, 2) DEFAULT 0,
            total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
            amount_paid DECIMAL(15, 2) NOT NULL DEFAULT 0,
            payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
            status VARCHAR(20) DEFAULT 'completed',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    " : "
        CREATE TABLE IF NOT EXISTS orders (
            id CHAR(36) PRIMARY KEY,
            order_number VARCHAR(50) UNIQUE NOT NULL,
            user_id CHAR(36) NOT NULL,
            customer_id CHAR(36),
            shift_id CHAR(36),
            subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
            tax_amount DECIMAL(15, 2) DEFAULT 0,
            discount_amount DECIMAL(15, 2) DEFAULT 0,
            total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
            amount_paid DECIMAL(15, 2) NOT NULL DEFAULT 0,
            payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
            status VARCHAR(20) DEFAULT 'completed',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
            FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ",

    'order_items' => $isPg ? "
        CREATE TABLE IF NOT EXISTS order_items (
            id CHAR(36) PRIMARY KEY,
            order_id CHAR(36) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            product_id CHAR(36) NOT NULL REFERENCES products(id),
            product_name VARCHAR(100) NOT NULL,
            unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
            purchase_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
            quantity INTEGER NOT NULL DEFAULT 1,
            subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0
        );
    " : "
        CREATE TABLE IF NOT EXISTS order_items (
            id CHAR(36) PRIMARY KEY,
            order_id CHAR(36) NOT NULL,
            product_id CHAR(36) NOT NULL,
            product_name VARCHAR(100) NOT NULL,
            unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
            purchase_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
            quantity INTEGER NOT NULL DEFAULT 1,
            subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ",

    'inventory_logs' => $isPg ? "
        CREATE TABLE IF NOT EXISTS inventory_logs (
            id CHAR(36) PRIMARY KEY,
            product_id CHAR(36) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            user_id CHAR(36) NOT NULL REFERENCES users(id),
            supplier_id CHAR(36) REFERENCES suppliers(id) ON DELETE SET NULL,
            type VARCHAR(50) NOT NULL,
            quantity_change INTEGER NOT NULL,
            quantity_after INTEGER NOT NULL,
            reference_number VARCHAR(50),
            notes TEXT,
            status VARCHAR(20) DEFAULT 'completed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    " : "
        CREATE TABLE IF NOT EXISTS inventory_logs (
            id CHAR(36) PRIMARY KEY,
            product_id CHAR(36) NOT NULL,
            user_id CHAR(36) NOT NULL,
            supplier_id CHAR(36),
            type VARCHAR(50) NOT NULL,
            quantity_change INTEGER NOT NULL,
            quantity_after INTEGER NOT NULL,
            reference_number VARCHAR(50),
            notes TEXT,
            status VARCHAR(20) DEFAULT 'completed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ",

    'expenses' => $isPg ? "
        CREATE TABLE IF NOT EXISTS expenses (
            id SERIAL PRIMARY KEY,
            user_id CHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255),
            category VARCHAR(50) NOT NULL,
            amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
            description TEXT,
            date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    " : "
        CREATE TABLE IF NOT EXISTS expenses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id CHAR(36) NOT NULL,
            title VARCHAR(255),
            category VARCHAR(50) NOT NULL,
            amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
            description TEXT,
            date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ",

    'stock_reports' => $isPg ? "
        CREATE TABLE IF NOT EXISTS stock_reports (
            id CHAR(36) PRIMARY KEY,
            product_id CHAR(36) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            user_id CHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            notes TEXT,
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    " : "
        CREATE TABLE IF NOT EXISTS stock_reports (
            id CHAR(36) PRIMARY KEY,
            product_id CHAR(36) NOT NULL,
            user_id CHAR(36) NOT NULL,
            notes TEXT,
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    "
];

// 5. Execute Table Creation
echo CliColor::bold("LANGKAH 1: MEMERIKSA & MEMBUAT TABEL") . "\n";
foreach ($tableDefinitions as $tableName => $sql) {
    $existsBefore = tableExists($db, $driver, $tableName);
    $db->exec($sql);
    if (!$existsBefore) {
        echo " [✓] Tabel " . CliColor::green(str_pad($tableName, 16)) . " : " . CliColor::green("BERHASIL DIBUAT") . "\n";
    } else {
        echo " [•] Tabel " . str_pad($tableName, 16) . " : " . CliColor::cyan("SUDAH ADA") . "\n";
    }
}
echo "\n";

// 6. Ensure Missing Columns on Existing Tables
echo CliColor::bold("LANGKAH 2: MEMERIKSA & MENYESUAIKAN KOLOM TABEL") . "\n";

$columnPatches = [
    [
        'table' => 'products',
        'column' => 'purchase_price',
        'type' => 'DECIMAL(15, 2) NOT NULL DEFAULT 0',
        'after' => 'price'
    ],
    [
        'table' => 'order_items',
        'column' => 'purchase_price',
        'type' => 'DECIMAL(15, 2) NOT NULL DEFAULT 0',
        'after' => 'unit_price'
    ],
    [
        'table' => 'orders',
        'column' => 'amount_paid',
        'type' => 'DECIMAL(15, 2) NOT NULL DEFAULT 0',
        'after' => 'total_amount'
    ],
    [
        'table' => 'expenses',
        'column' => 'title',
        'type' => 'VARCHAR(255)',
        'after' => 'user_id'
    ],
    [
        'table' => 'expenses',
        'column' => 'date',
        'type' => 'DATE',
        'after' => 'description'
    ],
    [
        'table' => 'users',
        'column' => 'pin_code',
        'type' => 'VARCHAR(10)',
        'after' => 'password_hash'
    ],
    [
        'table' => 'users',
        'column' => 'avatar_url',
        'type' => 'VARCHAR(500)',
        'after' => 'role'
    ]
];

foreach ($columnPatches as $patch) {
    $tbl = $patch['table'];
    $col = $patch['column'];
    $type = $patch['type'];
    $after = $patch['after'] ?? null;

    if (!tableExists($db, $driver, $tbl)) {
        continue;
    }

    if (!columnExists($db, $driver, $tbl, $col)) {
        if ($isPg) {
            $alterSql = "ALTER TABLE {$tbl} ADD COLUMN {$col} {$type}";
        } else {
            $afterClause = $after ? " AFTER {$after}" : "";
            $alterSql = "ALTER TABLE {$tbl} ADD COLUMN {$col} {$type}{$afterClause}";
        }
        $db->exec($alterSql);
        echo " [✓] Tambah kolom {$tbl}.{$col} : " . CliColor::green("BERHASIL DITAMBAHKAN") . "\n";
    } else {
        echo " [•] Kolom {$tbl}.{$col} : " . CliColor::cyan("OK (Sudah ada)") . "\n";
    }
}
echo "\n";

// 7. Ensure Indexes Exist
echo CliColor::bold("LANGKAH 3: MEMERIKSA & MEMBUAT INDEKS") . "\n";

$indexes = [
    ['table' => 'products', 'name' => 'idx_products_category', 'column' => 'category_id'],
    ['table' => 'products', 'name' => 'idx_products_sku', 'column' => 'sku'],
    ['table' => 'products', 'name' => 'idx_products_active', 'column' => 'is_active'],
    ['table' => 'orders', 'name' => 'idx_orders_user', 'column' => 'user_id'],
    ['table' => 'orders', 'name' => 'idx_orders_date', 'column' => 'created_at'],
    ['table' => 'orders', 'name' => 'idx_orders_status', 'column' => 'status'],
    ['table' => 'orders', 'name' => 'idx_orders_shift', 'column' => 'shift_id'],
    ['table' => 'order_items', 'name' => 'idx_order_items_order', 'column' => 'order_id'],
    ['table' => 'order_items', 'name' => 'idx_order_items_product', 'column' => 'product_id'],
    ['table' => 'inventory_logs', 'name' => 'idx_inventory_logs_product', 'column' => 'product_id'],
    ['table' => 'inventory_logs', 'name' => 'idx_inventory_logs_date', 'column' => 'created_at'],
    ['table' => 'inventory_logs', 'name' => 'idx_inventory_logs_type', 'column' => 'type'],
    ['table' => 'shifts', 'name' => 'idx_shifts_user', 'column' => 'user_id'],
    ['table' => 'shifts', 'name' => 'idx_shifts_status', 'column' => 'status'],
    ['table' => 'expenses', 'name' => 'idx_expenses_date', 'column' => 'created_at'],
    ['table' => 'expenses', 'name' => 'idx_expenses_category', 'column' => 'category'],
    ['table' => 'stock_reports', 'name' => 'idx_stock_reports_status', 'column' => 'status']
];

foreach ($indexes as $idx) {
    $tbl = $idx['table'];
    $idxName = $idx['name'];
    $col = $idx['column'];

    if (!tableExists($db, $driver, $tbl)) {
        continue;
    }

    if (!indexExists($db, $driver, $tbl, $idxName)) {
        try {
            $db->exec("CREATE INDEX {$idxName} ON {$tbl}({$col})");
            echo " [✓] Buat index {$idxName} : " . CliColor::green("OK") . "\n";
        } catch (\Exception $e) {
            // Index might already exist with another internal name
            echo " [•] Index {$idxName} : " . CliColor::yellow("Dilewati / Sudah ada") . "\n";
        }
    }
}
echo "\n";

// 8. Seed Initial Data if users is empty
echo CliColor::bold("LANGKAH 4: MEMERIKSA DATA AWAL (SEEDING)") . "\n";

$userCount = (int) $db->query("SELECT COUNT(*) FROM users")->fetchColumn();
if ($userCount === 0) {
    echo " [✓] Menambahkan user Admin & Kasir default...\n";
    
    // Hash for 'admin123'
    $defaultPasswordHash = password_hash('admin123', PASSWORD_BCRYPT);
    
    // Insert Admin
    $stmt = $db->prepare("
        INSERT INTO users (id, username, employee_id, password_hash, pin_code, full_name, email, role, is_active)
        VALUES (:id, :username, :employee_id, :password_hash, :pin_code, :full_name, :email, :role, :is_active)
    ");
    $stmt->execute([
        'id' => 'c2bc802f-508b-4a57-8974-9892c5890001',
        'username' => 'admin',
        'employee_id' => 'EMP001',
        'password_hash' => $defaultPasswordHash,
        'pin_code' => null,
        'full_name' => 'Administrator',
        'email' => 'admin@pos.local',
        'role' => 'admin',
        'is_active' => $isPg ? 'true' : 1
    ]);

    // Insert Cashier
    $stmt->execute([
        'id' => 'c2bc802f-508b-4a57-8974-9892c5890002',
        'username' => 'cashier1',
        'employee_id' => 'EMP002',
        'password_hash' => $defaultPasswordHash,
        'pin_code' => '1234',
        'full_name' => 'Alex Morgan',
        'email' => 'alex@pos.local',
        'role' => 'cashier',
        'is_active' => $isPg ? 'true' : 1
    ]);

    echo "     - Admin  : username=" . CliColor::bold("admin") . " | password=" . CliColor::bold("admin123") . "\n";
    echo "     - Kasir  : username=" . CliColor::bold("cashier1") . " | PIN=" . CliColor::bold("1234") . "\n";
} else {
    echo " [•] Tabel users sudah memiliki {$userCount} pengguna (dilewati).\n";
}

// Check Categories
$catCount = (int) $db->query("SELECT COUNT(*) FROM categories")->fetchColumn();
if ($catCount === 0) {
    echo " [✓] Menambahkan kategori default...\n";
    $categories = [
        ['name' => 'Hot Drinks', 'icon' => 'coffee', 'slug' => 'hot-drinks'],
        ['name' => 'Cold Drinks', 'icon' => 'local_cafe', 'slug' => 'cold-drinks'],
        ['name' => 'Pastries', 'icon' => 'bakery_dining', 'slug' => 'pastries'],
        ['name' => 'Bakery', 'icon' => 'cake', 'slug' => 'bakery'],
        ['name' => 'Food', 'icon' => 'lunch_dining', 'slug' => 'food'],
        ['name' => 'Desserts', 'icon' => 'icecream', 'slug' => 'desserts'],
        ['name' => 'Snacks', 'icon' => 'fastfood', 'slug' => 'snacks'],
    ];

    $stmtCat = $db->prepare("INSERT INTO categories (name, icon, slug, is_active) VALUES (:name, :icon, :slug, :is_active)");
    foreach ($categories as $cat) {
        $stmtCat->execute([
            'name' => $cat['name'],
            'icon' => $cat['icon'],
            'slug' => $cat['slug'],
            'is_active' => $isPg ? 'true' : 1
        ]);
    }
    echo "     - Berhasil menambahkan " . count($categories) . " kategori default.\n";
} else {
    echo " [•] Tabel categories sudah memiliki {$catCount} kategori (dilewati).\n";
}

// Optional sample products if empty and requested or table has 0 products
$productCount = (int) $db->query("SELECT COUNT(*) FROM products")->fetchColumn();
if ($productCount === 0 && ($isSeed || $isFresh)) {
    echo " [✓] Menambahkan produk sampel...\n";
    $sampleProducts = [
        ['id' => 'p1bc802f-508b-4a57-8974-9892c5890001', 'sku' => 'SKU-CAP-001', 'name' => 'Cappuccino', 'price' => 25000, 'purchase_price' => 15000, 'stock' => 100, 'cat_id' => 1],
        ['id' => 'p1bc802f-508b-4a57-8974-9892c5890002', 'sku' => 'SKU-LAT-001', 'name' => 'Caffe Latte', 'price' => 28000, 'purchase_price' => 16000, 'stock' => 100, 'cat_id' => 1],
        ['id' => 'p1bc802f-508b-4a57-8974-9892c5890003', 'sku' => 'SKU-ICE-001', 'name' => 'Iced Latte', 'price' => 30000, 'purchase_price' => 18000, 'stock' => 100, 'cat_id' => 2],
        ['id' => 'p1bc802f-508b-4a57-8974-9892c5890004', 'sku' => 'SKU-CRO-001', 'name' => 'Croissant', 'price' => 20000, 'purchase_price' => 12000, 'stock' => 50, 'cat_id' => 3],
        ['id' => 'p1bc802f-508b-4a57-8974-9892c5890005', 'sku' => 'SKU-CHO-001', 'name' => 'Chocolate Cake', 'price' => 35000, 'purchase_price' => 20000, 'stock' => 25, 'cat_id' => 4],
    ];

    $stmtProd = $db->prepare("
        INSERT INTO products (id, sku, name, price, purchase_price, stock_quantity, low_stock_threshold, category_id, is_active)
        VALUES (:id, :sku, :name, :price, :purchase_price, :stock, 10, :cat_id, :is_active)
    ");

    foreach ($sampleProducts as $p) {
        $stmtProd->execute([
            'id' => $p['id'],
            'sku' => $p['sku'],
            'name' => $p['name'],
            'price' => $p['price'],
            'purchase_price' => $p['purchase_price'],
            'stock' => $p['stock'],
            'cat_id' => $p['cat_id'],
            'is_active' => $isPg ? 'true' : 1
        ]);
    }
    echo "     - Berhasil menambahkan " . count($sampleProducts) . " produk sampel.\n";
}

echo "\n" . CliColor::green(CliColor::bold("========================================================")) . "\n";
echo CliColor::green(CliColor::bold("   ✓ MIGRASI DATABASE LAKSANA POS BERHASIL SELESAI!     ")) . "\n";
echo CliColor::green(CliColor::bold("========================================================")) . "\n";
echo " Seluruh 11 tabel, kolom v2, indeks, dan akun admin default siap digunakan.\n\n";
