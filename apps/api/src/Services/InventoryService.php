<?php
/**
 * Inventory Service
 */

namespace App\Services;

use App\Models\Product;
use App\Models\InventoryLog;
use App\Models\Supplier;

class InventoryService
{
    private Product $productModel;
    private InventoryLog $inventoryLogModel;
    private Supplier $supplierModel;

    public function __construct(
        Product $productModel,
        InventoryLog $inventoryLogModel,
        Supplier $supplierModel
    ) {
        $this->productModel = $productModel;
        $this->inventoryLogModel = $inventoryLogModel;
        $this->supplierModel = $supplierModel;
    }

    public function stockIn(
        string $productId,
        string $userId,
        int $quantity,
        ?string $supplierId = null,
        ?string $notes = null
    ): array {
        $product = $this->productModel->findById($productId);
        
        if (!$product) {
            throw new \Exception('Product not found');
        }
        
        // Update stock
        $newStock = $product['stock_quantity'] + $quantity;
        $this->productModel->updateStock($productId, $quantity);
        
        // Generate reference number
        $referenceNumber = 'SI-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
        
        // Log the change
        $logId = $this->inventoryLogModel->recordStockChange(
            $productId,
            $userId,
            'stock_in',
            $quantity,
            $newStock,
            $supplierId,
            $referenceNumber,
            $notes
        );
        
        return [
            'log_id' => $logId,
            'product_id' => $productId,
            'quantity_added' => $quantity,
            'new_stock' => $newStock,
            'reference_number' => $referenceNumber
        ];
    }

    public function stockOut(
        string $productId,
        string $userId,
        int $quantity,
        ?string $notes = null
    ): array {
        $product = $this->productModel->findById($productId);
        
        if (!$product) {
            throw new \Exception('Product not found');
        }
        
        if ($product['stock_quantity'] < $quantity) {
            throw new \Exception('Insufficient stock');
        }
        
        // Update stock
        $newStock = $product['stock_quantity'] - $quantity;
        $this->productModel->updateStock($productId, -$quantity);
        
        // Generate reference number
        $referenceNumber = 'SO-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
        
        // Log the change
        $logId = $this->inventoryLogModel->recordStockChange(
            $productId,
            $userId,
            'stock_out',
            -$quantity,
            $newStock,
            null,
            $referenceNumber,
            $notes
        );
        
        return [
            'log_id' => $logId,
            'product_id' => $productId,
            'quantity_removed' => $quantity,
            'new_stock' => $newStock,
            'reference_number' => $referenceNumber
        ];
    }

    public function adjustment(
        string $productId,
        string $userId,
        int $newQuantity,
        ?string $notes = null
    ): array {
        $product = $this->productModel->findById($productId);
        
        if (!$product) {
            throw new \Exception('Product not found');
        }
        
        $quantityChange = $newQuantity - $product['stock_quantity'];
        
        // Update stock directly
        $this->productModel->update($productId, ['stock_quantity' => $newQuantity]);
        
        // Generate reference number
        $referenceNumber = 'ADJ-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
        
        // Log the change
        $logId = $this->inventoryLogModel->recordStockChange(
            $productId,
            $userId,
            'adjustment',
            $quantityChange,
            $newQuantity,
            null,
            $referenceNumber,
            $notes ?? 'Stock adjustment'
        );
        
        return [
            'log_id' => $logId,
            'product_id' => $productId,
            'previous_stock' => $product['stock_quantity'],
            'new_stock' => $newQuantity,
            'reference_number' => $referenceNumber
        ];
    }

    public function getLogs(int $page = 1, int $perPage = 20, ?string $type = null): array
    {
        $offset = ($page - 1) * $perPage;
        
        $logs = $this->inventoryLogModel->findWithDetails($perPage, $offset, $type);
        $total = $this->inventoryLogModel->count();
        
        return [
            'logs' => $logs,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => ceil($total / $perPage)
            ]
        ];
    }

    public function getProductHistory(string $productId): array
    {
        return $this->inventoryLogModel->findByProduct($productId);
    }

    public function getSuppliers(): array
    {
        return $this->supplierModel->findAllActive();
    }
}
