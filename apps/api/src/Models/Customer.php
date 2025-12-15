<?php
/**
 * Customer Model
 */

namespace App\Models;

class Customer extends Model
{
    protected string $table = 'customers';

    public function search(string $query): array
    {
        $searchTerm = "%{$query}%";
        // MySQL uses LIKE instead of ILIKE
        $stmt = $this->db->prepare(
            "SELECT * FROM {$this->table} 
             WHERE name LIKE :query OR phone LIKE :query OR email LIKE :query
             ORDER BY name
             LIMIT 20"
        );
        $stmt->execute(['query' => $searchTerm]);
        
        return $stmt->fetchAll();
    }

    public function findByPhone(string $phone): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM {$this->table} WHERE phone = :phone"
        );
        $stmt->execute(['phone' => $phone]);
        
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function addLoyaltyPoints(string $customerId, int $points): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} 
             SET loyalty_points = loyalty_points + :points 
             WHERE id = :id"
        );
        
        return $stmt->execute(['points' => $points, 'id' => $customerId]);
    }
}
