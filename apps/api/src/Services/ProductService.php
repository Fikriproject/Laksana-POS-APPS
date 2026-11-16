<?php
/**
 * Product Service
 */

namespace App\Services;

use App\Models\Product;
use App\Models\Category;
use App\Models\ProductUnit;

class ProductService
{
    private Product $productModel;
    private Category $categoryModel;
    private ProductUnit $productUnitModel;

    public function __construct(Product $productModel, Category $categoryModel, ?ProductUnit $productUnitModel = null)
    {
        $this->productModel = $productModel;
        $this->categoryModel = $categoryModel;
        $this->productUnitModel = $productUnitModel ?? new ProductUnit();
    }

    private function attachUnits(array $products): array
    {
        if (empty($products)) return [];
        $ids = array_filter(array_column($products, 'id'));
        if (empty($ids)) return $products;

        $unitsByProduct = [];
        try {
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $db = (new \App\Config\Database())->getConnection();
            $stmt = $db->prepare("SELECT * FROM product_units WHERE product_id IN ($placeholders) ORDER BY conversion_factor ASC");
            $stmt->execute(array_values($ids));
            $allUnits = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];
            foreach ($allUnits as $u) {
                $unitsByProduct[$u['product_id']][] = $u;
            }
        } catch (\Exception $e) {
            // Table might not exist yet if migration hasn't run
        }

