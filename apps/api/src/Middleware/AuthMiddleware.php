<?php
/**
 * Authentication Middleware
 */

namespace App\Middleware;

use App\Services\AuthService;
use App\Utils\Response;

class AuthMiddleware
{
    private AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function handle(): array
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (empty($authHeader)) {
            Response::error('Authorization header required', 401);
        }
        
        // Extract token from "Bearer <token>"
        if (!preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
            Response::error('Invalid authorization format', 401);
        }
        
        $token = $matches[1];
        $user = $this->authService->validateToken($token);
        
        if (!$user) {
            Response::error('Invalid or expired token', 401);
        }
        
        return $user;
    }
}
