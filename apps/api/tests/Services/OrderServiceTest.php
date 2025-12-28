<?php

namespace Tests\Services;

use PHPUnit\Framework\TestCase;
use App\Services\OrderService;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\InventoryLog;
use PDO;

require_once __DIR__ . '/../../src/Models/Model.php';
require_once __DIR__ . '/../../src/Models/Order.php';
require_once __DIR__ . '/../../src/Models/OrderItem.php';
require_once __DIR__ . '/../../src/Models/Product.php';
require_once __DIR__ . '/../../src/Models/InventoryLog.php';
require_once __DIR__ . '/../../src/Services/OrderService.php';

class OrderServiceTest extends TestCase
{
    private $orderService;
    private $orderModel;
    private $orderItemModel;
    private $productModel;
    private $inventoryLogModel;
    private $db;

    protected function setUp(): void
    {
        $this->orderModel = $this->createMock(Order::class);
        $this->orderItemModel = $this->createMock(OrderItem::class);
        $this->productModel = $this->createMock(Product::class);
        $this->inventoryLogModel = $this->createMock(InventoryLog::class);
        
        // Mock PDO for transaction methods
        $this->db = $this->createMock(PDO::class);
        $this->db->method('beginTransaction')->willReturn(true);
        $this->db->method('commit')->willReturn(true);
        $this->db->method('rollBack')->willReturn(true);

        $this->orderService = new OrderService(
            $this->orderModel,
            $this->orderItemModel,
            $this->productModel,
            $this->inventoryLogModel,
            $this->db
        );
    }

    public function testCreateOrderSuccessfully()
    {
        $userId = 'user-1';
        $items = [
            ['product_id' => 'prod-1', 'quantity' => 2, 'price' => 10000],
            ['product_id' => 'prod-2', 'quantity' => 1, 'price' => 5000]
        ];
        $paymentMethod = 'cash';
        $amountPaid = 30000;

        // Mock Product Availability
        // Note: The actual method in Product model is findById or find (inherited).
        // Based on OrderService usage, it calls find() or findWithDetails?
        // Let's check OrderService.php usage.
        
        // Assuming OrderService uses Product model which extends Model.
        // If find() is not mockable (maybe final?), we might need to look at how it's called.
        // However, usually in PHPUnit if a method doesn't exist on the mocked class it throws.
        // It seems `find` might not exist or is handled via __call magic method in base Model?
        // Actually, let's verify OrderService.php code again.
        
        // Use findById if that's what the model has.
        $this->productModel->method('findById')
            ->willReturnCallback(function($id) {
                return ['id' => $id, 'stock_quantity' => 10, 'name' => 'Test Product', 'price' => 10000];
            });

        // Expect Order Creation
        $this->orderModel->expects($this->once())
            ->method('create')
            ->willReturn('order-123');
            
        // Expect findWithDetails for receipt generation
        $this->orderModel->method('findWithDetails')
            ->willReturn([
                'id' => 'order-123',
                'order_number' => '#ORDER-123',
                'created_at' => date('Y-m-d H:i:s'),
                'subtotal' => 25000,
                'tax_amount' => 0,
                'discount_amount' => 0,
                'total_amount' => 25000,
                'items' => [
                    ['product_name' => 'Test Product', 'quantity' => 2, 'unit_price' => 10000, 'subtotal' => 20000],
                    ['product_name' => 'Test Product 2', 'quantity' => 1, 'unit_price' => 5000, 'subtotal' => 5000]
                ]
            ]);

        // Expect Order Items Creation (2 items)
        $this->orderItemModel->expects($this->exactly(2))
            ->method('create');

        // Expect Stock Reduction (2 items)
        $this->productModel->expects($this->exactly(2))
            ->method('updateStock');
            
        // Expect Inventory Log (2 logs)
        $this->inventoryLogModel->expects($this->exactly(2))
            ->method('recordStockChange');

        $result = $this->orderService->createOrder(
            $userId,
            $items,
            $paymentMethod,
            null, // customerId
            null, // shiftId
            0,    // discount
            null, // notes
            $amountPaid
        );

        $this->assertIsArray($result);
        $this->assertEquals('order-123', $result['id']);
        $this->assertEquals(25000, $result['total_amount']);
    }

    public function testCreateOrderInsufficientStock()
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Insufficient stock');

        $userId = 'user-1';
        $items = [
            ['product_id' => 'prod-1', 'quantity' => 100, 'price' => 10000]
        ];

        // Mock Product with low stock
        $this->productModel->method('findById')
            ->willReturn(['id' => 'prod-1', 'stock_quantity' => 5, 'name' => 'Low Stock Product', 'price' => 10000]);

        $this->orderService->createOrder($userId, $items, 'cash');
    }
}
