<?php
/**
 * Shift Service
 */

namespace App\Services;

use App\Models\Shift;
use App\Models\Order;

class ShiftService
{
    private Shift $shiftModel;
    private Order $orderModel;

    public function __construct(Shift $shiftModel, Order $orderModel)
    {
        $this->shiftModel = $shiftModel;
        $this->orderModel = $orderModel;
    }

    public function getCurrentShift(string $userId): ?array
    {
        $shift = $this->shiftModel->findOpenByUser($userId);
        
        if ($shift) {
            $shift['duration'] = $this->shiftModel->getShiftDuration($shift['id']);
        }
        
        return $shift;
    }

    public function openShift(string $userId, float $openingCash = 0): array
    {
        // Check if user already has an open shift
        $existingShift = $this->shiftModel->findOpenByUser($userId);
        
        if ($existingShift) {
            throw new \Exception('User already has an open shift');
        }
        
        $shiftId = $this->shiftModel->openShift($userId, $openingCash);
        
        return $this->shiftModel->findById($shiftId);
    }

    public function closeShift(string $shiftId, string $userId, float $closingCash): array
    {
        $shift = $this->shiftModel->findById($shiftId);
        
        if (!$shift) {
            throw new \Exception('Shift not found');
        }
        
        if ($shift['user_id'] !== $userId) {
            throw new \Exception('Cannot close another user\'s shift');
        }
        
        if ($shift['status'] === 'closed') {
            throw new \Exception('Shift is already closed');
        }
        
        $this->shiftModel->closeShift($shiftId, $closingCash);
        
        // Get shift summary
        return $this->getShiftSummary($shiftId);
    }

    public function getShiftSummary(string $shiftId): array
    {
        $shift = $this->shiftModel->findById($shiftId);
        
        if (!$shift) {
            throw new \Exception('Shift not found');
        }
        
        // Get orders for this shift
        $orders = $this->orderModel->findAll(1000, 0);
        $shiftOrders = array_filter($orders, fn($o) => $o['shift_id'] === $shiftId);
        
        $summary = [
            'shift' => $shift,
            'total_orders' => count($shiftOrders),
            'total_sales' => array_sum(array_column($shiftOrders, 'total_amount')),
            'payment_breakdown' => []
        ];
        
        // Calculate payment breakdown
        $paymentMethods = ['cash' => 0, 'card' => 0, 'e-wallet' => 0, 'other' => 0];
        foreach ($shiftOrders as $order) {
            $method = $order['payment_method'] ?? 'other';
            $paymentMethods[$method] = ($paymentMethods[$method] ?? 0) + $order['total_amount'];
        }
        $summary['payment_breakdown'] = $paymentMethods;
        
        // Calculate expected vs actual cash
        $summary['expected_cash'] = $shift['opening_cash'] + ($paymentMethods['cash'] ?? 0);
        $summary['actual_cash'] = $shift['closing_cash'];
        $summary['cash_difference'] = ($shift['closing_cash'] ?? 0) - $summary['expected_cash'];
        
        return $summary;
    }
}
