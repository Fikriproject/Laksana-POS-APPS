<?php
/**
 * Laksana POS - Assign & Sync Product Categories
 * Script untuk memastikan semua kategori tersedia di database dan
 * memperbarui category_id seluruh produk yang masih NULL / tidak valid.
 *
 * Penggunaan:
 *   php apps/api/scripts/assign_product_categories.php
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
    echo "\033[31m[ERROR] vendor/autoload.php tidak ditemukan.\033[0m\n";
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

try {
    $dbConfig = new Database();
    $db = $dbConfig->getConnection();
    $dbName = $dbConfig->getDbName();
    $driver = $dbConfig->getDriver();
    $isPg = ($driver === 'pgsql');

    echo "\n\033[1;36m========================================================\033[0m\n";
    echo "\033[1;36m   LAKSANA POS - SINKRONISASI & PEMETAAN KATEGORI      \033[0m\n";
    echo "\033[1;36m========================================================\033[0m\n";
    echo " Terhubung ke Database : \033[1;32m{$dbName}\033[0m ({$driver})\n";
    echo "--------------------------------------------------------\n\n";

    // 1. Pastikan seluruh kategori standar toko Laksana terdaftar di tabel categories
    $standardCategories = [
        ['name' => 'Peci', 'icon' => 'domino', 'slug' => 'peci'],
        ['name' => 'Jam', 'icon' => 'schedule', 'slug' => 'jam'],
        ['name' => 'Kertas', 'icon' => 'description', 'slug' => 'kertas'],
        ['name' => 'ATK', 'icon' => 'edit', 'slug' => 'atk'],
        ['name' => 'Kalkulator', 'icon' => 'calculate', 'slug' => 'kalkulator'],
        ['name' => 'Jasa', 'icon' => 'design_services', 'slug' => 'jasa'],
        ['name' => 'Figura', 'icon' => 'crop_original', 'slug' => 'figura'],
        ['name' => "Al-Qur'an", 'icon' => 'menu_book', 'slug' => 'al-quran'],
        ['name' => 'Kitab & Buku Agama', 'icon' => 'auto_stories', 'slug' => 'kitab-buku'],
        ['name' => 'Pramuka & Sekolah', 'icon' => 'school', 'slug' => 'pramuka'],
        ['name' => 'Aksesoris & Kerajinan', 'icon' => 'palette', 'slug' => 'aksesoris'],
    ];

    echo " [1] Memeriksa & membuat kategori...\n";
    $stmtCheckCat = $db->prepare("SELECT id FROM categories WHERE slug = :slug OR name = :name LIMIT 1");
    $stmtInsertCat = $db->prepare("INSERT INTO categories (name, icon, slug, is_active) VALUES (:name, :icon, :slug, :is_active)");

    foreach ($standardCategories as $cat) {
        $stmtCheckCat->execute(['slug' => $cat['slug'], 'name' => $cat['name']]);
        $existing = $stmtCheckCat->fetch(PDO::FETCH_ASSOC);
        if (!$existing) {
            $stmtInsertCat->execute([
                'name' => $cat['name'],
                'icon' => $cat['icon'],
                'slug' => $cat['slug'],
                'is_active' => $isPg ? 'true' : 1
            ]);
            echo "     + Kategori baru dibuat: \033[32m{$cat['name']}\033[0m\n";
        }
    }

    // 2. Ambil seluruh mapping kategori
    $categories = $db->query("SELECT id, name, slug FROM categories")->fetchAll(PDO::FETCH_ASSOC);
    $catMap = [];
    foreach ($categories as $c) {
        $catMap[$c['slug']] = (int)$c['id'];
        $catMap[strtolower($c['name'])] = (int)$c['id'];
    }

    $quranCatId = $catMap['al-quran'] ?? null;
    $kitabCatId = $catMap['kitab-buku'] ?? null;
    $jasaCatId  = $catMap['jasa'] ?? null;
    $atkCatId   = $catMap['atk'] ?? null;
    $kertasCatId = $catMap['kertas'] ?? null;
    $peciCatId  = $catMap['peci'] ?? null;
    $figuraCatId = $catMap['figura'] ?? null;
    $jamCatId   = $catMap['jam'] ?? null;
    $kalkulatorCatId = $catMap['kalkulator'] ?? null;
    $pramukaCatId = $catMap['pramuka'] ?? null;

    // 3. Perbaiki produk Cetak Foto yang punya orphan category (999, 10, dll)
    if ($jasaCatId) {
        $fixJasaStmt = $db->prepare("UPDATE products SET category_id = :jasa_id WHERE name LIKE '%Cetak Foto%' AND (category_id IS NULL OR category_id NOT IN (SELECT id FROM categories))");
        $fixJasaStmt->execute(['jasa_id' => $jasaCatId]);
        $jasaFixed = $fixJasaStmt->rowCount();
        if ($jasaFixed > 0) {
            echo " [2] Memperbaiki \033[32m{$jasaFixed}\033[0m produk cetak foto menjadi kategori 'Jasa'.\n";
        }
    }

    // 4. Update seluruh produk yang category_id masih NULL atau 0 atau invalid
    echo " [3] Memetakan produk tanpa kategori...\n";
    $unmapped = $db->query("SELECT id, name, sku FROM products WHERE category_id IS NULL OR category_id = 0 OR category_id NOT IN (SELECT id FROM categories)")->fetchAll(PDO::FETCH_ASSOC);
    echo "     - Ditemukan \033[33m" . count($unmapped) . "\033[0m produk yang perlu dipetakan.\n";

    $stmtUpdateCat = $db->prepare("UPDATE products SET category_id = :cat_id, updated_at = CURRENT_TIMESTAMP WHERE id = :id");

    $updatedQuran = 0;
    $updatedKitab = 0;
    $updatedOther = 0;

    $quranRegex = '/qur[\'’]?an|waqfu|juz\s*[\'’]?amma/i';
    $kitabRegex = '/kitab|terjemah|tafsir|iqro|syarah|safinah|fathul|solihin|ihya|durrotu|khutbah|burhan|akhlakul|aqidatul|kalamiyah|kifayatul|bidayatul|fawaid|risalah|ta[\'’]?lim|hidayah|washoya|tijan|suluk|jurumiyah|amtsilah|imrithi|amrity|fasolatan|hadist|sullam|tuhfatul|arbain|tasrifan|alala|shibyan|nadhom|aswaja|sharaf|tajwid|majmu|tuntunan|kultum|rpal|rpul|ma[\'’]?tsurat|simtudduror|tahlil|dalail|fiqih|mujarobat|kamus|muqaddam|targhib|majalisus|al-ibriz|buku|bulgul|tanbihul|jawahirul|mattan|qawaidul|wasiatul|rtsl|lagu\s*wajib|ziarah|asmaul\s*husna|doa|qosidah|wasiat|manaqib|i[\'’]?tiqad|arbaul|ratib|alfiyah|nashoihud|riyadlul|nahwu|yasin|fadilah|kholasoh|durusul|rimyuk/i';
    $pramukaRegex = '/pramuka|baret|kacu|hasduk|peluit|tali kur|sabuk|kaos kaki|regu|badge|emblem/i';
    $kertasRegex = '/kertas|hvs|manila|folio|buffalo|origami|sampul|kado/i';
    $atkRegex = '/spidol|bolpoin|pulpen|pensil|penghapus|penggaris|tipe-x|lem|gunting|cutter|stapler|staples|binder|lakban|isolasi|tape|map|amplop|buku tulis|joyko|kenko|snowman|celengan|paper bag/i';
    $peciRegex = '/peci|kopiah|songkok|sajadah|tasbih|sarung|mukena/i';
    $figuraRegex = '/figura|bingkai|frame|cermin/i';
    $jasaRegex = '/cetak|print|foto|jilid|laminating|scan|fotocopy|jasa|riwayat hidup|undangan/i';
    $jamRegex = '/jam/i';
    $kalkulatorRegex = '/kalkulator/i';

    foreach ($unmapped as $p) {
        $name = $p['name'];
        $targetCat = null;

        if (preg_match($quranRegex, $name)) {
            $targetCat = $quranCatId;
            $updatedQuran++;
        } elseif (preg_match($kitabRegex, $name)) {
            $targetCat = $kitabCatId;
            $updatedKitab++;
        } elseif ($pramukaCatId && preg_match($pramukaRegex, $name)) {
            $targetCat = $pramukaCatId;
            $updatedOther++;
        } elseif ($kertasCatId && preg_match($kertasRegex, $name)) {
            $targetCat = $kertasCatId;
            $updatedOther++;
        } elseif ($atkCatId && preg_match($atkRegex, $name)) {
            $targetCat = $atkCatId;
            $updatedOther++;
        } elseif ($peciCatId && preg_match($peciRegex, $name)) {
            $targetCat = $peciCatId;
            $updatedOther++;
        } elseif ($figuraCatId && preg_match($figuraRegex, $name)) {
            $targetCat = $figuraCatId;
            $updatedOther++;
        } elseif ($jasaCatId && preg_match($jasaRegex, $name)) {
            $targetCat = $jasaCatId;
            $updatedOther++;
        } elseif ($jamCatId && preg_match($jamRegex, $name)) {
            $targetCat = $jamCatId;
            $updatedOther++;
        } elseif ($kalkulatorCatId && preg_match($kalkulatorRegex, $name)) {
            $targetCat = $kalkulatorCatId;
            $updatedOther++;
        } else {
            // Default untuk buku / kitab jika belum ada
            $targetCat = $kitabCatId ?? $atkCatId;
            $updatedKitab++;
        }

        if ($targetCat) {
            $stmtUpdateCat->execute(['cat_id' => $targetCat, 'id' => $p['id']]);
        }
    }

    echo "\n\033[1;32m========================================================\033[0m\n";
    echo "\033[1;32m   ✓ SINKRONISASI KATEGORI BERHASIL!\033[0m\n";
    echo "\033[1;32m========================================================\033[0m\n";
    echo " Al-Qur'an dipetakan          : \033[1m{$updatedQuran}\033[0m produk\n";
    echo " Kitab & Buku Agama dipetakan : \033[1m{$updatedKitab}\033[0m produk\n";
    echo " Kategori lainnya             : \033[1m{$updatedOther}\033[0m produk\n";

    // Tampilkan rekap produk per kategori saat ini
    echo "\n Rekap Jumlah Produk per Kategori Saat Ini:\n";
    $recap = $db->query("
        SELECT c.id, c.name, COUNT(p.id) as total_products
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
        GROUP BY c.id, c.name
        ORDER BY total_products DESC
    ")->fetchAll(PDO::FETCH_ASSOC);

    foreach ($recap as $row) {
        echo " - " . str_pad($row['name'], 25) . ": \033[1;36m{$row['total_products']}\033[0m produk\n";
    }
    echo "\n";

} catch (\Exception $e) {
    echo "\n\033[31m[ERROR] Terjadi kesalahan: " . $e->getMessage() . "\033[0m\n\n";
    exit(1);
}