        foreach ($products as &$p) {
            $p['units'] = $unitsByProduct[$p['id']] ?? [];
        }
        return $products;
    }

    public function getAll(int $page = 1, int $perPage = 20, ?int $categoryId = null, ?bool $activeOnly = null): array
    {
        $perPage = max(1, min(5000, $perPage));
        $offset = ($page - 1) * $perPage;
        
        $products = $this->productModel->findAllWithCategory($perPage, $offset, $categoryId, $activeOnly);
        $total = $this->productModel->countWithFilter($categoryId, $activeOnly);
        
        return [
            'products' => $this->attachUnits($this->transformImageUrls($products)),
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => $perPage > 0 ? (int) ceil($total / $perPage) : 1
            ]
        ];
    }

    public function getById(string $id): ?array
    {
        $product = $this->productModel->findById($id);
        if ($product) {
            return $this->attachUnits($this->transformImageUrls([$product]))[0];
        }
        return null;
    }

    public function getBySku(string $sku): ?array
    {
        $product = $this->productModel->findBySku($sku);
        if ($product) {
            return $this->attachUnits($this->transformImageUrls([$product]))[0];
        }
        return null;
    }

    public function getByBarcode(string $barcode): ?array
    {
        $clean = trim($barcode);
        if (empty($clean)) return null;

        // 1. Direct SKU / Barcode on base product
        $product = $this->getBySku($clean);
        if ($product) return $product;

        // 2. Lookup in product_units
        $unit = $this->productUnitModel->findByBarcode($clean);
        if ($unit) {
            $prod = $this->getById($unit['product_id']);
            if ($prod) {
                $prod['matched_unit'] = $unit;
                return $prod;
            }
        }

        return null;
    }

    public function search(string $query): array
    {
        $products = $this->productModel->search($query);
        return $this->attachUnits($this->transformImageUrls($products));
    }

    public function create(array $data): string
    {
        // Extract units if provided
        $units = $data['units'] ?? [];
        unset($data['units']);

        // Generate SKU if not provided
        if (empty($data['sku'])) {
            $data['sku'] = $this->generateSku($data['name']);
        }

        if (!isset($data['purchase_price']) || $data['purchase_price'] === null || $data['purchase_price'] === '') {
            $data['purchase_price'] = 0;
        }

        if (!isset($data['price']) || $data['price'] === null || $data['price'] === '') {
            $data['price'] = 0;
        }

        if (!isset($data['stock_quantity']) || $data['stock_quantity'] === null || $data['stock_quantity'] === '') {
            $data['stock_quantity'] = 0;
        }

        if (isset($data['category_id']) && empty($data['category_id'])) {
            $data['category_id'] = null;
        }

        if (isset($data['wholesale_price']) && ($data['wholesale_price'] === '' || $data['wholesale_price'] === null)) {
            $data['wholesale_price'] = null;
        }

        if (isset($data['reseller_price']) && ($data['reseller_price'] === '' || $data['reseller_price'] === null)) {
            $data['reseller_price'] = null;
        }

        if (empty($data['wholesale_min_qty'])) {
            $data['wholesale_min_qty'] = 12;
        }

        if (empty($data['base_unit'])) {
            $data['base_unit'] = 'pcs';
        }
        
        $productId = $this->productModel->create($data);

        if (!empty($units) && is_array($units)) {
            $this->productUnitModel->syncUnits($productId, $units);
        }

        return $productId;
    }

    public function update(string $id, array $data): bool
    {
        // Sync units if provided
        if (array_key_exists('units', $data)) {
            $units = $data['units'] ?? [];
            if (is_array($units)) {
                $this->productUnitModel->syncUnits($id, $units);
            }
            unset($data['units']);
        }

        if (isset($data['purchase_price']) && ($data['purchase_price'] === null || $data['purchase_price'] === '')) {
            $data['purchase_price'] = 0;
        }
        if (isset($data['price']) && ($data['price'] === null || $data['price'] === '')) {
            $data['price'] = 0;
        }
        if (isset($data['stock_quantity']) && ($data['stock_quantity'] === null || $data['stock_quantity'] === '')) {
            $data['stock_quantity'] = 0;
        }
        if (array_key_exists('category_id', $data) && empty($data['category_id'])) {
            $data['category_id'] = null;
        }
        if (array_key_exists('wholesale_price', $data) && ($data['wholesale_price'] === '' || $data['wholesale_price'] === null)) {
            $data['wholesale_price'] = null;
        }
        if (array_key_exists('reseller_price', $data) && ($data['reseller_price'] === '' || $data['reseller_price'] === null)) {
            $data['reseller_price'] = null;
        }

        return $this->productModel->update($id, $data);
    }

    public function toggleStatus(string $id): bool
    {
        return $this->productModel->toggleActive($id);
    }

    public function delete(string $id): bool
    {
        return $this->productModel->delete($id);
    }

    /**
     * Import Produk Massal (Excel / CSV)
     */
    public function bulkImport(array $products, bool $updateExisting = true): array
    {
        $db = $this->productModel->getDb();
        $db->beginTransaction();

        try {
            // 1. Ambil kategori yang ada (nama dan slug)
            $stmtCat = $db->query("SELECT id, name, slug FROM categories");
            $categories = $stmtCat->fetchAll(\PDO::FETCH_ASSOC) ?: [];
            $categoryMap = [];
            $slugMap = [];
            foreach ($categories as $cat) {
                $normName = strtolower(trim(preg_replace('/\s+/', ' ', $cat['name'] ?? '')));
                if (!empty($normName)) {
                    $categoryMap[$normName] = (string)$cat['id'];
                }
                if (!empty($cat['slug'])) {
                    $normSlug = strtolower(trim($cat['slug']));
                    $slugMap[$normSlug] = (string)$cat['id'];
                }
            }

            $inserted = 0;
            $updated = 0;
            $skipped = 0;
            $categoriesCreated = 0;
            $isPg = ($db->getAttribute(\PDO::ATTR_DRIVER_NAME) === 'pgsql');

            // Prepared statements
            $stmtCheckSku = $db->prepare("SELECT id FROM products WHERE sku = :sku LIMIT 1");
            $stmtCheckName = $db->prepare("SELECT id FROM products WHERE LOWER(TRIM(name)) = LOWER(TRIM(:name)) LIMIT 1");
            $stmtFindCat = $db->prepare("SELECT id FROM categories WHERE LOWER(TRIM(name)) = LOWER(TRIM(:name)) OR slug = :slug LIMIT 1");
            $stmtInsertCat = $db->prepare("INSERT INTO categories (name, slug, is_active) VALUES (:name, :slug, 1)");
            
            $stmtInsertProd = $db->prepare(
                "INSERT INTO products (id, name, sku, price, purchase_price, stock_quantity, category_id, wholesale_price, wholesale_min_qty, reseller_price, base_unit, is_active)
                 VALUES (:id, :name, :sku, :price, :purchase_price, :stock_quantity, :category_id, :wholesale_price, :wholesale_min_qty, :reseller_price, :base_unit, 1)"
            );

            $stmtUpdateProd = $db->prepare(
                "UPDATE products 
                 SET name = :name, price = :price, purchase_price = :purchase_price, stock_quantity = :stock_quantity,
                     category_id = :category_id, wholesale_price = :wholesale_price, wholesale_min_qty = :wholesale_min_qty,
                     reseller_price = :reseller_price, base_unit = :base_unit, is_active = 1
                 WHERE id = :id"
            );

            foreach ($products as $p) {
                $name = trim($p['name'] ?? '');
                if (empty($name)) continue;

                $sku = trim($p['sku'] ?? '');
                $price = (float)($p['price'] ?? 0);
                $purchasePrice = (float)($p['purchase_price'] ?? 0);
                $stockQty = (int)($p['stock_quantity'] ?? 0);
                $wholesalePrice = isset($p['wholesale_price']) && $p['wholesale_price'] !== null && $p['wholesale_price'] !== '' ? (float)$p['wholesale_price'] : null;
                $wholesaleMinQty = (int)($p['wholesale_min_qty'] ?? 12);
                $resellerPrice = isset($p['reseller_price']) && $p['reseller_price'] !== null && $p['reseller_price'] !== '' ? (float)$p['reseller_price'] : null;
                $baseUnit = !empty($p['base_unit']) ? trim($p['base_unit']) : 'pcs';

                // Kategori
                $categoryId = null;
                $catName = trim($p['category_name'] ?? '');
                if (!empty($catName)) {
                    $normName = strtolower(trim(preg_replace('/\s+/', ' ', $catName)));
                    $catSlug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $catName), '-'));
                    if (empty($catSlug)) $catSlug = 'cat-' . substr(md5($catName), 0, 6);

                    // 1. Cek dari peta memori (nama atau slug)
                    if (isset($categoryMap[$normName])) {
                        $categoryId = $categoryMap[$normName];
                    } elseif (isset($slugMap[$catSlug])) {
                        $categoryId = $slugMap[$catSlug];
                        $categoryMap[$normName] = $categoryId;
                    } else {
                        // 2. Cek ke database jika belum terpetakan
                        $stmtFindCat->execute(['name' => $catName, 'slug' => $catSlug]);
                        $existingCatId = $stmtFindCat->fetchColumn();

                        if ($existingCatId) {
                            $categoryId = (string)$existingCatId;
                            $categoryMap[$normName] = $categoryId;
                            $slugMap[$catSlug] = $categoryId;
                        } else {
                            // 3. Buat kategori baru dengan perlindungan benturan slug
                            $finalSlug = $catSlug;
                            if (isset($slugMap[$finalSlug])) {
                                $finalSlug = substr($finalSlug, 0, 40) . '-' . substr(md5(uniqid()), 0, 6);
                            }

                            if ($isPg) {
                                $db->exec("SAVEPOINT cat_sp");
                            }

                            try {
                                $stmtInsertCat->execute(['name' => $catName, 'slug' => $finalSlug]);
                                $newCatId = (string)$db->lastInsertId();
                                if ($isPg) {
                                    $db->exec("RELEASE SAVEPOINT cat_sp");
                                }
                            } catch (\PDOException $e) {
                                if ($isPg) {
                                    $db->exec("ROLLBACK TO SAVEPOINT cat_sp");
                                }
                                // Cari ulang barangkali ada index duplikat
                                $stmtFindCat->execute(['name' => $catName, 'slug' => $finalSlug]);
                                $newCatId = $stmtFindCat->fetchColumn();

                                if (!$newCatId) {
                                    // Fallback dengan slug unik terjamin
                                    $uniqueSlug = substr($catSlug, 0, 40) . '-' . substr(md5(microtime()), 0, 6);
                                    if ($isPg) {
                                        $db->exec("SAVEPOINT cat_sp_fb");
                                    }
                                    try {
                                        $stmtInsertCat->execute(['name' => $catName, 'slug' => $uniqueSlug]);
                                        $newCatId = (string)$db->lastInsertId();
                                        if ($isPg) $db->exec("RELEASE SAVEPOINT cat_sp_fb");
                                    } catch (\PDOException $e2) {
                                        if ($isPg) $db->exec("ROLLBACK TO SAVEPOINT cat_sp_fb");
                                        $newCatId = null;
                                    }
                                }
                            }

                            if ($newCatId) {
                                $categoryId = (string)$newCatId;
                                $categoryMap[$normName] = $categoryId;
                                $slugMap[$finalSlug] = $categoryId;
                                $categoriesCreated++;
                            }
                        }
                    }
                }

                // Cek apakah SKU atau Nama sudah ada di sistem
                $existingId = null;
                if (!empty($sku)) {
                    $stmtCheckSku->execute(['sku' => $sku]);
                    $existingId = $stmtCheckSku->fetchColumn();
                }
                if (!$existingId && !empty($name)) {
                    $stmtCheckName->execute(['name' => $name]);
                    $existingId = $stmtCheckName->fetchColumn();
                }

                if ($existingId) {
                    if ($updateExisting) {
                        $stmtUpdateProd->execute([
                            'id' => $existingId,
                            'name' => $name,
                            'price' => $price,
                            'purchase_price' => $purchasePrice,
                            'stock_quantity' => $stockQty,
                            'category_id' => $categoryId,
                            'wholesale_price' => $wholesalePrice,
                            'wholesale_min_qty' => $wholesaleMinQty,
                            'reseller_price' => $resellerPrice,
                            'base_unit' => $baseUnit
                        ]);
                        $updated++;
                    } else {
                        $skipped++;
                    }
                } else {
                    if (empty($sku)) {
                        $sku = $this->generateSku($name);
                    }
                    // Generate UUID
                    $prodId = sprintf(
                        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                        mt_rand(0, 0xffff),
                        mt_rand(0, 0x0fff) | 0x4000,
                        mt_rand(0, 0x3fff) | 0x8000,
                        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
                    );

                    $stmtInsertProd->execute([
                        'id' => $prodId,
                        'name' => $name,
                        'sku' => $sku,
                        'price' => $price,
                        'purchase_price' => $purchasePrice,
                        'stock_quantity' => $stockQty,
                        'category_id' => $categoryId,
                        'wholesale_price' => $wholesalePrice,
                        'wholesale_min_qty' => $wholesaleMinQty,
                        'reseller_price' => $resellerPrice,
                        'base_unit' => $baseUnit
                    ]);
                    $inserted++;
                }
            }

            $db->commit();

            return [
                'inserted' => $inserted,
                'updated' => $updated,
                'skipped' => $skipped,
                'categories_created' => $categoriesCreated,
                'total' => count($products)
            ];
        } catch (\Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    /**
     * Terapkan Margin Otomatis Massal ke Seluruh Produk Toko
     */
    public function bulkSetMargin(array $options): array
    {
        $db = $this->productModel->getDb();
        $wholesalePercent = (float)($options['wholesale_percent'] ?? 25);
        $resellerPercent = (float)($options['reseller_percent'] ?? 20);
        $minQty = (int)($options['min_qty'] ?? 12);
        $scope = $options['scope'] ?? 'empty_only'; // 'empty_only' or 'all'
        $baseMode = $options['base_mode'] ?? ($options['base'] ?? 'cost'); // 'cost' (Modal + X%) atau 'retail_discount' (Ecer - X%)
        $categoryId = !empty($options['category_id']) && $options['category_id'] !== 'all' ? (int)$options['category_id'] : null;

        $where = "is_active = 1";
        if ($baseMode === 'cost') {
            $where .= " AND purchase_price > 0";
        } else {
            $where .= " AND price > 0";
        }

        $params = [];

        if ($scope === 'empty_only') {
            $where .= " AND (wholesale_price IS NULL OR reseller_price IS NULL OR wholesale_price = 0 OR reseller_price = 0)";
        }
        if ($categoryId !== null) {
            $where .= " AND category_id = :category_id";
            $params['category_id'] = $categoryId;
        }

        $stmt = $db->prepare("SELECT id, price, purchase_price, wholesale_price, reseller_price FROM products WHERE {$where}");
        $stmt->execute($params);
        $products = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        $updateStmt = $db->prepare(
            "UPDATE products 
             SET wholesale_price = :wholesale_price, wholesale_min_qty = :wholesale_min_qty, reseller_price = :reseller_price 
             WHERE id = :id"
        );

        $updatedCount = 0;
        $db->beginTransaction();
        try {
            foreach ($products as $p) {
                $cost = (float)($p['purchase_price'] ?? 0);
                $retailPrice = (float)($p['price'] ?? 0);

                if ($baseMode === 'retail_discount' && $retailPrice > 0) {
                    // Potongan/diskon dari harga ecer
                    $rawWs = $retailPrice * (1 - $wholesalePercent / 100);
                    $rawRs = $retailPrice * (1 - $resellerPercent / 100);

                    // Proteksi agar tidak di bawah modal jika harga modal ada
                    if ($cost > 0) {
                        $rawWs = max($cost, $rawWs);
                        $rawRs = max($cost, $rawRs);
                    }
                } else {
                    // Markup persentase dari modal
                    $baseVal = $cost > 0 ? $cost : $retailPrice;
                    $rawWs = $baseVal * (1 + $wholesalePercent / 100);
                    $rawRs = $baseVal * (1 + $resellerPercent / 100);

                    // Proteksi: jangan melebihi harga ecer jika ecer sudah ditetapkan
                    if ($retailPrice > 0) {
                        $rawWs = min($retailPrice, $rawWs);
                        $rawRs = min($retailPrice, $rawRs);
                    }
                }

                // 1. Pembulatan standar ratusan
                $wsPrice = round($rawWs / 100) * 100;
                $rsPrice = round($rawRs / 100) * 100;

                // 2. Anti Angka Kembar pada barang bernilai kecil/receh
                // Jika persentase grosir & reseller berbeda namun pembulatan ratusan membuat harganya sama:
                if ($wsPrice === $rsPrice && $wholesalePercent !== $resellerPercent && abs($rawWs - $rawRs) >= 1) {
                    // Coba pembulatan ke 50 terdekat
                    $ws50 = round($rawWs / 50) * 50;
                    $rs50 = round($rawRs / 50) * 50;
                    if ($ws50 !== $rs50) {
                        $wsPrice = $ws50;
                        $rsPrice = $rs50;
                    } else {
                        // Gunakan pembulatan puluhan terdekat agar tetap memiliki selisih berjenjang
                        $wsPrice = round($rawWs / 10) * 10;
                        $rsPrice = round($rawRs / 10) * 10;
                    }
                }

                $finalWs = ($scope === 'empty_only' && !empty($p['wholesale_price']) && (float)$p['wholesale_price'] > 0) ? (float)$p['wholesale_price'] : $wsPrice;
                $finalRs = ($scope === 'empty_only' && !empty($p['reseller_price']) && (float)$p['reseller_price'] > 0) ? (float)$p['reseller_price'] : $rsPrice;

                $updateStmt->execute([
                    'wholesale_price' => $finalWs,
                    'wholesale_min_qty' => $minQty,
                    'reseller_price' => $finalRs,
                    'id' => $p['id']
                ]);
                $updatedCount++;
            }
            $db->commit();
            return ['updated' => $updatedCount];
        } catch (\Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    public function getLowStock(): array
    {
        $products = $this->productModel->getLowStock();
        return $this->transformImageUrls($products);
    }

    public function getTopSelling(int $limit = 10, ?string $startDate = null, ?string $endDate = null): array
    {
        $products = $this->productModel->getTopSelling($limit, $startDate, $endDate);
        return $this->transformImageUrls($products);
    }

    public function getCategories(): array
    {
        return $this->categoryModel->getWithProductCount();
    }

    public function createCategory(array $data): string
    {
        return $this->categoryModel->create($data);
    }

    private function transformImageUrls(array $products): array
    {
        foreach ($products as &$product) {
            if (!empty($product['image_url'])) {
                // If URL contains localhost or 127.0.0.1, convert to relative path
                // This allows the frontend proxy (Vite) to handle the request correctly 
                // regardless of the device's IP address.
                if (strpos($product['image_url'], '127.0.0.1') !== false || strpos($product['image_url'], 'localhost') !== false) {
                    $product['image_url'] = preg_replace('/^https?:\/\/[^\/]+/', '', $product['image_url']);
                }
            }
        }
        return $products;
    }

    private function generateSku(string $name): string
    {
        $prefix = strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $name), 0, 3));
        $suffix = strtoupper(substr(md5(uniqid()), 0, 5));
        return "SKU-{$prefix}-{$suffix}";
    }
}
