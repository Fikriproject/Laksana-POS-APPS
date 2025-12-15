<?php
/**
 * Order Service
 */

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\InventoryLog;
use PDO;

class OrderService
{
    private Order $orderModel;
    private OrderItem $orderItemModel;
    private Product $productModel;
    private InventoryLog $inventoryLogModel;
    private PDO $db;

    public function __construct(
        Order $orderModel,
        OrderItem $orderItemModel,
        Product $productModel,
        InventoryLog $inventoryLogModel,
        PDO $db
    ) {
        $this->orderModel = $orderModel;
        $this->orderItemModel = $orderItemModel;
        $this->productModel = $productModel;
        $this->inventoryLogModel = $inventoryLogModel;
        $this->db = $db;
    }

    public function createOrder(
        string $userId,
        array $items,
        string $paymentMethod,
        ?string $customerId = null,
        ?string $shiftId = null,
        float $discountAmount = 0,
        ?string $notes = null,
        float $amountPaid = 0,
        float $taxAmount = 0
    ): array {
        $this->db->beginTransaction();
        
        try {
            // Calculate totals
            $subtotal = 0;
            $orderItems = [];
            
            foreach ($items as $item) {
                $product = $this->productModel->findById($item['product_id']);
                
                if (!$product) {
                    throw new \Exception("Product not found: {$item['product_id']}");
                }
                
                if ($product['stock_quantity'] < $item['quantity']) {
                    throw new \Exception("Insufficient stock for: {$product['name']}");
                }
                
                $itemSubtotal = $product['price'] * $item['quantity'];
                $subtotal += $itemSubtotal;
                
                $orderItems[] = [
                    'product_id' => $product['id'],
                    'product_name' => $product['name'],
                    'unit_price' => $product['price'],
                    'purchase_price' => $product['purchase_price'] ?? 0,
                    'quantity' => $item['quantity'],
                    'subtotal' => $itemSubtotal
                ];
            }
            
            // Calculate total
            $totalAmount = $subtotal + $taxAmount - $discountAmount;
            
            // Generate order number
            $orderNumber = $this->orderModel->generateOrderNumber();
            
            // Create order
            $orderId = $this->orderModel->create([
                'order_number' => $orderNumber,
                'user_id' => $userId,
                'customer_id' => $customerId,
                'shift_id' => $shiftId,
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'discount_amount' => $discountAmount,
                'total_amount' => $totalAmount,
                'payment_method' => $paymentMethod,
                'status' => 'completed',
                'notes' => $notes,
                'amount_paid' => $amountPaid
            ]);
            
            // Create order items and update stock
            foreach ($orderItems as $item) {
                $item['order_id'] = $orderId;
                $this->orderItemModel->create($item);
                
                // Update product stock
                $product = $this->productModel->findById($item['product_id']);
                $newStock = $product['stock_quantity'] - $item['quantity'];
                $this->productModel->updateStock($item['product_id'], -$item['quantity']);
                
                // Log inventory change
                $this->inventoryLogModel->recordStockChange(
                    $item['product_id'],
                    $userId,
                    'sale',
                    -$item['quantity'],
                    $newStock,
                    null,
                    $orderNumber,
                    "Sale: Order {$orderNumber}"
                );
            }
            
            $this->db->commit();
            
            $orderDetails = $this->orderModel->findWithDetails($orderId);
            
            // Auto-save receipt (Wrapped in try-catch and output buffering to prevent JSON corruption)
            try {
                ob_start(); // Start output buffering to catch any stray warnings/errors
                $this->saveReceipt($orderDetails, $amountPaid);
                ob_end_clean(); // Discard any output
            } catch (\Exception $e) {
                ob_end_clean(); // Clean buffer even on error
                // Ignore error for receipt generation, don't stop the order flow
                error_log("Silenced receipt generation error: " . $e->getMessage());
            }

            return $orderDetails;
            
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    private function saveReceipt(array $order, float $amountPaid): void
    {
        // Safety Check: GD Library
        if (!extension_loaded('gd')) {
            error_log("GD Library not loaded. Skipping receipt image generation.");
            return;
        }

        try {
            $date = date('Y-m-d');
            $storageDir = __DIR__ . '/../../public/storage/receipts/' . $date;
            
            if (!is_dir($storageDir)) {
                // Suppress warnings for mkdir race conditions
                @mkdir($storageDir, 0777, true);
            }

            $filename = "{$storageDir}/{$order['order_number']}.jpg";
            $this->generateReceiptImage($order, $amountPaid, $filename);
            
        } catch (\Exception $e) {
            error_log("Failed to save receipt image: " . $e->getMessage());
        }
    }

    private function generateReceiptImage(array $order, float $amountPaid, string $outputPath): void
    {
        // Dimensions
        $width = 500; // Wider for better spacing
        $padding = 30;
        $lineHeight = 30;
        $fontSize = 4; // Larger font
        
        // Calculate dynamic height
        $headerHeight = 150;
        $itemHeight = count($order['items']) * ($lineHeight * 2); 
        $totalsHeight = 220;
        $footerHeight = 100;
        $height = $headerHeight + $itemHeight + $totalsHeight + $footerHeight;
        
        // Create canvas
        $img = imagecreatetruecolor($width, $height);
        
        // Colors
        $white = imagecolorallocate($img, 255, 255, 255);
        $black = imagecolorallocate($img, 0, 0, 0);
        $gray = imagecolorallocate($img, 80, 80, 80);
        
        // Fill background
        imagefill($img, 0, 0, $white);
        
        // Helper for Centered Text
        $center = function($text, $y, $font = 4, $color = null) use ($img, $width, $black) {
            $color = $color ?? $black;
            $len = strlen($text);
            $fontWidth = imagefontwidth($font);
            $x = ($width - ($len * $fontWidth)) / 2;
            imagestring($img, $font, $x, $y, $text, $color);
        };

        // Helper for Left-Right Text
        $row = function($left, $right, $y, $font = 4, $color = null) use ($img, $width, $padding, $black) {
            $color = $color ?? $black;
            imagestring($img, $font, $padding, $y, $left, $color);
            
            $rightLen = strlen($right);
            $fontWidth = imagefontwidth($font);
            $x = $width - $padding - ($rightLen * $fontWidth);
            imagestring($img, $font, $x, $y, $right, $color);
        };

        // Helper for Dashed Line
        $dashedLine = function($y) use ($img, $width, $padding, $black) {
            $style = [$black, $black, $black, IMG_COLOR_TRANSPARENT, IMG_COLOR_TRANSPARENT, IMG_COLOR_TRANSPARENT];
            imagesetstyle($img, $style);
            imageline($img, $padding, $y, $width - $padding, $y, IMG_COLOR_STYLED);
        };
        
        $y = $padding;
        
        // --- Header ---
        $center("KASIR LAKSANA", $y, 5);
        $y += 40;
        $center("Jl. Contoh No. 123, Kota", $y, 4, $gray);
        $y += 25;
        $center("Telp: 0812-3456-7890", $y, 4, $gray);
        $y += 40;
        
        $dashedLine($y);
        $y += 15;
        
        // --- Metadata ---
        $date = date('d/m/Y H:i', strtotime($order['created_at']));
        $row("No Order:", $order['order_number'], $y);
        $y += $lineHeight;
        $row("Tanggal :", $date, $y);
        $y += $lineHeight;
        $row("Kasir   :", $order['user_name'] ?? 'Admin', $y);
        $y += $lineHeight + 10;
        
        $dashedLine($y);
        $y += 15;
        
        // --- Items ---
        foreach ($order['items'] as $item) {
            // Product Name
            imagestring($img, $fontSize, $padding, $y, substr($item['product_name'], 0, 45), $black);
            $y += $lineHeight;
            
            // Qty x Price .......... Total
            $priceStr = number_format($item['unit_price'], 0, ',', '.');
            $totalStr = number_format($item['subtotal'], 0, ',', '.');
            $qtyPrice = "{$item['quantity']} x {$priceStr}";
            
            $row($qtyPrice, $totalStr, $y, 4, $gray);
            $y += $lineHeight + 10;
        }
        
        $dashedLine($y);
        $y += 15;
        
        // --- Totals ---
        $row("Subtotal", number_format($order['subtotal'], 0, ',', '.'), $y);
        $y += $lineHeight;
        
        if ($order['discount_amount'] > 0) {
            $row("Diskon", '-' . number_format($order['discount_amount'], 0, ',', '.'), $y); 
            $y += $lineHeight;
        }
        
        $row("Pajak", number_format($order['tax_amount'], 0, ',', '.'), $y);
        $y += $lineHeight + 10;
        
        // Bold Total (Simulated)
        $row("TOTAL", number_format($order['total_amount'], 0, ',', '.'), $y, 5);
        $y += $lineHeight + 20;
        
        if ($amountPaid > 0) {
            $row("Bayar", number_format($amountPaid, 0, ',', '.'), $y);
            $y += $lineHeight;
            
            $change = $amountPaid - $order['total_amount'];
            $row("Kembali", number_format($change, 0, ',', '.'), $y);
            $y += $lineHeight;
        }
        
        $y += 30;
        $dashedLine($y);
        $y += 30;
        
        // --- Footer ---
        $center("Terima Kasih", $y, 4);
        $y += 30;
        $center("Barang yg dibeli tidak dapat ditukar", $y, 3, $gray);
        
        // Save
        imagejpeg($img, $outputPath, 100); // 100 quality
        imagedestroy($img);
    }
    
    // Removed old helper functions from class to cleanliness or keep them if needed?
    // The previous implementation added them as private methods. 
    // Since I used closures here for simpler context capturing, I will remove the old private methods 
    // by ending the replace block before them or including them in replacement.
    // I'll assume I should just replace the `generateReceiptImage` method and let the old helpers be dead code or I can overwrite them.
    // To be safe and clean, I will overwrite the previous method and NOT include the old helpers if they were at the bottom.
    // Wait, I can't easily delete the *old* helper methods unless I include them in the TargetContent. 
    // They were `centerText` and `drawRow`.
    
    // Re-reading previous file content...
    // The previous file content had `centerText` and `drawRow` at the bottom.
    // I should include them in strict replacement or just leave them unused.
    // I'll leave them unused to keep the edit simple, or if they are inside the `class`, I can ignore them.
    // Actually, I can just replace the whole block including the helpers if I grab enough context.
    // The previous tool call output showed `generateReceiptImage` followed by `centerText` and `drawRow`.
    // I will try to target them to remove them.


    public function getOrder(string $id): ?array
    {
        return $this->orderModel->findWithDetails($id);
    }

    public function getOrders(int $page = 1, int $perPage = 20, ?string $startDate = null, ?string $endDate = null): array
    {
        $offset = ($page - 1) * $perPage;
        
        if ($startDate && $endDate) {
            $orders = $this->orderModel->findByDateRange($startDate, $endDate, $perPage, $offset);
        } else {
            $orders = $this->orderModel->findAll($perPage, $offset);
        }
        
        $total = $this->orderModel->count();
        
        return [
            'orders' => $orders,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => ceil($total / $perPage)
            ]
        ];
    }

    public function refundOrder(string $orderId, string $userId): bool
    {
        $this->db->beginTransaction();
        
        try {
            $order = $this->orderModel->findWithDetails($orderId);
            
            if (!$order || $order['status'] !== 'completed') {
                throw new \Exception('Order cannot be refunded');
            }
            
            // Restore stock for each item
            foreach ($order['items'] as $item) {
                $product = $this->productModel->findById($item['product_id']);
                $newStock = $product['stock_quantity'] + $item['quantity'];
                $this->productModel->updateStock($item['product_id'], $item['quantity']);
                
                // Log inventory change
                $this->inventoryLogModel->recordStockChange(
                    $item['product_id'],
                    $userId,
                    'adjustment',
                    $item['quantity'],
                    $newStock,
                    null,
                    $order['order_number'],
                    "Refund: Order {$order['order_number']}"
                );
            }
            
            // Update order status
            $this->orderModel->updateStatus($orderId, 'refunded');
            
            $this->db->commit();
            return true;
            
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function getTodaySummary(): array
    {
        $result = $this->orderModel->getTodaySummary();
        
        if ($result) {
            $result['net_profit'] = floatval($result['net_sales']) - floatval($result['total_cogs']);
        }
        
        return $result ?: [
            'total_transactions' => 0,
            'total_revenue' => 0,
            'net_sales' => 0,
            'net_profit' => 0,
            'avg_order_value' => 0,
            'completed_orders' => 0,
            'refunded_orders' => 0
        ];
    }

    public function getDashboardStats(): array
    {
        $result = $this->orderModel->getOverallStats();
        return $result ?: [
            'total_transactions' => 0,
            'total_revenue' => 0,
            'avg_order_value' => 0
        ];
    }
}
