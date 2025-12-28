<?php
/**
 * Report Routes
 */

use App\Utils\Response;
use App\Middleware\RoleMiddleware;

return function ($method, $path, $reportService, $user) {
    
    // All routes require authentication
    if (!$user) {
        Response::error('Otentikasi diperlukan', 401);
    }
    
    // Default date range (current month)
    $startDate = $_GET['start_date'] ?? date('Y-m-01');
    $endDate = $_GET['end_date'] ?? date('Y-m-d 23:59:59');
    
    // GET /api/reports/sales/summary - Sales summary
    if ($method === 'GET' && $path === '/sales/summary') {
        RoleMiddleware::requireAdminOrManager($user);
        $summary = $reportService->getSalesSummary($startDate, $endDate);
        Response::success($summary);
    }
    
    // GET /api/reports/sales/by-date - Sales by date (Used in Dashboard as well)
    if ($method === 'GET' && $path === '/sales/by-date') {
        // No strict role check here to allow Cashier dashboard to load chart
        $groupBy = $_GET['group_by'] ?? 'day';
        $sales = $reportService->getSalesByDate($startDate, $endDate, $groupBy);
        Response::success($sales);
    }
    
    // GET /api/reports/sales/by-category - Sales by category
    if ($method === 'GET' && $path === '/sales/by-category') {
        RoleMiddleware::requireAdminOrManager($user);
        $sales = $reportService->getSalesByCategory($startDate, $endDate);
        Response::success($sales);
    }
    
    // GET /api/reports/sales/by-payment - Sales by payment method
    if ($method === 'GET' && $path === '/sales/by-payment') {
        RoleMiddleware::requireAdminOrManager($user);
        $sales = $reportService->getSalesByPaymentMethod($startDate, $endDate);
        Response::success($sales);
    }
    
    // GET /api/reports/products/top-selling - Top selling products (Report version)
    if ($method === 'GET' && $path === '/products/top-selling') {
        RoleMiddleware::requireAdminOrManager($user);
        $limit = (int) ($_GET['limit'] ?? 10);
        $products = $reportService->getTopProducts($startDate, $endDate, $limit);
        Response::success($products);
    }
    
    // GET /api/reports/employees/performance - Employee performance
    if ($method === 'GET' && $path === '/employees/performance') {
        RoleMiddleware::requireAdmin($user);
        $performance = $reportService->getEmployeePerformance($startDate, $endDate);
        Response::success($performance);
    }
    
    // GET /api/reports/inventory/status - Inventory status
    if ($method === 'GET' && $path === '/inventory/status') {
        RoleMiddleware::requireAdminOrManager($user);
        $status = $reportService->getInventoryStatus();
        Response::success($status);
    }

    // GET /api/reports/employees/:id/transactions
    if ($method === 'GET' && preg_match('#^/employees/([^/]+)/transactions$#', $path, $matches)) {
        RoleMiddleware::requireAdmin($user);
        $employeeId = $matches[1];
        $transactions = $reportService->getEmployeeTransactions($employeeId, $startDate, $endDate);
        Response::success($transactions);
    }
    
    // GET /api/reports/sales/daily-financials
    if ($method === 'GET' && $path === '/sales/daily-financials') {
        RoleMiddleware::requireAdminOrManager($user);
        $groupBy = $_GET['group_by'] ?? 'day';
        $financials = $reportService->getDailyFinancials($startDate, $endDate, $groupBy);
        Response::success($financials);
    }

    Response::error('Rute tidak ditemukan', 404);
};
