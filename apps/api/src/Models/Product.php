<?php
/**
 * Product Model
 */

namespace App\Models;

use PDO;

class Product extends Model
{
    protected string $table = 'products';

    public function __construct(PDO $db)
    {
        parent::__construct($db);
        $this->ensureApprovalColumns();
    }

    /**
     * Pastikan kolom approval_status dan submitted_by tersedia (auto-migrasi aman MySQL & PostgreSQL)
     */
    private function ensureApprovalColumns(): void
    {
        static $checked = false;
        if ($checked) return;
        $checked = true;

        $isPg = ($this->db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'pgsql');
        if ($isPg) {
            try {
                $this->db->exec("ALTER TABLE {$this->table} ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved'");
                $this->db->exec("ALTER TABLE {$this->table} ADD COLUMN IF NOT EXISTS submitted_by VARCHAR(100) DEFAULT NULL");
            } catch (\Exception $e) {
                // Kolom sudah ada
            }
        } else {
            try {
                $this->db->exec("ALTER TABLE {$this->table} ADD COLUMN approval_status VARCHAR(20) DEFAULT 'approved'");
            } catch (\Exception $e) {
                // Kolom sudah ada
            }
            try {
                $this->db->exec("ALTER TABLE {$this->table} ADD COLUMN submitted_by VARCHAR(100) DEFAULT NULL");
            } catch (\Exception $e) {
                // Kolom sudah ada
            }
        }
    }

