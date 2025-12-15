<?php
/**
 * Authentication Service
 */

namespace App\Services;

use App\Models\User;
use App\Models\Shift;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthService
{
    private User $userModel;
    private Shift $shiftModel;
    private string $jwtSecret;
    private int $jwtExpiry;

    public function __construct(User $userModel, Shift $shiftModel)
    {
        $this->userModel = $userModel;
        $this->shiftModel = $shiftModel;
        $this->jwtSecret = $_ENV['JWT_SECRET'] ?? 'default-secret-key';
        $this->jwtExpiry = (int) ($_ENV['JWT_EXPIRY'] ?? 3600);
    }

    public function loginWithCredentials(string $usernameOrEmployeeId, string $password): ?array
    {
        // Try username first
        $user = $this->userModel->findByUsername($usernameOrEmployeeId);
        
        // Try employee ID if username not found
        if (!$user) {
            $user = $this->userModel->findByEmployeeId($usernameOrEmployeeId);
        }
        
        if (!$user) {
            return null;
        }
        
        // Verify password
        if (!$this->userModel->verifyPassword($password, $user['password_hash'])) {
            return null;
        }
        
        return $this->generateAuthResponse($user);
    }

    public function loginWithPin(string $pin): ?array
    {
        $user = $this->userModel->findByPin($pin);
        
        if (!$user) {
            return null;
        }
        
        return $this->generateAuthResponse($user);
    }

    public function validateToken(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            $user = $this->userModel->findById($decoded->sub);
            
            if (!$user || !$user['is_active']) {
                return null;
            }
            
            return $this->sanitizeUser($user);
        } catch (\Exception $e) {
            return null;
        }
    }

    public function refreshToken(string $userId): ?array
    {
        $user = $this->userModel->findById($userId);
        
        if (!$user || !$user['is_active']) {
            return null;
        }
        
        return $this->generateAuthResponse($user);
    }

    private function generateAuthResponse(array $user): array
    {
        $token = $this->generateToken($user);
        $sanitizedUser = $this->sanitizeUser($user);
        
        // Check for open shift
        $openShift = $this->shiftModel->findOpenByUser($user['id']);
        
        return [
            'token' => $token,
            'expires_in' => $this->jwtExpiry,
            'user' => $sanitizedUser,
            'shift' => $openShift
        ];
    }

    private function generateToken(array $user): string
    {
        $issuedAt = time();
        $expiresAt = $issuedAt + $this->jwtExpiry;
        
        $payload = [
            'iss' => 'pos-api',
            'sub' => $user['id'],
            'iat' => $issuedAt,
            'exp' => $expiresAt,
            'role' => $user['role']
        ];
        
        return JWT::encode($payload, $this->jwtSecret, 'HS256');
    }

    private function sanitizeUser(array $user): array
    {
        unset($user['password_hash'], $user['pin_code']);
        return $user;
    }
}
