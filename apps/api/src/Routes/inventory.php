<?php
/**
 * Inventory Routes
 */

use App\Utils\Response;
use App\Utils\Validator;
use App\Middleware\RoleMiddleware;

return function ($method, $path, $inventoryService, $user) {
    
    // All routes require authentication
    if (!$user) {
        Response::error('Otentikasi diperlukan', 401);
    }
    
    // GET /api/inventory/logs - List inventory logs
    if ($method === 'GET' && $path === '/logs') {
        $page = (int) ($_GET['page'] ?? 1);
        $perPage = (int) ($_GET['per_page'] ?? 20);
        $type = $_GET['type'] ?? null;
        
        $result = $inventoryService->getLogs($page, $perPage, $type);
        Response::success($result);
    }
    
    // GET /api/inventory/suppliers - Get all suppliers
    if ($method === 'GET' && $path === '/suppliers') {
        $suppliers = $inventoryService->getSuppliers();
        Response::success($suppliers);
    }
    
    // GET /api/inventory/product/:id - Get product inventory history
    if ($method === 'GET' && preg_match('/^\/product\/([a-f0-9-]+)$/', $path, $matches)) {
        $history = $inventoryService->getProductHistory($matches[1]);
        Response::success($history);
    }
    
    // POST /api/inventory/stock-in - Record stock in
    if ($method === 'POST' && $path === '/stock-in') {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $validator = new Validator($data);
        $validator->required('product_id')->required('quantity')->numeric('quantity');
        $validator->validate();
        
        try {
            $result = $inventoryService->stockIn(
                $data['product_id'],
                $user['id'],
                (int) $data['quantity'],
                $data['supplier_id'] ?? null,
                $data['notes'] ?? null
            );
            
            Response::success($result, 'Stok masuk tercatat', 201);
        } catch (\Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }
    
    // POST /api/inventory/stock-out - Record stock out
    if ($method === 'POST' && $path === '/stock-out') {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $validator = new Validator($data);
        $validator->required('product_id')->required('quantity')->numeric('quantity');
        $validator->validate();
        
        try {
            $result = $inventoryService->stockOut(
                $data['product_id'],
                $user['id'],
                (int) $data['quantity'],
                $data['notes'] ?? null
            );
            
            Response::success($result, 'Stok keluar tercatat', 201);
        } catch (\Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }
    
    // POST /api/inventory/adjustment - Record stock adjustment (Admin only)
    if ($method === 'POST' && $path === '/adjustment') {
        RoleMiddleware::requireAdmin($user);
        
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $validator = new Validator($data);
        $validator->required('product_id')->required('new_quantity')->numeric('new_quantity');
        $validator->validate();
        
        try {
            $result = $inventoryService->adjustment(
                $data['product_id'],
                $user['id'],
                (int) $data['new_quantity'],
                $data['notes'] ?? null
            );
            
            Response::success($result, 'Penyesuaian stok tercatat', 201);
        } catch (\Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }
    
    Response::error('Rute tidak ditemukan', 404);
};
