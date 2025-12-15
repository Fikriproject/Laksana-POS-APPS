<?php
/**
 * Report Service
 */

namespace App\Services;

use PDO;

class ReportService
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function getSalesSummary(string $startDate, string $endDate): array
    {
        $stmt = $this->db->prepare(
            "SELECT 
                COUNT(*) as total_transactions,
                COALESCE(SUM(total_amount), 0) as total_revenue,
                COALESCE(SUM(tax_amount), 0) as total_tax,
                COALESCE(SUM(discount_amount), 0) as total_discounts,
                COALESCE(AVG(total_amount), 0) as avg_order_value,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
                COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_orders
             FROM orders
             WHERE created_at BETWEEN :start_date AND :end_date"
        );
        $stmt->execute(['start_date' => $startDate, 'end_date' => $endDate]);
        
        return $stmt->fetch();
    }

    public function getSalesByDate(string $startDate, string $endDate, string $groupBy = 'day'): array
    {
        // MySQL DATE_FORMAT instead of TO_CHAR
        $dateFormat = match($groupBy) {
            'hour' => "DATE_FORMAT(created_at, '%Y-%m-%d %H:00')",
            'day' => "DATE_FORMAT(created_at, '%Y-%m-%d')",
            'week' => "DATE_FORMAT(created_at, '%Y-%u')", // Week of year
            'month' => "DATE_FORMAT(created_at, '%Y-%m')",
            default => "DATE_FORMAT(created_at, '%Y-%m-%d')"
        };
        
        $stmt = $this->db->prepare(
            "SELECT 
                {$dateFormat} as date,
                COUNT(*) as transactions,
                COALESCE(SUM(total_amount), 0) as revenue
             FROM orders
             WHERE created_at BETWEEN :start_date AND :end_date AND status = 'completed'
             GROUP BY date
             ORDER BY date"
        );
        $stmt->execute(['start_date' => $startDate, 'end_date' => $endDate]);
        
        return $stmt->fetchAll();
    }

    public function getSalesByCategory(string $startDate, string $endDate): array
    {
        $stmt = $this->db->prepare(
            "SELECT 
                c.name as category,
                COUNT(DISTINCT o.id) as transactions,
                SUM(oi.quantity) as items_sold,
                COALESCE(SUM(oi.subtotal), 0) as revenue
             FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             JOIN products p ON oi.product_id = p.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE o.created_at BETWEEN :start_date AND :end_date AND o.status = 'completed'
             GROUP BY c.id, c.name
             ORDER BY revenue DESC"
        );
        $stmt->execute(['start_date' => $startDate, 'end_date' => $endDate]);
        
        return $stmt->fetchAll();
    }

    public function getSalesByPaymentMethod(string $startDate, string $endDate): array
    {
        $stmt = $this->db->prepare(
            "SELECT 
                payment_method,
                COUNT(*) as transactions,
                COALESCE(SUM(total_amount), 0) as revenue
             FROM orders
             WHERE created_at BETWEEN :start_date AND :end_date AND status = 'completed'
             GROUP BY payment_method
             ORDER BY revenue DESC"
        );
        $stmt->execute(['start_date' => $startDate, 'end_date' => $endDate]);
        
        return $stmt->fetchAll();
    }

    public function getTopProducts(string $startDate, string $endDate, int $limit = 10): array
    {
        $stmt = $this->db->prepare(
            "SELECT 
                p.id, p.name, p.sku, p.price, p.image_url,
                c.name as category,
                SUM(oi.quantity) as total_sold,
                COALESCE(SUM(oi.subtotal), 0) as total_revenue
             FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             JOIN products p ON oi.product_id = p.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE o.created_at BETWEEN :start_date AND :end_date AND o.status = 'completed'
             GROUP BY p.id, p.name, p.sku, p.price, p.image_url, c.name
             ORDER BY total_sold DESC
             LIMIT :limit"
        );
        $stmt->bindValue(':start_date', $startDate);
        $stmt->bindValue(':end_date', $endDate);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function getEmployeePerformance(string $startDate, string $endDate): array
    {
        $stmt = $this->db->prepare(
            "SELECT 
                u.id, u.full_name, u.employee_id, u.avatar_url,
                COUNT(o.id) as transactions,
                COALESCE(SUM(o.total_amount), 0) as total_sales,
                COALESCE(AVG(o.total_amount), 0) as avg_sale
             FROM users u
             LEFT JOIN orders o ON u.id = o.user_id 
                AND o.created_at BETWEEN :start_date AND :end_date
                AND o.status = 'completed'
             WHERE u.role IN ('cashier', 'admin')
             GROUP BY u.id, u.full_name, u.employee_id, u.avatar_url
             ORDER BY total_sales DESC"
        );
        $stmt->execute(['start_date' => $startDate, 'end_date' => $endDate]);
        
        return $stmt->fetchAll();
    }

    public function getInventoryStatus(): array
    {
        $stmt = $this->db->prepare(
            "SELECT 
                COUNT(*) as total_products,
                COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_products,
                COUNT(CASE WHEN stock_quantity <= low_stock_threshold THEN 1 END) as low_stock_products,
                COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock_products,
                COALESCE(SUM(stock_quantity * price), 0) as total_inventory_value
             FROM products"
        );
        $stmt->execute();
        
        return $stmt->fetch();
    }
}
