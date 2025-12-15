<?php
/**
 * Role-based Access Middleware
 */

namespace App\Middleware;

use App\Utils\Response;

class RoleMiddleware
{
    public static function requireRole(array $user, array $allowedRoles): void
    {
        if (!in_array($user['role'], $allowedRoles)) {
            Response::error('Access denied. Insufficient permissions.', 403);
        }
    }

    public static function requireAdmin(array $user): void
    {
        self::requireRole($user, ['admin']);
    }

    public static function requireAdminOrManager(array $user): void
    {
        self::requireRole($user, ['admin', 'manager']);
    }
}
