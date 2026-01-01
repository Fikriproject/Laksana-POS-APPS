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
        // Postgres Boolean true/false
        $stmt = $this->db->prepare(
            "SELECT * FROM {$this->table} WHERE is_active = true ORDER BY name"
        );
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function search(string $query): array
    {
        $searchTerm = "%{$query}%";
        // Postgres ILIKE for case-insensitive search
        $driver = $this->db->getAttribute(PDO::ATTR_DRIVER_NAME);
        $operator = $driver === 'pgsql' ? 'ILIKE' : 'LIKE';

        $stmt = $this->db->prepare(
            "SELECT * FROM {$this->table} 
             WHERE name {$operator} :query AND is_active = true
             ORDER BY name
             LIMIT 20"
        );
        $stmt->execute(['query' => $searchTerm]);
        
        return $stmt->fetchAll();
    }
}
