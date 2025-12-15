<?php
/**
 * Order Routes
 */

use App\Utils\Response;
use App\Utils\Validator;
use App\Middleware\RoleMiddleware;

return function ($method, $path, $orderService, $shiftService, $user) {
    
    // All routes require authentication
    if (!$user) {
        Response::error('Otentikasi diperlukan', 401);
    }
    
    // GET /api/orders - List all orders
    if ($method === 'GET' && $path === '') {
        $page = (int) ($_GET['page'] ?? 1);
        $perPage = (int) ($_GET['per_page'] ?? 20);
        $startDate = $_GET['start_date'] ?? null;
        $endDate = $_GET['end_date'] ?? null;
        
        $result = $orderService->getOrders($page, $perPage, $startDate, $endDate);
        Response::success($result);
    }
    
    // GET /api/orders/today - Get today's summary
    if ($method === 'GET' && $path === '/today') {
        $summary = $orderService->getTodaySummary();
        Response::success($summary);
    }

    // GET /api/orders/stats - Get overall stats for dashboard
    if ($method === 'GET' && $path === '/stats') {
        $stats = $orderService->getDashboardStats();
        Response::success($stats);
    }
    
    // GET /api/orders/:id - Get order by ID
    if ($method === 'GET' && preg_match('/^\/([a-f0-9-]+)$/', $path, $matches)) {
        $order = $orderService->getOrder($matches[1]);
        
        if (!$order) {
            Response::error('Pesanan tidak ditemukan', 404);
        }
        
        Response::success($order);
    }
    
    // POST /api/orders - Create new order
    if ($method === 'POST' && $path === '') {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $validator = new Validator($data);
        $validator->required('items')->required('payment_method');
        $validator->in('payment_method', ['cash', 'card', 'e-wallet', 'other']);
        $validator->validate();
        
        if (empty($data['items']) || !is_array($data['items'])) {
            Response::error('Item diperlukan', 400);
        }
        
        // Validate each item
        foreach ($data['items'] as $index => $item) {
            if (empty($item['product_id']) || empty($item['quantity'])) {
                Response::error("Item {$index}: product_id dan jumlah diperlukan", 400);
            }
        }
        
        // Get current shift
        $shift = $shiftService->getCurrentShift($user['id']);
        $shiftId = $shift ? $shift['id'] : null;
        
        try {
            $order = $orderService->createOrder(
                $user['id'],
                $data['items'],
                $data['payment_method'],
                $data['customer_id'] ?? null,
                $shiftId,
                $data['discount_amount'] ?? 0,
                $data['notes'] ?? null,
                $data['amount_paid'] ?? 0,
                $data['tax_amount'] ?? 0
            );
            
            Response::success($order, 'Pesanan dibuat', 201);
        } catch (\Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }
    
    // POST /api/orders/:id/refund - Refund order (Admin/Manager only)
    if ($method === 'POST' && preg_match('/^\/([a-f0-9-]+)\/refund$/', $path, $matches)) {
        RoleMiddleware::requireAdminOrManager($user);
        
        try {
            $orderService->refundOrder($matches[1], $user['id']);
            $order = $orderService->getOrder($matches[1]);
            
            Response::success($order, 'Pesanan dikembalikan');
        } catch (\Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }
    
    Response::error('Rute tidak ditemukan', 404);
};
