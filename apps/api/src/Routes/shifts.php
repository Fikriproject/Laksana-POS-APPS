<?php
/**
 * Shift Routes
 */

use App\Utils\Response;
use App\Utils\Validator;
use App\Middleware\RoleMiddleware;

return function ($method, $path, $shiftService, $user) {
    
    // All routes require authentication
    if (!$user) {
        Response::error('Authentication required', 401);
    }
    
    // GET /api/shifts/current - Get current shift
    if ($method === 'GET' && $path === '/current') {
        $shift = $shiftService->getCurrentShift($user['id']);
        Response::success($shift);
    }
    
    // POST /api/shifts/open - Open new shift
    if ($method === 'POST' && $path === '/open') {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $openingCash = isset($data['opening_cash']) ? (float) $data['opening_cash'] : 0;
        
        try {
            $shift = $shiftService->openShift($user['id'], $openingCash);
            Response::success($shift, 'Shift opened', 201);
        } catch (\Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }
    
    // POST /api/shifts/close - Close current shift
    if ($method === 'POST' && $path === '/close') {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $validator = new Validator($data);
        $validator->required('shift_id')->required('closing_cash')->numeric('closing_cash');
        $validator->validate();
        
        try {
            $summary = $shiftService->closeShift(
                $data['shift_id'],
                $user['id'],
                (float) $data['closing_cash']
            );
            Response::success($summary, 'Shift closed');
        } catch (\Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }
    
    // GET /api/shifts/:id/summary - Get shift summary (Admin/Manager only)
    if ($method === 'GET' && preg_match('/^\/([a-f0-9-]+)\/summary$/', $path, $matches)) {
        RoleMiddleware::requireAdminOrManager($user);
        
        try {
            $summary = $shiftService->getShiftSummary($matches[1]);
            Response::success($summary);
        } catch (\Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }
    
    Response::error('Route not found', 404);
};
