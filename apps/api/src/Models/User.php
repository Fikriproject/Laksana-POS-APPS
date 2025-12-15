<?php
/**
 * User Model
 */

namespace App\Models;

use PDO;

class User extends Model
{
    protected string $table = 'users';

    public function findByUsername(string $username): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM {$this->table} WHERE username = :username AND is_active = true"
        );
        $stmt->execute(['username' => $username]);
        
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function findByEmployeeId(string $employeeId): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM {$this->table} WHERE employee_id = :employee_id AND is_active = true"
        );
        $stmt->execute(['employee_id' => $employeeId]);
        
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function findByPin(string $pin): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM {$this->table} WHERE pin_code = :pin AND is_active = true"
        );
        $stmt->execute(['pin' => $pin]);
        
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function findByRole(string $role): array
    {
        $stmt = $this->db->prepare(
            "SELECT id, username, employee_id, full_name, email, role, avatar_url, is_active, created_at 
             FROM {$this->table} WHERE role = :role ORDER BY full_name"
        );
        $stmt->execute(['role' => $role]);
        
        return $stmt->fetchAll();
    }

    public function createUser(array $data): string
    {
        $data['password_hash'] = password_hash($data['password'], PASSWORD_BCRYPT);
        unset($data['password']);
        
        return $this->create($data);
    }

    public function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    public function updatePassword(string $userId, string $newPassword): bool
    {
        $hash = password_hash($newPassword, PASSWORD_BCRYPT);
        
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET password_hash = :hash, updated_at = CURRENT_TIMESTAMP WHERE id = :id"
        );
        
        return $stmt->execute(['hash' => $hash, 'id' => $userId]);
    }

    public function updatePin(string $userId, string $pin): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET pin_code = :pin, updated_at = CURRENT_TIMESTAMP WHERE id = :id"
        );
        
        return $stmt->execute(['pin' => $pin, 'id' => $userId]);
    }
    public function findAllWithStats(): array
    {
        $sql = "SELECT u.id, u.username, u.full_name, u.email, u.role, u.employee_id, u.is_active, u.created_at,
                (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) as total_transactions
                FROM {$this->table} u
                ORDER BY u.full_name ASC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function update(string $id, array $data): bool
    {
        if (isset($data['password'])) {
            $data['password_hash'] = password_hash($data['password'], PASSWORD_BCRYPT);
            unset($data['password']);
        }

        return parent::update($id, $data);
    }
}
