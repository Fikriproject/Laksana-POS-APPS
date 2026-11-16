<?php
/**
 * Product Unit Model (Satuan Bertingkat: Lusin, Dus, Pack, Rim)
 */

namespace App\Models;

use PDO;

class ProductUnit extends Model
{
    protected string $table = 'product_units';

    public function findByProduct(string $productId): array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM {$this->table} 
             WHERE product_id = :product_id 
             ORDER BY conversion_factor ASC"
        );
        $stmt->execute(['product_id' => $productId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    public function findByBarcode(string $barcode): ?array
    {
        $clean = trim($barcode);
        if (empty($clean)) return null;

        $stmt = $this->db->prepare(
            "SELECT pu.*, p.name as product_name, p.sku as product_sku, p.purchase_price, p.stock_quantity
             FROM {$this->table} pu
             JOIN products p ON pu.product_id = p.id
             WHERE pu.barcode = :barcode
             LIMIT 1"
        );
        $stmt->execute(['barcode' => $clean]);
        $res = $stmt->fetch(PDO::FETCH_ASSOC);
        return $res ?: null;
    }

    public function syncUnits(string $productId, array $units): bool
    {
        // Delete units that are no longer present
        $keepIds = [];
        foreach ($units as $u) {
            if (!empty($u['id'])) {
                $keepIds[] = $u['id'];
            }
        }

        if (empty($keepIds)) {
            $stmtDel = $this->db->prepare("DELETE FROM {$this->table} WHERE product_id = :product_id");
            $stmtDel->execute(['product_id' => $productId]);
        } else {
            $placeholders = implode(',', array_fill(0, count($keepIds), '?'));
            $stmtDel = $this->db->prepare("DELETE FROM {$this->table} WHERE product_id = ? AND id NOT IN ($placeholders)");
            $params = array_merge([$productId], $keepIds);
            $stmtDel->execute($params);
        }

        // Insert or update remaining units
        foreach ($units as $u) {
            $unitName = trim($u['unit_name'] ?? '');
            if (empty($unitName)) continue;

            $conversionFactor = max(1, (int)($u['conversion_factor'] ?? 1));
            $price = (float)($u['price'] ?? 0);
            $wholesalePrice = isset($u['wholesale_price']) && $u['wholesale_price'] !== '' ? (float)$u['wholesale_price'] : null;
            $resellerPrice = isset($u['reseller_price']) && $u['reseller_price'] !== '' ? (float)$u['reseller_price'] : null;
            $barcode = !empty($u['barcode']) ? trim($u['barcode']) : null;

            if (!empty($u['id'])) {
                $stmtCheck = $this->db->prepare("SELECT id FROM {$this->table} WHERE id = :id AND product_id = :product_id");
                $stmtCheck->execute(['id' => $u['id'], 'product_id' => $productId]);
                if ($stmtCheck->fetch()) {
                    // Update
                    $stmtUp = $this->db->prepare(
                        "UPDATE {$this->table} 
                         SET unit_name = :unit_name, 
                             conversion_factor = :conversion_factor, 
                             price = :price, 
                             wholesale_price = :wholesale_price, 
                             reseller_price = :reseller_price, 
                             barcode = :barcode
                         WHERE id = :id AND product_id = :product_id"
                    );
                    $stmtUp->execute([
                        'id' => $u['id'],
                        'product_id' => $productId,
                        'unit_name' => $unitName,
                        'conversion_factor' => $conversionFactor,
                        'price' => $price,
                        'wholesale_price' => $wholesalePrice,
                        'reseller_price' => $resellerPrice,
                        'barcode' => $barcode
                    ]);
                    continue;
                }
            }

            // Insert new unit
            $newId = $this->generateUuid();
            $stmtIns = $this->db->prepare(
                "INSERT INTO {$this->table} 
                 (id, product_id, unit_name, conversion_factor, price, wholesale_price, reseller_price, barcode, created_at)
                 VALUES (:id, :product_id, :unit_name, :conversion_factor, :price, :wholesale_price, :reseller_price, :barcode, NOW())"
            );
            $stmtIns->execute([
                'id' => $newId,
                'product_id' => $productId,
                'unit_name' => $unitName,
                'conversion_factor' => $conversionFactor,
                'price' => $price,
                'wholesale_price' => $wholesalePrice,
                'reseller_price' => $resellerPrice,
                'barcode' => $barcode
            ]);
        }

        return true;
    }
}
