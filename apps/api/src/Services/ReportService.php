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
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as total_transactions,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_revenue,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN (total_amount - tax_amount) ELSE 0 END), 0) as net_sales,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN tax_amount ELSE 0 END), 0) as total_tax,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN discount_amount ELSE 0 END), 0) as total_discounts,
                COALESCE(AVG(CASE WHEN status = 'completed' THEN total_amount END), 0) as avg_order_value,
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
        $dateFormat = $this->getDateFormat($groupBy);
        
        $stmt = $this->db->prepare(
            "SELECT 
                {$dateFormat} as date,
                COUNT(*) as transactions,
                COALESCE(SUM(total_amount), 0) as revenue
             FROM orders
             WHERE created_at BETWEEN :start_date AND :end_date AND status = 'completed'
             GROUP BY 1
             ORDER BY 1"
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

    private function getDateFormat(string $groupBy, string $column = 'created_at'): string 
    {
        $driver = $this->db->getAttribute(PDO::ATTR_DRIVER_NAME);
        
        if ($driver === 'pgsql') {
            return match($groupBy) {
                'hour' => "TO_CHAR({$column}, 'YYYY-MM-DD HH24:00')",
                'day' => "TO_CHAR({$column}, 'YYYY-MM-DD')",
                'week' => "TO_CHAR({$column}, 'IYYY-IW')", // ISO Year-Week
                'month' => "TO_CHAR({$column}, 'YYYY-MM')",
                'year' => "TO_CHAR({$column}, 'YYYY')",
                default => "TO_CHAR({$column}, 'YYYY-MM-DD')"
            };
        }

        // Default to MySQL
        return match($groupBy) {
            'hour' => "DATE_FORMAT({$column}, '%Y-%m-%d %H:00')",
            'day' => "DATE_FORMAT({$column}, '%Y-%m-%d')",
            'week' => "DATE_FORMAT({$column}, '%x-%v')", // Year-Week standard
            'month' => "DATE_FORMAT({$column}, '%Y-%m')",
            'year' => "DATE_FORMAT({$column}, '%Y')",
            default => "DATE_FORMAT({$column}, '%Y-%m-%d')"
        };
    }

    // ... (Skipping unaffected methods) ...

    public function getInventoryStatus(): array
    {
        // COUNT(CASE WHEN ...) is standard SQL
        // Fix: Remove is_active = 1 for Postgres compatibility
        $stmt = $this->db->prepare(
            "SELECT 
                COUNT(*) as total_products,
                COUNT(CASE WHEN is_active = true THEN 1 END) as active_products,
                COUNT(CASE WHEN stock_quantity <= low_stock_threshold THEN 1 END) as low_stock_products,
                COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock_products,
                COALESCE(SUM(stock_quantity * price), 0) as total_inventory_value
             FROM products"
        );
        $stmt->execute();
        
        return $stmt->fetch();
    }

    public function getEmployeeTransactions(string $employeeId, string $startDate, string $endDate): array
    {
        // 1. Fetch Orders
        $stmt = $this->db->prepare(
            "SELECT 
                o.id, o.created_at as transaction_date, o.order_number, 
                o.total_amount, o.subtotal, o.tax_amount,
                o.discount_amount, o.payment_method
             FROM orders o
             WHERE o.user_id = :employee_id 
                AND o.created_at BETWEEN :start_date AND :end_date
                AND o.status = 'completed'
             ORDER BY o.created_at DESC"
        );
        $stmt->execute([
            'employee_id' => $employeeId,
            'start_date' => $startDate,
            'end_date' => $endDate
        ]);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($orders)) {
            return [];
        }

        // 2. Fetch Items for these orders
        $orderIds = array_column($orders, 'id');
        $placeholders = implode(',', array_fill(0, count($orderIds), '?'));
        
        $stmtItems = $this->db->prepare(
            "SELECT 
                oi.order_id, oi.quantity, oi.unit_price as price, oi.subtotal,
                p.name as product_name
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id IN ($placeholders)"
        );
        $stmtItems->execute($orderIds);
        $allItems = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

        // Group items by order_id
        $itemsByOrder = [];
        foreach ($allItems as $item) {
            $itemsByOrder[$item['order_id']][] = [
                'product_name' => $item['product_name'],
                'quantity' => (int)$item['quantity'],
                'price' => (float)$item['price'],
                'subtotal' => (float)$item['subtotal']
            ];
        }

        // Attach items to orders
        $result = [];
        foreach ($orders as $order) {
            $order['total_amount'] = (float)$order['total_amount'];
            $order['subtotal'] = (float)$order['subtotal'];
            $order['tax_amount'] = (float)$order['tax_amount'];
            // Fill missing columns with defaults since not in DB
            $order['payment_amount'] = (float)$order['total_amount']; 
            $order['change_amount'] = 0;
            $order['discount_amount'] = (float)$order['discount_amount'];
            $order['items'] = $itemsByOrder[$order['id']] ?? [];
            $result[] = $order;
        }

        return $result;
    }

    public function getDailyFinancials(string $startDate, string $endDate, string $groupBy = 'day'): array
    {
        $sqlDateFormat = $this->getDateFormat($groupBy, 'o.created_at');
        $expenseDateFormat = $this->getDateFormat($groupBy, 'created_at');

        // 1. Get Revenue
        $stmtRevenue = $this->db->prepare(
            "SELECT 
                {$sqlDateFormat} as date,
                COALESCE(SUM(total_amount), 0) as revenue
             FROM orders o
             WHERE created_at BETWEEN :start_date AND :end_date AND status = 'completed'
             GROUP BY 1"
        );
        $stmtRevenue->execute(['start_date' => $startDate, 'end_date' => $endDate]);
        $revenueData = $stmtRevenue->fetchAll(PDO::FETCH_ASSOC);

        // 2. Get Expenses
        $stmtExpense = $this->db->prepare(
            "SELECT 
                {$expenseDateFormat} as date,
                COALESCE(SUM(amount), 0) as expense
             FROM expenses
             WHERE created_at BETWEEN :start_date AND :end_date
             GROUP BY 1"
        );
        $stmtExpense->execute(['start_date' => $startDate, 'end_date' => $endDate]);
        $expenseData = $stmtExpense->fetchAll(PDO::FETCH_ASSOC);

        // 3. Merge Data
        $merged = [];
        
        $findDate = function($date) use (&$merged) {
            foreach ($merged as $key => $item) {
                if ($item['date'] === $date) return $key;
            }
            return false;
        };

        foreach ($revenueData as $r) {
            $merged[] = [
                'date' => $r['date'],
                'revenue' => (float)$r['revenue'],
                'expense' => 0
            ];
        }

        foreach ($expenseData as $e) {
            $key = $findDate($e['date']);
            if ($key !== false) {
                $merged[$key]['expense'] = (float)$e['expense'];
            } else {
                $merged[] = [
                    'date' => $e['date'],
                    'revenue' => 0,
                    'expense' => (float)$e['expense']
                ];
            }
        }

        // 4. Sort by Date DESC
        usort($merged, function($a, $b) {
            return strcmp($b['date'], $a['date']); // String check works for ISO-like formats
        });

        // 5. Calculate Net Profit
        foreach ($merged as &$item) {
            $item['net_profit'] = $item['revenue'] - $item['expense'];
        }

        return $merged;
    }

    /**
     * Rekap Harian Transaksi & Kasir Lengkap (Daily Settlement & Cash Reconciliation)
     */
    public function getDailySettlement(string $date): array
    {
        // 1. Shifts pada tanggal ini
        $stmtShifts = $this->db->prepare(
            "SELECT s.*, u.full_name as user_name, u.role as user_role
             FROM shifts s
             LEFT JOIN users u ON s.user_id = u.id
             WHERE DATE(s.started_at) = :date
             ORDER BY s.started_at ASC"
        );
        $stmtShifts->execute(['date' => $date]);
        $shifts = $stmtShifts->fetchAll(PDO::FETCH_ASSOC) ?: [];

        // 2. Ringkasan Penjualan pada tanggal ini
        $stmtSales = $this->db->prepare(
            "SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(total_amount), 0) as gross_sales,
                COALESCE(SUM(discount_amount), 0) as total_discount,
                COALESCE(SUM(tax_amount), 0) as total_tax,
                COALESCE(SUM(total_amount - tax_amount), 0) as net_sales,
                COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END), 0) as cash_sales,
                COALESCE(SUM(CASE WHEN payment_method != 'cash' THEN total_amount ELSE 0 END), 0) as non_cash_sales
             FROM orders
             WHERE DATE(created_at) = :date AND status = 'completed'"
        );
        $stmtSales->execute(['date' => $date]);
        $sales = $stmtSales->fetch(PDO::FETCH_ASSOC) ?: [
            'total_orders' => 0,
            'gross_sales' => 0,
            'total_discount' => 0,
            'total_tax' => 0,
            'net_sales' => 0,
            'cash_sales' => 0,
            'non_cash_sales' => 0
        ];

        // 3. Modal Barang (HPP / COGS)
        $stmtCogs = $this->db->prepare(
            "SELECT COALESCE(SUM(oi.purchase_price * oi.quantity), 0) as total_cogs
             FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             WHERE DATE(o.created_at) = :date AND o.status = 'completed'"
        );
        $stmtCogs->execute(['date' => $date]);
        $totalCogs = (float)($stmtCogs->fetchColumn() ?: 0);

        // 4. Pengeluaran / Kas Keluar Toko pada tanggal ini
        $stmtExpenses = $this->db->prepare(
            "SELECT e.*, u.full_name as user_name
             FROM expenses e
             LEFT JOIN users u ON e.user_id = u.id
             WHERE DATE(e.created_at) = :date OR e.date = :date_only
             ORDER BY e.created_at ASC"
        );
        $stmtExpenses->execute(['date' => $date, 'date_only' => $date]);
        $expenses = $stmtExpenses->fetchAll(PDO::FETCH_ASSOC) ?: [];
        $totalExpenses = array_sum(array_column($expenses, 'amount'));

        // 5. Daftar Seluruh Transaksi / Nota Hari Ini
        $stmtOrders = $this->db->prepare(
            "SELECT o.id, o.order_number, o.created_at, o.payment_method, o.total_amount, 
                    o.discount_amount, o.tax_amount, o.amount_paid, o.status,
                    u.full_name as cashier_name
             FROM orders o
             LEFT JOIN users u ON o.user_id = u.id
             WHERE DATE(o.created_at) = :date
             ORDER BY o.created_at DESC"
        );
        $stmtOrders->execute(['date' => $date]);
        $orders = $stmtOrders->fetchAll(PDO::FETCH_ASSOC) ?: [];

        // Ambil item produk untuk masing-masing transaksi
        if (!empty($orders)) {
            $orderIds = array_column($orders, 'id');
            $inClause = implode(',', array_fill(0, count($orderIds), '?'));
            $stmtItems = $this->db->prepare(
                "SELECT order_id, product_name, quantity, unit_price, subtotal
                 FROM order_items
                 WHERE order_id IN ($inClause)"
            );
            $stmtItems->execute($orderIds);
            $items = $stmtItems->fetchAll(PDO::FETCH_ASSOC) ?: [];

            $groupedItems = [];
            foreach ($items as $item) {
                $groupedItems[$item['order_id']][] = $item;
            }

            foreach ($orders as &$order) {
                $order['items'] = $groupedItems[$order['id']] ?? [];
            }
        }

        // 6. Rekonsiliasi Kas Laci Harian
        $totalOpeningCash = array_sum(array_column($shifts, 'opening_cash'));
        $cashSales = (float)$sales['cash_sales'];
        $expectedCash = $totalOpeningCash + $cashSales - $totalExpenses;
        
        $hasClosedShift = false;
        $totalClosingCash = 0;
        foreach ($shifts as $s) {
            if ($s['status'] === 'closed' && $s['closing_cash'] !== null) {
                $hasClosedShift = true;
                $totalClosingCash += (float)$s['closing_cash'];
            }
        }
        
        $actualCash = $hasClosedShift ? $totalClosingCash : null;
        $cashDifference = $actualCash !== null ? ($actualCash - $expectedCash) : null;

        // 7. Laba Kotor & Laba Bersih
        $netSales = (float)$sales['net_sales'];
        $grossProfit = $netSales - $totalCogs;
        $netProfit = $netSales - $totalCogs - $totalExpenses;

        return [
            'date' => $date,
            'summary' => [
                'total_orders' => (int)$sales['total_orders'],
                'gross_sales' => (float)$sales['gross_sales'],
                'total_discount' => (float)$sales['total_discount'],
                'total_tax' => (float)$sales['total_tax'],
                'net_sales' => $netSales,
                'cash_sales' => $cashSales,
                'non_cash_sales' => (float)$sales['non_cash_sales'],
                'total_cogs' => $totalCogs,
                'gross_profit' => $grossProfit,
                'total_expenses' => $totalExpenses,
                'net_profit' => $netProfit
            ],
            'cash_drawer' => [
                'shifts_count' => count($shifts),
                'total_opening_cash' => $totalOpeningCash,
                'cash_sales' => $cashSales,
                'total_expenses' => $totalExpenses,
                'expected_cash' => $expectedCash,
                'actual_cash' => $actualCash,
                'cash_difference' => $cashDifference,
                'is_reconciled' => $hasClosedShift && $cashDifference == 0
            ],
            'shifts' => $shifts,
            'expenses' => $expenses,
            'orders' => $orders
        ];
    }
}
