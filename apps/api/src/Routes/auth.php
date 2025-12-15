<?php
/**
 * Authentication Routes
 */

use App\Utils\Response;
use App\Utils\Validator;

return function ($method, $path, $authService, $shiftService, $user = null) {
    
    // POST /api/auth/login - Admin login
    if ($method === 'POST' && $path === '/login') {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $validator = new Validator($data);
        $validator->required('username')->required('password');
        $validator->validate();
        
        $result = $authService->loginWithCredentials($data['username'], $data['password']);
        
        if (!$result) {
            Response::error('Kredensial tidak valid', 401);
        }
        
        Response::success($result, 'Login berhasil');
    }
    
    // POST /api/auth/login/pin - Cashier PIN login
    if ($method === 'POST' && $path === '/login/pin') {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $validator = new Validator($data);
        $validator->required('pin')->minLength('pin', 4)->maxLength('pin', 4);
        $validator->validate();
        
        $result = $authService->loginWithPin($data['pin']);
        
        if (!$result) {
            Response::error('PIN tidak valid', 401);
        }
        
        Response::success($result, 'Login berhasil');
    }
    
    // POST /api/auth/logout - Logout (requires auth)
    if ($method === 'POST' && $path === '/logout') {
        if (!$user) {
            Response::error('Otentikasi diperlukan', 401);
        }
        Response::success(null, 'Berhasil keluar');
    }
    
    // GET /api/auth/me - Get current user (requires auth)
    if ($method === 'GET' && $path === '/me') {
        if (!$user) {
            Response::error('Otentikasi diperlukan', 401);
        }
        
        $shift = $shiftService->getCurrentShift($user['id']);
        
        Response::success([
            'user' => $user,
            'shift' => $shift
        ]);
    }
    
    // POST /api/auth/refresh - Refresh token (requires auth)
    if ($method === 'POST' && $path === '/refresh') {
        if (!$user) {
            Response::error('Otentikasi diperlukan', 401);
        }
        
        $result = $authService->refreshToken($user['id']);
        
        if (!$result) {
            Response::error('Gagal memperbarui token', 401);
        }
        
        Response::success($result, 'Token diperbarui');
    }
    
    Response::error('Rute tidak ditemukan', 404);
};
