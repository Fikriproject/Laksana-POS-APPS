<?php
/**
 * Supplier Model
 */

namespace App\Models;

class Supplier extends Model
{
    protected string $table = 'suppliers';

    public function findAllActive(): array
    {
        // MySQL Boolean 1/0
        $stmt = $this->db->prepare(
            "SELECT * FROM {$this->table} WHERE is_active = 1 ORDER BY name"
        );
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function search(string $query): array
    {
        $searchTerm = "%{$query}%";
        // MySQL LIKE
        $stmt = $this->db->prepare(
            "SELECT * FROM {$this->table} 
             WHERE name LIKE :query AND is_active = 1
             ORDER BY name
             LIMIT 20"
        );
        $stmt->execute(['query' => $searchTerm]);
        
        return $stmt->fetchAll();
    }
}
