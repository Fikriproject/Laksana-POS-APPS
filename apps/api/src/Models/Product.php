<?php
/**
 * Product Model
 */

namespace App\Models;

use PDO;

class Product extends Model
{
    protected string $table = 'products';

    public function findBySku(string $sku): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT p.*, c.name as category_name 
             FROM {$this->table} p 
             LEFT JOIN categories c ON p.category_id = c.id 
             WHERE p.sku = :sku"
        );
        $stmt->execute(['sku' => $sku]);
        
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function findAllWithCategory(int $limit = 100, int $offset = 0, ?int $categoryId = null, ?bool $activeOnly = null): array
    {
        $where = '1=1';
        $params = [];
        
        if ($categoryId !== null) {
            $where .= ' AND p.category_id = :category_id';
            $params['category_id'] = $categoryId;
        }
        
        if ($activeOnly !== null) {
            $where .= ' AND p.is_active = :is_active';
            $params['is_active'] = $activeOnly ? 'true' : 'false'; // Postgres uses strings 'true'/'false' or boolean type
        }
        
        $stmt = $this->db->prepare(
            "SELECT p.*, c.name as category_name 
             FROM {$this->table} p 
             LEFT JOIN categories c ON p.category_id = c.id 
             WHERE {$where}
             ORDER BY p.name 
             LIMIT :limit OFFSET :offset"
        );
        
        foreach ($params as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function search(string $query, int $limit = 20): array
    {
        $searchTerm = "%{$query}%";
        // Check driver for Case Insensitivity
        $driver = $this->db->getAttribute(PDO::ATTR_DRIVER_NAME);
        $operator = $driver === 'pgsql' ? 'ILIKE' : 'LIKE';

        $stmt = $this->db->prepare(
            "SELECT p.*, c.name as category_name 
             FROM {$this->table} p 
             LEFT JOIN categories c ON p.category_id = c.id 
             WHERE (p.name {$operator} :name_query OR p.sku {$operator} :sku_query)
             ORDER BY p.name 
             LIMIT :limit"
        );
        $stmt->bindValue(':name_query', $searchTerm);
        $stmt->bindValue(':sku_query', $searchTerm);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function getLowStock(int $limit = 20): array
    {
        $stmt = $this->db->prepare(
            "SELECT p.*, c.name as category_name 
             FROM {$this->table} p 
             LEFT JOIN categories c ON p.category_id = c.id 
             WHERE p.stock_quantity <= p.low_stock_threshold AND p.is_active = true
             ORDER BY p.stock_quantity ASC 
             LIMIT :limit"
        );
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function updateStock(string $productId, int $quantityChange): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} 
             SET stock_quantity = stock_quantity + :change
             WHERE id = :id"
        );
        
        return $stmt->execute(['change' => $quantityChange, 'id' => $productId]);
    }

    public function toggleActive(string $productId): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} 
             SET is_active = NOT is_active
             WHERE id = :id"
        );
        
        return $stmt->execute(['id' => $productId]);
    }

    public function getTopSelling(int $limit = 10, string $startDate = null, string $endDate = null): array
    {
        $dateFilter = '';
        $params = [];
        
        if ($startDate && $endDate) {
            $dateFilter = 'AND o.created_at BETWEEN :start_date AND :end_date';
            $params['start_date'] = $startDate;
            $params['end_date'] = $endDate;
        }
        
        $stmt = $this->db->prepare(
            "SELECT p.id, p.name, p.sku, p.price, p.purchase_price, p.image_url, c.name as category_name,
                    SUM(oi.quantity) as total_sold, SUM(oi.subtotal) as total_revenue
             FROM {$this->table} p
             JOIN order_items oi ON p.id = oi.product_id
             JOIN orders o ON oi.order_id = o.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE o.status = 'completed' {$dateFilter}
             GROUP BY p.id, p.name, p.sku, p.price, p.purchase_price, p.image_url, c.name
             ORDER BY total_sold DESC
             LIMIT :limit"
        );
        
        foreach ($params as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
}