    public function findBySku(string $sku): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT p.*, c.name as category_name 
             FROM {$this->table} p 
             LEFT JOIN categories c ON p.category_id = c.id 
             WHERE LOWER(TRIM(p.sku)) = LOWER(TRIM(:sku))
               AND COALESCE(p.approval_status, 'approved') != 'pending'"
        );
        $stmt->execute(['sku' => $sku]);
        
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function findAllWithCategory(int $limit = 100, int $offset = 0, ?int $categoryId = null, ?bool $activeOnly = null, ?string $condition = null): array
    {
        $where = '1=1';
        $params = [];
        $isPendingFilter = ($condition === 'pending' || $condition === 'menunggu');
        
        if ($categoryId !== null) {
            $where .= ' AND p.category_id = :category_id';
            $params['category_id'] = $categoryId;
        }

        if ($isPendingFilter) {
            $where .= " AND p.approval_status = 'pending'";
        } else {
            $where .= " AND COALESCE(p.approval_status, 'approved') != 'pending'";
            if ($activeOnly !== null) {
                $isPg = ($this->db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'pgsql');
                $where .= ' AND p.is_active = :is_active';
                $params['is_active'] = $isPg ? ($activeOnly ? 'true' : 'false') : ($activeOnly ? 1 : 0);
            }

            if ($condition === 'out_of_stock' || $condition === 'habis') {
                $where .= ' AND p.stock_quantity <= 0';
            } elseif ($condition === 'low_stock' || $condition === 'sedikit') {
                $where .= ' AND p.stock_quantity > 0 AND p.stock_quantity <= COALESCE(NULLIF(p.low_stock_threshold, 0), 5)';
            } elseif ($condition === 'loss' || $condition === 'rugi') {
                $where .= ' AND p.purchase_price > 0 AND (p.price < p.purchase_price OR (p.wholesale_price > 0 AND p.wholesale_price < p.purchase_price) OR (p.reseller_price > 0 AND p.reseller_price < p.purchase_price))';
            }
        }

        $orderBy = $isPendingFilter ? 'p.created_at DESC, p.name ASC' : 'p.name';
        
        $stmt = $this->db->prepare(
            "SELECT p.*, c.name as category_name 
             FROM {$this->table} p 
             LEFT JOIN categories c ON p.category_id = c.id 
             WHERE {$where}
             ORDER BY {$orderBy} 
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

    public function countWithFilter(?int $categoryId = null, ?bool $activeOnly = null, ?string $condition = null): int
    {
        $where = '1=1';
        $params = [];
        $isPendingFilter = ($condition === 'pending' || $condition === 'menunggu');
        
        if ($categoryId !== null) {
            $where .= ' AND category_id = :category_id';
            $params['category_id'] = $categoryId;
        }

        if ($isPendingFilter) {
            $where .= " AND approval_status = 'pending'";
        } else {
            $where .= " AND COALESCE(approval_status, 'approved') != 'pending'";
            if ($activeOnly !== null) {
                $isPg = ($this->db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'pgsql');
                $where .= ' AND is_active = :is_active';
                $params['is_active'] = $isPg ? ($activeOnly ? 'true' : 'false') : ($activeOnly ? 1 : 0);
            }

            if ($condition === 'out_of_stock' || $condition === 'habis') {
                $where .= ' AND stock_quantity <= 0';
            } elseif ($condition === 'low_stock' || $condition === 'sedikit') {
                $where .= ' AND stock_quantity > 0 AND stock_quantity <= COALESCE(NULLIF(low_stock_threshold, 0), 5)';
            } elseif ($condition === 'loss' || $condition === 'rugi') {
                $where .= ' AND purchase_price > 0 AND (price < purchase_price OR (wholesale_price > 0 AND wholesale_price < purchase_price) OR (reseller_price > 0 AND reseller_price < purchase_price))';
            }
        }
        
        return $this->count($where, $params);
    }

    public function getFilterCounts(?int $categoryId = null): array
    {
        $isPg = ($this->db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'pgsql');
        $activeCheck = $isPg ? "is_active = true" : "is_active = 1";
        
        $whereApproved = "{$activeCheck} AND COALESCE(approval_status, 'approved') != 'pending'";
        $wherePending = "approval_status = 'pending'";
        $params = [];
        if ($categoryId !== null) {
            $whereApproved .= " AND category_id = :category_id";
            $wherePending .= " AND category_id = :category_id";
            $params['category_id'] = $categoryId;
        }

        $sql = "SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN stock_quantity <= 0 THEN 1 END) as out_of_stock,
            COUNT(CASE WHEN stock_quantity > 0 AND stock_quantity <= COALESCE(NULLIF(low_stock_threshold, 0), 5) THEN 1 END) as low_stock,
            COUNT(CASE WHEN purchase_price > 0 AND (price < purchase_price OR (wholesale_price > 0 AND wholesale_price < purchase_price) OR (reseller_price > 0 AND reseller_price < purchase_price)) THEN 1 END) as loss
        FROM {$this->table}
        WHERE {$whereApproved}";

        $sqlPending = "SELECT COUNT(*) as pending_count FROM {$this->table} WHERE {$wherePending}";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $counts = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

            $stmtP = $this->db->prepare($sqlPending);
            $stmtP->execute($params);
            $pendingCount = (int) ($stmtP->fetchColumn() ?? 0);

            return [
                'total' => (int) ($counts['total'] ?? 0),
                'out_of_stock' => (int) ($counts['out_of_stock'] ?? 0),
                'low_stock' => (int) ($counts['low_stock'] ?? 0),
                'loss' => (int) ($counts['loss'] ?? 0),
                'pending' => $pendingCount,
            ];
        } catch (\Exception $e) {
            return [
                'total' => 0,
                'out_of_stock' => 0,
                'low_stock' => 0,
                'loss' => 0,
                'pending' => 0,
            ];
        }
    }

    public function search(string $query, int $limit = 100, ?string $condition = null): array
    {
        $searchTerm = "%{$query}%";
        // Check driver for Case Insensitivity
        $driver = $this->db->getAttribute(PDO::ATTR_DRIVER_NAME);
        $operator = $driver === 'pgsql' ? 'ILIKE' : 'LIKE';
        $isPendingFilter = ($condition === 'pending' || $condition === 'menunggu');

        $where = "(p.name {$operator} :name_query OR p.sku {$operator} :sku_query)";
        if ($isPendingFilter) {
            $where .= " AND p.approval_status = 'pending'";
        } else {
            $where .= " AND COALESCE(p.approval_status, 'approved') != 'pending'";
            if ($condition === 'out_of_stock' || $condition === 'habis') {
                $where .= ' AND p.stock_quantity <= 0';
            } elseif ($condition === 'low_stock' || $condition === 'sedikit') {
                $where .= ' AND p.stock_quantity > 0 AND p.stock_quantity <= COALESCE(NULLIF(p.low_stock_threshold, 0), 5)';
            } elseif ($condition === 'loss' || $condition === 'rugi') {
                $where .= ' AND p.purchase_price > 0 AND (p.price < p.purchase_price OR (p.wholesale_price > 0 AND p.wholesale_price < p.purchase_price) OR (p.reseller_price > 0 AND p.reseller_price < p.purchase_price))';
            }
        }

        $stmt = $this->db->prepare(
            "SELECT p.*, c.name as category_name 
             FROM {$this->table} p 
             LEFT JOIN categories c ON p.category_id = c.id 
             WHERE {$where}
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
        $isPg = ($this->db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'pgsql');
        $activeCheck = $isPg ? "p.is_active = true" : "p.is_active = 1";
        $stmt = $this->db->prepare(
            "SELECT p.*, c.name as category_name 
             FROM {$this->table} p 
             LEFT JOIN categories c ON p.category_id = c.id 
             WHERE p.stock_quantity <= p.low_stock_threshold AND {$activeCheck} AND COALESCE(p.approval_status, 'approved') != 'pending'
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
            $params['start_date'] = strlen($startDate) <= 10 ? $startDate . ' 00:00:00' : $startDate;
            $params['end_date'] = strlen($endDate) <= 10 ? $endDate . ' 23:59:59' : $endDate;
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
