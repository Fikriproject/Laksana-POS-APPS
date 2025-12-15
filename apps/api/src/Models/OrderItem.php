<?php
/**
 * Order Item Model
 */

namespace App\Models;

class OrderItem extends Model
{
    protected string $table = 'order_items';

    public function findByOrder(string $orderId): array
    {
        $stmt = $this->db->prepare(
            "SELECT oi.*, p.image_url, p.sku
             FROM {$this->table} oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = :order_id"
        );
        $stmt->execute(['order_id' => $orderId]);
        
        return $stmt->fetchAll();
    }

    public function createBatch(array $items): bool
    {
        $stmt = $this->db->prepare(
            "INSERT INTO {$this->table} 
             (order_id, product_id, product_name, unit_price, quantity, subtotal) 
             VALUES (:order_id, :product_id, :product_name, :unit_price, :quantity, :subtotal)"
        );
        
        foreach ($items as $item) {
            $stmt->execute($item);
        }
        
        return true;
    }
}
