<?php
/**
 * Product Routes
 */

use App\Utils\Response;
use App\Utils\Validator;
use App\Middleware\RoleMiddleware;

return function ($method, $path, $productService, $user) {
    
    // All routes require authentication
    if (!$user) {
        Response::error('Otentikasi diperlukan', 401);
    }
    
    // GET /api/products - List all products
    if ($method === 'GET' && $path === '') {
        $page = (int) ($_GET['page'] ?? 1);
        $perPage = (int) ($_GET['per_page'] ?? 20);
        $categoryId = isset($_GET['category_id']) ? (int) $_GET['category_id'] : null;
        $activeOnly = isset($_GET['active']) ? filter_var($_GET['active'], FILTER_VALIDATE_BOOLEAN) : null;
        
        $result = $productService->getAll($page, $perPage, $categoryId, $activeOnly);
        Response::success($result);
    }
    
    // GET /api/products/search?q=query - Search products
    if ($method === 'GET' && $path === '/search') {
        $query = $_GET['q'] ?? '';
        
        error_log("Search requested: " . $query);

        if (strlen($query) < 2) {
            Response::error('Kata kunci pencarian minimal 2 karakter', 400);
        }
        
        try {
            $products = $productService->search($query);
            error_log("Search found " . count($products) . " items");
            Response::success($products);
        } catch (\Exception $e) {
            error_log("Search Error: " . $e->getMessage());
            Response::error("Pencarian gagal: " . $e->getMessage(), 500);
        }
    }
    
    // GET /api/products/low-stock - Get low stock products
    if ($method === 'GET' && $path === '/low-stock') {
        $products = $productService->getLowStock();
        Response::success($products);
    }
    
    // GET /api/products/top-selling - Get top selling products
    if ($method === 'GET' && $path === '/top-selling') {
        $limit = (int) ($_GET['limit'] ?? 10);
        $startDate = $_GET['start_date'] ?? null;
        $endDate = $_GET['end_date'] ?? null;
        
        $products = $productService->getTopSelling($limit, $startDate, $endDate);
        Response::success($products);
    }
    
    // GET /api/products/categories - Get all categories
    if ($method === 'GET' && $path === '/categories') {
        $categories = $productService->getCategories();
        Response::success($categories);
    }
    
    // POST /api/products/categories - Create category (Admin only)
    if ($method === 'POST' && $path === '/categories') {
        RoleMiddleware::requireAdmin($user);
        
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $validator = new Validator($data);
        $validator->required('name');
        $validator->validate();
        
        // Generate slug from name
        if (empty($data['slug'])) {
            $data['slug'] = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data['name'])));
        }
        
        $data['is_active'] = true;
        
        $categoryId = $productService->createCategory($data);
        
        Response::success(['id' => $categoryId], 'Kategori dibuat', 201);
    }
    
    // GET /api/products/:id - Get product by ID
    if ($method === 'GET' && preg_match('/^\/([a-zA-Z0-9-]+)$/', $path, $matches)) {
        $product = $productService->getById($matches[1]);
        
        if (!$product) {
            Response::error('Produk tidak ditemukan', 404);
        }
        
        Response::success($product);
    }
    
    // GET /api/products/sku/:sku - Get product by SKU
    if ($method === 'GET' && preg_match('/^\/sku\/([A-Za-z0-9-]+)$/', $path, $matches)) {
        $product = $productService->getBySku($matches[1]);
        
        if (!$product) {
            Response::error('Produk tidak ditemukan', 404);
        }
        
        Response::success($product);
    }
    
    // POST /api/products - Create product (Admin only)
    if ($method === 'POST' && $path === '') {
        RoleMiddleware::requireAdmin($user);
        
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $validator = new Validator($data);
        $validator->required('name')->required('price')->numeric('price');
        $validator->validate();
        
        $productId = $productService->create($data);
        $product = $productService->getById($productId);
        
        Response::success($product, 'Produk dibuat', 201);
    }
    
    // PUT /api/products/:id - Update product (Admin only)
    if ($method === 'PUT' && preg_match('/^\/([a-zA-Z0-9-]+)$/', $path, $matches)) {
        RoleMiddleware::requireAdmin($user);
        
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $productService->update($matches[1], $data);
        $product = $productService->getById($matches[1]);
        
        Response::success($product, 'Produk diperbarui');
    }
    
    // PATCH /api/products/:id/status - Toggle product status (Admin only)
    if ($method === 'PATCH' && preg_match('/^\/([a-zA-Z0-9-]+)\/status$/', $path, $matches)) {
        RoleMiddleware::requireAdmin($user);
        
        $productService->toggleStatus($matches[1]);
        $product = $productService->getById($matches[1]);
        
        Response::success($product, 'Status produk diperbarui');
    }
    
    // DELETE /api/products/:id - Delete product (Admin only)
    if ($method === 'DELETE' && preg_match('/^\/([a-zA-Z0-9-]+)$/', $path, $matches)) {
        RoleMiddleware::requireAdmin($user);
        
        $productService->delete($matches[1]);
        Response::success(null, 'Produk dihapus');
    }
    
    Response::error('Rute tidak ditemukan', 404);
};
