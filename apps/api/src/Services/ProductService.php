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
            // 1. Ambil kategori yang ada
            $stmtCat = $db->query("SELECT id, name FROM categories");
            $categories = $stmtCat->fetchAll(\PDO::FETCH_ASSOC) ?: [];
            $categoryMap = [];
            foreach ($categories as $cat) {
                $categoryMap[strtolower(trim($cat['name']))] = (string)$cat['id'];
            }

            $inserted = 0;
            $updated = 0;
            $skipped = 0;
            $categoriesCreated = 0;

            // Prepared statements
            $stmtCheckSku = $db->prepare("SELECT id FROM products WHERE sku = :sku LIMIT 1");
            $stmtInsertCat = $db->prepare("INSERT INTO categories (name, slug, is_active) VALUES (:name, :slug, 1)");
            
            $stmtInsertProd = $db->prepare(
                "INSERT INTO products (id, name, sku, barcode, price, purchase_price, stock_quantity, category_id, wholesale_price, wholesale_min_qty, reseller_price, base_unit, is_active)
                 VALUES (:id, :name, :sku, :barcode, :price, :purchase_price, :stock_quantity, :category_id, :wholesale_price, :wholesale_min_qty, :reseller_price, :base_unit, 1)"
            );

            $stmtUpdateProd = $db->prepare(
                "UPDATE products 
                 SET name = :name, barcode = :barcode, price = :price, purchase_price = :purchase_price, stock_quantity = :stock_quantity,
                     category_id = :category_id, wholesale_price = :wholesale_price, wholesale_min_qty = :wholesale_min_qty,
                     reseller_price = :reseller_price, is_active = 1
                 WHERE id = :id"
            );

            foreach ($products as $p) {
                $name = trim($p['name'] ?? '');
                if (empty($name)) continue;

                $sku = trim($p['sku'] ?? '');
                $barcode = trim($p['barcode'] ?? $sku);
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
                    $catKey = strtolower($catName);
                    if (isset($categoryMap[$catKey])) {
                        $categoryId = $categoryMap[$catKey];
                    } else {
                        // Buat kategori baru
                        $catSlug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $catName)));
                        if (empty($catSlug)) $catSlug = 'cat-' . substr(md5($catName), 0, 6);
                        $stmtInsertCat->execute(['name' => $catName, 'slug' => $catSlug]);
                        $newCatId = (string)$db->lastInsertId();
                        $categoryMap[$catKey] = $newCatId;
                        $categoryId = $newCatId;
                        $categoriesCreated++;
                    }
                }

                // Cek apakah SKU sudah ada
                $existingId = null;
                if (!empty($sku)) {
                    $stmtCheckSku->execute(['sku' => $sku]);
                    $existingId = $stmtCheckSku->fetchColumn();
                }

                if ($existingId) {
                    if ($updateExisting) {
                        $stmtUpdateProd->execute([
                            'id' => $existingId,
                            'name' => $name,
                            'barcode' => $barcode,
                            'price' => $price,
                            'purchase_price' => $purchasePrice,
                            'stock_quantity' => $stockQty,
                            'category_id' => $categoryId,
                            'wholesale_price' => $wholesalePrice,
                            'wholesale_min_qty' => $wholesaleMinQty,
                            'reseller_price' => $resellerPrice
                        ]);
                        $updated++;
                    } else {
                        $skipped++;
                    }
                } else {
                    if (empty($sku)) {
                        $sku = $this->generateSku($name);
                        $barcode = $sku;
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
                        'barcode' => $barcode,
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
        $categoryId = !empty($options['category_id']) && $options['category_id'] !== 'all' ? (int)$options['category_id'] : null;

        $where = "is_active = 1 AND purchase_price > 0";
        $params = [];

        if ($scope === 'empty_only') {
            $where .= " AND (wholesale_price IS NULL OR reseller_price IS NULL OR wholesale_price = 0 OR reseller_price = 0)";
        }
        if ($categoryId !== null) {
            $where .= " AND category_id = :category_id";
            $params['category_id'] = $categoryId;
        }

        $stmt = $db->prepare("SELECT id, purchase_price, wholesale_price, reseller_price FROM products WHERE {$where}");
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
                $cost = (float)$p['purchase_price'];
                $wsPrice = round(($cost * (1 + $wholesalePercent / 100)) / 100) * 100;
                $rsPrice = round(($cost * (1 + $resellerPercent / 100)) / 100) * 100;

                $finalWs = ($scope === 'empty_only' && !empty($p['wholesale_price'])) ? (float)$p['wholesale_price'] : $wsPrice;
                $finalRs = ($scope === 'empty_only' && !empty($p['reseller_price'])) ? (float)$p['reseller_price'] : $rsPrice;

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
