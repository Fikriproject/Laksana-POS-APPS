<?php
use App\Utils\Response;
use App\Utils\Validator;
use App\Middleware\RoleMiddleware;

return function ($method, $path, $stockReportService, $user) {
    if (!$user) {
        Response::error('Otentikasi diperlukan', 401);
    }

    // POST /api/stock-reports - Create report (Cashier+)
    if ($method === 'POST' && $path === '') {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $validator = new Validator($data);
        $validator->required('product_id');
        $validator->validate();

        try {
            $result = $stockReportService->createReport($user['id'], $data);
            Response::success($result, 'Laporan stok berhasil dikirim', 201);
        } catch (\Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // GET /api/stock-reports/pending - List pending reports (Admin/Manager)
    if ($method === 'GET' && $path === '/pending') {
        RoleMiddleware::requireAdminOrManager($user);
        $reports = $stockReportService->getPendingReports();
        Response::success($reports);
    }
    
    // GET /api/stock-reports - List all reports (Admin/Manager)
    if ($method === 'GET' && $path === '') {
        RoleMiddleware::requireAdminOrManager($user);
        $page = (int) ($_GET['page'] ?? 1);
        $result = $stockReportService->getAllReports($page);
        Response::success($result);
    }

    // PATCH /api/stock-reports/:id/resolve - Resolve report (Admin/Manager)
    if ($method === 'PATCH' && preg_match('/^\/([a-zA-Z0-9-]+)\/resolve$/', $path, $matches)) {
        RoleMiddleware::requireAdminOrManager($user);
        $stockReportService->resolveReport($matches[1]);
        Response::success(null, 'Laporan ditandai selesai');
    }

    Response::error('Rute tidak ditemukan', 404);
};
