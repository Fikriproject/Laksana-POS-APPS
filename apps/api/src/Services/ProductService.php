<?php
/**
 * Product Service
 */

namespace App\Services;

use App\Models\Product;
use App\Models\Category;

class ProductService
{
    private Product $productModel;
    private Category $categoryModel;

    public function __construct(Product $productModel, Category $categoryModel)
    {
        $this->productModel = $productModel;
        $this->categoryModel = $categoryModel;
    }

    public function getAll(int $page = 1, int $perPage = 20, ?int $categoryId = null, ?bool $activeOnly = null): array
    {
        $offset = ($page - 1) * $perPage;
        
        $products = $this->productModel->findAllWithCategory($perPage, $offset, $categoryId, $activeOnly);
        $total = $this->productModel->count();
        
        return [
            'products' => $products,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => ceil($total / $perPage)
            ]
        ];
    }

    public function getById(string $id): ?array
    {
        return $this->productModel->findById($id);
    }

    public function getBySku(string $sku): ?array
    {
        return $this->productModel->findBySku($sku);
    }

    public function search(string $query): array
    {
        return $this->productModel->search($query);
    }

    public function create(array $data): string
    {
        // Generate SKU if not provided
        if (empty($data['sku'])) {
            $data['sku'] = $this->generateSku($data['name']);
        }
        
        return $this->productModel->create($data);
    }

    public function update(string $id, array $data): bool
    {
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
        return $this->productModel->getLowStock();
    }

    public function getTopSelling(int $limit = 10, ?string $startDate = null, ?string $endDate = null): array
    {
        return $this->productModel->getTopSelling($limit, $startDate, $endDate);
    }

    public function getCategories(): array
    {
        return $this->categoryModel->getWithProductCount();
    }

    public function createCategory(array $data): string
    {
        return $this->categoryModel->create($data);
    }

    private function generateSku(string $name): string
    {
        $prefix = strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $name), 0, 3));
        $suffix = strtoupper(substr(md5(uniqid()), 0, 5));
        return "SKU-{$prefix}-{$suffix}";
    }
}
