<?php
/**
 * Shift Service
 * Mengelola pembukaan kasir, penutupan kasir, sinkronisasi uang fisik laci, dan rekapan shift
 */

namespace App\Services;

use App\Models\Shift;
use App\Models\Order;
use PDO;

class ShiftService
{
    private Shift $shiftModel;
    private Order $orderModel;
    private PDO $db;

    public function __construct(Shift $shiftModel, Order $orderModel)
    {
        $this->shiftModel = $shiftModel;
        $this->orderModel = $orderModel;
        $this->db = $shiftModel->getDb();
    }

    /**
     * Mendapatkan shift kasir yang sedang aktif (open) beserta metrik langsung (live sales, cash in drawer)
     */
    public function getCurrentShift(?string $userId = null): ?array
    {
        $shift = $this->shiftModel->findCurrentOpen();
        if (!$shift && $userId) {
            $shift = $this->shiftModel->findOpenByUser($userId);
        }
        
        if (!$shift) {
            return null;
        }

        $shiftId = $shift['id'];
        $startedAt = $shift['started_at'];

        // Ambil metrik penjualan live selama shift ini berjalan
        $stmtSales = $this->db->prepare(
            "SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(total_amount), 0) as total_sales,
                COALESCE(SUM(discount_amount), 0) as total_discount,
                COALESCE(SUM(tax_amount), 0) as total_tax,
                COALESCE(SUM(total_amount - tax_amount), 0) as net_sales,
                COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END), 0) as cash_sales,
                COALESCE(SUM(CASE WHEN payment_method != 'cash' THEN total_amount ELSE 0 END), 0) as non_cash_sales
             FROM orders 
             WHERE (shift_id = :shift_id OR (created_at >= :started_at AND shift_id IS NULL)) 
               AND status = 'completed'"
        );
        $stmtSales->execute([
            'shift_id' => $shiftId,
            'started_at' => $startedAt
        ]);
        $sales = $stmtSales->fetch(PDO::FETCH_ASSOC) ?: [
            'total_orders' => 0,
            'total_sales' => 0,
            'total_discount' => 0,
            'total_tax' => 0,
            'net_sales' => 0,
            'cash_sales' => 0,
            'non_cash_sales' => 0
        ];

        // Ambil pengeluaran / kas keluar selama shift berlangsung
        $stmtExpenses = $this->db->prepare(
            "SELECT COALESCE(SUM(amount), 0) as total_expenses
             FROM expenses 
             WHERE created_at >= :started_at"
        );
        $stmtExpenses->execute(['started_at' => $startedAt]);
        $totalExpenses = (float)($stmtExpenses->fetchColumn() ?: 0);

        $openingCash = (float)($shift['opening_cash'] ?? 0);
        $cashSales = (float)($sales['cash_sales'] ?? 0);
        $expectedCash = $openingCash + $cashSales - $totalExpenses;

        $shift['duration'] = $this->shiftModel->getShiftDuration($shiftId);
        $shift['opening_cash'] = $openingCash;
        $shift['total_orders'] = (int)$sales['total_orders'];
        $shift['total_sales'] = (float)$sales['total_sales'];
        $shift['net_sales'] = (float)$sales['net_sales'];
        $shift['cash_sales'] = $cashSales;
        $shift['non_cash_sales'] = (float)$sales['non_cash_sales'];
        $shift['total_expenses'] = $totalExpenses;
        $shift['expected_cash'] = $expectedCash;

        return $shift;
    }

    /**
     * Membuka shift kasir baru dengan modal kas awal di laci
     */
    public function openShift(string $userId, float $openingCash = 0): array
    {
        // Cek jika sudah ada shift yang sedang terbuka di toko
        $existingShift = $this->shiftModel->findCurrentOpen();
        if ($existingShift) {
            $openedBy = $existingShift['user_name'] ?? 'Kasir';
            throw new \Exception("Masih ada shift kasir yang aktif (dibuka oleh {$openedBy}). Harap tutup shift sebelumnya terlebih dahulu.");
        }
        
        $shiftId = $this->shiftModel->openShift($userId, $openingCash);
        
        return $this->getCurrentShift($userId);
    }

    /**
     * Menutup shift kasir dan mencocokkan uang fisik laci dengan data sistem
     */
    public function closeShift(string $shiftId, string $userId, float $closingCash, ?string $userRole = null): array
    {
        $shift = $this->shiftModel->getShiftWithUser($shiftId);
        
        if (!$shift) {
            throw new \Exception('Data shift kasir tidak ditemukan.');
        }
        
        if ($shift['status'] === 'closed') {
            throw new \Exception('Shift kasir ini sudah ditutup sebelumnya.');
        }

        // Simpan waktu selesai dan nominal uang fisik di laci
        $this->shiftModel->closeShift($shiftId, $closingCash);
        
        // Buat dan kembalikan ringkasan tutup buku shift (Z-Report)
        return $this->getShiftSummary($shiftId);
    }

    /**
     * Menghasilkan ringkasan lengkap shift (Z-Report): omset, modal awal, kas masuk, kas keluar, selisih uang, laba
     */
    public function getShiftSummary(string $shiftId): array
    {
        $shift = $this->shiftModel->getShiftWithUser($shiftId);
        
        if (!$shift) {
            throw new \Exception('Shift tidak ditemukan.');
        }

        $startedAt = $shift['started_at'];
        $endedAt = $shift['ended_at'] ?: date('Y-m-d H:i:s');

        // 1. Data Transaksi Penjualan Shift
        $stmtOrders = $this->db->prepare(
            "SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(total_amount), 0) as total_sales,
                COALESCE(SUM(discount_amount), 0) as total_discount,
                COALESCE(SUM(tax_amount), 0) as total_tax,
                COALESCE(SUM(total_amount - tax_amount), 0) as net_sales,
                COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END), 0) as cash_sales,
                COALESCE(SUM(CASE WHEN payment_method != 'cash' THEN total_amount ELSE 0 END), 0) as non_cash_sales
             FROM orders 
             WHERE (shift_id = :shift_id OR (created_at >= :started_at AND created_at <= :ended_at AND shift_id IS NULL)) 
               AND status = 'completed'"
        );
        $stmtOrders->execute([
            'shift_id' => $shiftId,
            'started_at' => $startedAt,
            'ended_at' => $endedAt
        ]);
        $sales = $stmtOrders->fetch(PDO::FETCH_ASSOC) ?: [];

        // 2. Data Modal Barang (HPP / COGS)
        $stmtCogs = $this->db->prepare(
            "SELECT COALESCE(SUM(oi.purchase_price * oi.quantity), 0) as total_cogs
             FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             WHERE (o.shift_id = :shift_id OR (o.created_at >= :started_at AND o.created_at <= :ended_at AND o.shift_id IS NULL))
               AND o.status = 'completed'"
        );
        $stmtCogs->execute([
            'shift_id' => $shiftId,
            'started_at' => $startedAt,
            'ended_at' => $endedAt
        ]);
        $totalCogs = (float)($stmtCogs->fetchColumn() ?: 0);

        // 3. Pengeluaran / Kas Keluar Selama Shift
        $stmtExpenses = $this->db->prepare(
            "SELECT e.*, u.full_name as user_name
             FROM expenses e
             LEFT JOIN users u ON e.user_id = u.id
             WHERE e.created_at >= :started_at AND e.created_at <= :ended_at
             ORDER BY e.created_at ASC"
        );
        $stmtExpenses->execute([
            'started_at' => $startedAt,
            'ended_at' => $endedAt
        ]);
        $expenseList = $stmtExpenses->fetchAll(PDO::FETCH_ASSOC) ?: [];
        $totalExpenses = array_sum(array_column($expenseList, 'amount'));

        // 4. Kalkulasi Kas Laci
        $openingCash = (float)($shift['opening_cash'] ?? 0);
        $cashSales = (float)($sales['cash_sales'] ?? 0);
        $nonCashSales = (float)($sales['non_cash_sales'] ?? 0);
        $totalSales = (float)($sales['total_sales'] ?? 0);
        $netSales = (float)($sales['net_sales'] ?? 0);
        
        $expectedCash = $openingCash + $cashSales - $totalExpenses;
        $actualCash = $shift['closing_cash'] !== null ? (float)$shift['closing_cash'] : $expectedCash;
        $cashDifference = $actualCash - $expectedCash;

        // 5. Kalkulasi Keuntungan
        $grossProfit = $netSales - $totalCogs;
        $netProfit = $netSales - $totalCogs - $totalExpenses;

        return [
            'shift' => $shift,
            'cash_drawer' => [
                'opening_cash' => $openingCash,
                'cash_sales' => $cashSales,
                'non_cash_sales' => $nonCashSales,
                'total_expenses' => $totalExpenses,
                'expected_cash' => $expectedCash,
                'actual_cash' => $actualCash,
                'cash_difference' => $cashDifference,
                'status' => $cashDifference == 0 ? 'balanced' : ($cashDifference < 0 ? 'shortage' : 'overage')
            ],
            'sales_summary' => [
                'total_orders' => (int)($sales['total_orders'] ?? 0),
                'gross_sales' => $totalSales,
                'total_discount' => (float)($sales['total_discount'] ?? 0),
                'total_tax' => (float)($sales['total_tax'] ?? 0),
                'net_sales' => $netSales,
                'total_cogs' => $totalCogs,
                'gross_profit' => $grossProfit,
                'total_expenses' => $totalExpenses,
                'net_profit' => $netProfit
            ],
            'expenses' => $expenseList
        ];
    }
}
