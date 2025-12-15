<?php
/**
 * Inventory Log Model
 */

namespace App\Models;

use PDO;

class InventoryLog extends Model
{
    protected string $table = 'inventory_logs';

    public function findWithDetails(int $limit = 100, int $offset = 0, ?string $type = null): array
    {
        $where = '1=1';
        $params = [];
        
        if ($type !== null) {
            $where .= ' AND il.type = :type';
            $params['type'] = $type;
        }
        
        $stmt = $this->db->prepare(
            "SELECT il.*, p.name as product_name, p.sku, p.image_url, 
                    u.full_name as user_name, s.name as supplier_name
             FROM {$this->table} il
             LEFT JOIN products p ON il.product_id = p.id
             LEFT JOIN users u ON il.user_id = u.id
             LEFT JOIN suppliers s ON il.supplier_id = s.id
             WHERE {$where}
             ORDER BY il.created_at DESC
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

    public function findByProduct(string $productId, int $limit = 50): array
    {
        $stmt = $this->db->prepare(
            "SELECT il.*, u.full_name as user_name, s.name as supplier_name
             FROM {$this->table} il
             LEFT JOIN users u ON il.user_id = u.id
             LEFT JOIN suppliers s ON il.supplier_id = s.id
             WHERE il.product_id = :product_id
             ORDER BY il.created_at DESC
             LIMIT :limit"
        );
        $stmt->bindValue(':product_id', $productId);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function findByDateRange(string $startDate, string $endDate, ?string $type = null): array
    {
        $where = 'il.created_at BETWEEN :start_date AND :end_date';
        $params = ['start_date' => $startDate, 'end_date' => $endDate];
        
        if ($type !== null) {
            $where .= ' AND il.type = :type';
            $params['type'] = $type;
        }
        
        $stmt = $this->db->prepare(
            "SELECT il.*, p.name as product_name, p.sku, u.full_name as user_name
             FROM {$this->table} il
             LEFT JOIN products p ON il.product_id = p.id
             LEFT JOIN users u ON il.user_id = u.id
             WHERE {$where}
             ORDER BY il.created_at DESC"
        );
        $stmt->execute($params);
        
        return $stmt->fetchAll();
    }

    public function recordStockChange(
        string $productId,
        string $userId,
        string $type,
        int $quantityChange,
        int $quantityAfter,
        ?string $supplierId = null,
        ?string $referenceNumber = null,
        ?string $notes = null
    ): string {
        return $this->create([
            'product_id' => $productId,
            'user_id' => $userId,
            'supplier_id' => $supplierId,
            'type' => $type,
            'quantity_change' => $quantityChange,
            'quantity_after' => $quantityAfter,
            'reference_number' => $referenceNumber,
            'notes' => $notes,
            'status' => 'completed'
        ]);
    }
}
