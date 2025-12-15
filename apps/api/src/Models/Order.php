<?php
/**
 * Order Model
 */

namespace App\Models;

use PDO;

class Order extends Model
{
    protected string $table = 'orders';

    public function findByOrderNumber(string $orderNumber): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT o.*, u.full_name as cashier_name, c.name as customer_name
             FROM {$this->table} o
             LEFT JOIN users u ON o.user_id = u.id
             LEFT JOIN customers c ON o.customer_id = c.id
             WHERE o.order_number = :order_number"
        );
        $stmt->execute(['order_number' => $orderNumber]);
        
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function findWithDetails(string $id): ?array
    {
        $order = $this->findById($id);
        if (!$order) {
            return null;
        }
        
        // Get order items
        $stmt = $this->db->prepare(
            "SELECT oi.*, p.image_url, p.sku
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = :order_id"
        );
        $stmt->execute(['order_id' => $id]);
        $order['items'] = $stmt->fetchAll();
        
        return $order;
    }

    public function findByDateRange(string $startDate, string $endDate, int $limit = 100, int $offset = 0): array
    {
        $stmt = $this->db->prepare(
            "SELECT o.*, u.full_name as cashier_name
             FROM {$this->table} o
             LEFT JOIN users u ON o.user_id = u.id
             WHERE o.created_at BETWEEN :start_date AND :end_date
             ORDER BY o.created_at DESC
             LIMIT :limit OFFSET :offset"
        );
        $stmt->bindValue(':start_date', $startDate);
        $stmt->bindValue(':end_date', $endDate);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function findByUser(string $userId, int $limit = 50): array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM {$this->table} 
             WHERE user_id = :user_id 
             ORDER BY created_at DESC 
             LIMIT :limit"
        );
        $stmt->bindValue(':user_id', $userId);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function generateOrderNumber(): string
    {
        $date = date('Ymd');
        $today = date('Y-m-d');
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) + 1 as next_number 
             FROM {$this->table} 
             WHERE created_at LIKE :today"
        );
        $stmt->execute(['today' => "$today%"]);
        $result = $stmt->fetch();
        
        return sprintf('#%s-%04d', $date, $result['next_number']);
    }

    public function updateStatus(string $orderId, string $status): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET status = :status WHERE id = :id"
        );
        
        return $stmt->execute(['status' => $status, 'id' => $orderId]);
    }

    public function getTodaySummary(): array
    {
        $today = date('Y-m-d');
        $stmt = $this->db->prepare(
            "SELECT 
                COUNT(*) as total_transactions,
                COALESCE(SUM(total_amount), 0) as total_revenue,
                COALESCE(SUM(total_amount - tax_amount), 0) as net_sales,
                COALESCE(SUM(tax_amount), 0) as total_tax,
                COALESCE(SUM(discount_amount), 0) as total_discounts,
                COALESCE(
                    (SELECT SUM(oi.purchase_price * oi.quantity)
                     FROM order_items oi
                     JOIN orders o2 ON oi.order_id = o2.id
                     WHERE o2.created_at LIKE :today_sub AND o2.status = 'completed')
                , 0) as total_cogs,
                COALESCE(AVG(total_amount), 0) as avg_order_value,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
                COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_orders
             FROM {$this->table}
             WHERE created_at LIKE :today_main"
        );
        $stmt->execute(['today_sub' => "$today%", 'today_main' => "$today%"]);
        
        return $stmt->fetch();
    }

    public function getOverallStats(): array
    {
        $stmt = $this->db->prepare(
            "SELECT 
                COUNT(*) as total_transactions,
                COALESCE(SUM(total_amount), 0) as total_revenue,
                COALESCE(AVG(total_amount), 0) as avg_order_value
             FROM {$this->table}
             WHERE status = 'completed'"
        );
        $stmt->execute();
        
        return $stmt->fetch();
    }
}
