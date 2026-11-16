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
