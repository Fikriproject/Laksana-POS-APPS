<?php
/**
 * User Management Routes
 */

use App\Utils\Response;
use App\Utils\Validator;
use App\Middleware\RoleMiddleware;

return function ($method, $path, $userService, $user = null) {
    // Middleware: All these routes require Admin role
    if ($user) {
        RoleMiddleware::requireAdmin($user);
    } else {
        Response::error('Otentikasi diperlukan', 401);
    }

    // GET /api/users - List all users
    if ($method === 'GET' && $path === '') {
        $users = $userService->getAllUsers();
        Response::success($users);
    }

    // POST /api/users - Create user
    if ($method === 'POST' && $path === '') {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $validator = new Validator($data);
        $validator->required('username')->required('password')->required('full_name')->required('role');
        $validator->validate();
        
        try {
            $id = $userService->createUser($data);
            Response::success(['id' => $id], 'User berhasil dibuat', 201);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    // PATCH /api/users/:id - Update user
    if ($method === 'PATCH' && preg_match('#^/([a-zA-Z0-9-]+)$#', $path, $matches)) {
        $id = $matches[1];
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        try {
            $userService->updateUser($id, $data);
            Response::success(null, 'User berhasil diperbarui');
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    // DELETE /api/users/:id - Delete (Deactivate) user
    if ($method === 'DELETE' && preg_match('#^/([a-zA-Z0-9-]+)$#', $path, $matches)) {
        $id = $matches[1];
        
        try {
            $userService->deleteUser($id);
            Response::success(null, 'User berhasil dinonaktifkan');
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }
};
