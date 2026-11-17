<?php
/**
 * Role-based Access & Granular Permissions Middleware
 */

namespace App\Middleware;

use App\Utils\Response;

class RoleMiddleware
{
    public static function requireRole(array $user, array $allowedRoles): void
    {
        if (!in_array($user['role'] ?? '', $allowedRoles)) {
            Response::error('Akses ditolak. Peran Anda tidak memiliki izin.', 403);
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

    /**
     * Periksa apakah pengguna memiliki hak akses (permission) tertentu.
     * Admin selalu memiliki akses penuh (true).
     */
    public static function hasPermission(?array $user, string $permissionKey): bool
    {
        if (!$user) {
            return false;
        }

        // Admin selalu memiliki akses tanpa batasan
        if (($user['role'] ?? '') === 'admin') {
            return true;
        }

        $perms = $user['permissions'] ?? [];
        if (is_string($perms)) {
            $perms = json_decode($perms, true) ?? [];
        }

        return !empty($perms[$permissionKey]);
    }

    /**
     * Wajibkan pengguna memiliki permission tertentu, jika tidak beri 403.
     */
    public static function requirePermission(array $user, string $permissionKey): void
    {
        if (!self::hasPermission($user, $permissionKey)) {
            Response::error("Akses ditolak. Anda tidak memiliki izin untuk fitur ini ($permissionKey).", 403);
        }
    }

    /**
     * Wajibkan pengguna memiliki salah satu dari daftar permissions.
     */
    public static function requireAnyPermission(array $user, array $permissionKeys): void
    {
        if (($user['role'] ?? '') === 'admin') {
            return;
        }

        foreach ($permissionKeys as $key) {
            if (self::hasPermission($user, $key)) {
                return;
            }
        }

        Response::error('Akses ditolak. Anda tidak memiliki izin untuk tindakan ini.', 403);
    }
}
