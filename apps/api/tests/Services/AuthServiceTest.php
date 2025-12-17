<?php

namespace Tests\Services;

use PHPUnit\Framework\TestCase;
use App\Services\AuthService;
use App\Models\User;

use App\Models\Shift;

class AuthServiceTest extends TestCase
{
    private $userModel;
    private $shiftModel;
    private $service;

    protected function setUp(): void
    {
        $this->userModel = $this->createMock(User::class);
        $this->shiftModel = $this->createMock(Shift::class);
        $this->service = new AuthService($this->userModel, $this->shiftModel);
    }

    public function testLoginSuccess()
    {
        $email = 'admin@example.com';
        $password = 'password123';
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

        $mockUser = [
            'id' => 1,
            'name' => 'Admin',
            'email' => $email,
            'password_hash' => $hashedPassword,
            'role' => 'admin',
            'is_active' => true
        ];

        // Match findByUsername logic
        $this->userModel->method('findByUsername')
            ->willReturn(null);
        
        $this->userModel->method('findByEmployeeId')
            ->willReturn($mockUser);

        $this->userModel->method('verifyPassword')
            ->willReturn(true);
            
        $this->shiftModel->method('findOpenByUser')
            ->willReturn(null);

        // Call loginWithCredentials instead of login
        $result = $this->service->loginWithCredentials($email, $password);

        $this->assertArrayHasKey('token', $result);
        $this->assertArrayHasKey('user', $result);
        $this->assertEquals($email, $result['user']['email']);
    }

    public function testLoginFailureWithWrongPassword()
    {
        $email = 'admin@example.com';
        $password = 'wrongpassword';
        $hashedPassword = password_hash('correctpassword', PASSWORD_BCRYPT);

        $mockUser = [
            'id' => 1,
            'name' => 'Admin',
            'email' => $email,
            'password_hash' => $hashedPassword
        ];

        $this->userModel->method('findByUsername')
            ->willReturn($mockUser);
            
        $this->userModel->method('verifyPassword')
            ->willReturn(false);

        $result = $this->service->loginWithCredentials($email, $password);
        
        $this->assertNull($result);
    }
}
