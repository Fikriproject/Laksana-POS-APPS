<?php

use App\Services\ExpenseService;
use App\Middleware\RoleMiddleware;
use App\Utils\Response;


return function ($method, $path, $user) {
    // Instantiate service locally if not passed, or better, change signature to accept it.
    // However, index.php injection is cleaner. Let's assume index.php will pass it.
    // For now, to match the pattern where I might not want to edit index.php heavily, 
    // I will instantiate it inside if not passed, BUT index.php edits are planned.
    
    // Actually, looking at index.php, it passes specific services to specific handlers.
    // I will update index.php to pass $expenseService.
    
    $expenseService = new \App\Services\ExpenseService();

    // GET /expenses
    if ($method === 'GET' && ($path === '' || $path === '/')) {
        try {
            RoleMiddleware::requireAdminOrManager($user);
            
            $startDate = $_GET['start_date'] ?? date('Y-m-01');
            $endDate = $_GET['end_date'] ?? date('Y-m-d 23:59:59');
            
            if (isset($_GET['summary']) && $_GET['summary'] === 'true') {
                $data = $expenseService->getExpenseSummary($startDate, $endDate);
            } else {
                $data = $expenseService->getExpenses($startDate, $endDate);
            }
            
            Response::success($data);
        } catch (Exception $e) {
            Response::error('Failed to fetch expenses: ' . $e->getMessage(), 500);
        }
    }

    // POST /expenses
    if ($method === 'POST' && ($path === '' || $path === '/')) {
        RoleMiddleware::requireAdminOrManager($user);

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['category']) || !isset($data['amount'])) {
            Response::error('Category and Amount are required', 400);
        }
        
        $data['user_id'] = $user['id'];

        try {
            $result = $expenseService->createExpense($data);
            Response::success($result, 201);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }
    
    Response::error('Rute tidak ditemukan: ' . $path, 404);
};

