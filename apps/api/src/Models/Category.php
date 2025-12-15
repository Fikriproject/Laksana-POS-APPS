<?php
/**
 * Category Model
 */

namespace App\Models;

class Category extends Model
{
    protected string $table = 'categories';
    protected string $primaryKey = 'id';

    public function findBySlug(string $slug): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM {$this->table} WHERE slug = :slug"
        );
        $stmt->execute(['slug' => $slug]);
        
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function findAllActive(): array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM {$this->table} WHERE is_active = true ORDER BY name"
        );
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function getWithProductCount(): array
    {
        $stmt = $this->db->prepare(
            "SELECT c.*, COUNT(p.id) as product_count
             FROM {$this->table} c
             LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
             WHERE c.is_active = true
             GROUP BY c.id
             ORDER BY c.name"
        );
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
}
