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

    // Ensure start_date covers start of day and end_date covers end of day if only YYYY-MM-DD is passed
    if (strlen($startDate) <= 10) {
        $startDate .= ' 00:00:00';
    }
    if (strlen($endDate) <= 10) {
        $endDate .= ' 23:59:59';
    }
    
    // GET /api/reports/sales/summary - Sales summary
    if ($method === 'GET' && $path === '/sales/summary') {
        if (!RoleMiddleware::hasPermission($user, 'reports.view')) {
            Response::error('Akses ditolak. Anda tidak memiliki izin melihat laporan.', 403);
        }
        $summary = $reportService->getSalesSummary($startDate, $endDate);
        if (!RoleMiddleware::hasPermission($user, 'reports.view_profit')) {
            if (isset($summary['total_cogs'])) $summary['total_cogs'] = null;
            if (isset($summary['gross_profit'])) $summary['gross_profit'] = null;
            if (isset($summary['net_profit'])) $summary['net_profit'] = null;
            if (isset($summary['profit_margin'])) $summary['profit_margin'] = null;
        }
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
        if (!RoleMiddleware::hasPermission($user, 'reports.view')) {
            Response::error('Akses ditolak.', 403);
        }
        $sales = $reportService->getSalesByCategory($startDate, $endDate);
        Response::success($sales);
    }
    
    // GET /api/reports/sales/by-payment - Sales by payment method
    if ($method === 'GET' && $path === '/sales/by-payment') {
        if (!RoleMiddleware::hasPermission($user, 'reports.view')) {
            Response::error('Akses ditolak.', 403);
        }
        $sales = $reportService->getSalesByPaymentMethod($startDate, $endDate);
        Response::success($sales);
    }
    
    // GET /api/reports/products/top-selling - Top selling products (Report version)
    if ($method === 'GET' && $path === '/products/top-selling') {
        if (!RoleMiddleware::hasPermission($user, 'reports.view')) {
            Response::error('Akses ditolak.', 403);
        }
        $limit = (int) ($_GET['limit'] ?? 10);
        $products = $reportService->getTopProducts($startDate, $endDate, $limit);
        Response::success($products);
    }
    
    // GET /api/reports/employees/performance - Employee performance
    if ($method === 'GET' && $path === '/employees/performance') {
        if (!RoleMiddleware::hasPermission($user, 'users.manage') && ($user['role'] ?? '') !== 'admin') {
            Response::error('Akses ditolak.', 403);
        }
        $performance = $reportService->getEmployeePerformance($startDate, $endDate);
        Response::success($performance);
    }
    
    // GET /api/reports/inventory/status - Inventory status
    if ($method === 'GET' && $path === '/inventory/status') {
        if (!RoleMiddleware::hasPermission($user, 'reports.view') && !RoleMiddleware::hasPermission($user, 'inventory.view')) {
            Response::error('Akses ditolak.', 403);
        }
        $status = $reportService->getInventoryStatus();
        Response::success($status);
    }

    // GET /api/reports/employees/:id/transactions
    if ($method === 'GET' && preg_match('#^/employees/([^/]+)/transactions$#', $path, $matches)) {
        if (!RoleMiddleware::hasPermission($user, 'users.manage') && ($user['role'] ?? '') !== 'admin') {
            Response::error('Akses ditolak.', 403);
        }
        $employeeId = $matches[1];
        $transactions = $reportService->getEmployeeTransactions($employeeId, $startDate, $endDate);
        Response::success($transactions);
    }
    
    // GET /api/reports/sales/daily-financials
    if ($method === 'GET' && $path === '/sales/daily-financials') {
        if (!RoleMiddleware::hasPermission($user, 'reports.view')) {
            Response::error('Akses ditolak.', 403);
        }
        $groupBy = $_GET['group_by'] ?? 'day';
        $financials = $reportService->getDailyFinancials($startDate, $endDate, $groupBy);
        if (!RoleMiddleware::hasPermission($user, 'reports.view_profit')) {
            foreach ($financials as &$f) {
                if (isset($f['total_cogs'])) $f['total_cogs'] = null;
                if (isset($f['net_profit'])) $f['net_profit'] = null;
            }
        }
        Response::success($financials);
    }

    // GET /api/reports/daily-settlement - Rekap harian transaksi, kas, dan laba
    if ($method === 'GET' && $path === '/daily-settlement') {
        if (!RoleMiddleware::hasPermission($user, 'settlement.view')) {
            Response::error('Akses ditolak. Anda tidak memiliki izin melihat rekap harian.', 403);
        }
        $date = $_GET['date'] ?? date('Y-m-d');
        $settlement = $reportService->getDailySettlement($date);

        // Keamanan: Sembunyikan Modal Toko & Laba jika tidak punya izin settlement.view_profit
        if (!RoleMiddleware::hasPermission($user, 'settlement.view_profit')) {
            $settlement['total_cogs'] = null;
            $settlement['net_profit'] = null;
        }

        // Keamanan: Sembunyikan rekonsiliasi kas laci jika tidak punya izin settlement.view_cash
        if (!RoleMiddleware::hasPermission($user, 'settlement.view_cash')) {
            $settlement['shifts'] = [];
            $settlement['system_cash'] = null;
            $settlement['opening_cash'] = null;
        }

        Response::success($settlement);
    }

    Response::error('Rute tidak ditemukan', 404);
};
