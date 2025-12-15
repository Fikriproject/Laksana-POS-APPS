<?php
namespace App\Models;

use PDO;
use App\Models\Model;

class StockReport extends Model
{
    protected string $table = 'stock_reports';

    public function __construct(PDO $db)
    {
        parent::__construct($db);
    }


    public function create(array $data): string
    {
        $id = $this->generateUuid();
        
        $sql = "INSERT INTO stock_reports (id, product_id, user_id, notes, status) 
                VALUES (:id, :product_id, :user_id, :notes, :status)";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':id' => $id,
            ':product_id' => $data['product_id'],
            ':user_id' => $data['user_id'],
            ':notes' => $data['notes'] ?? null,
            ':status' => 'pending'
        ]);
        
        return $id;
    }

    public function findAll(int $limit = 50, int $offset = 0): array
    {
        $sql = "SELECT sr.*, p.name as product_name, p.sku, u.full_name as reporter_name 
                FROM stock_reports sr
                JOIN products p ON sr.product_id = p.id
                JOIN users u ON sr.user_id = u.id
                ORDER BY sr.created_at DESC
                LIMIT :limit OFFSET :offset";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function findPending(): array
    {
        $sql = "SELECT sr.*, p.name as product_name, p.sku, u.full_name as reporter_name 
                FROM stock_reports sr
                JOIN products p ON sr.product_id = p.id
                JOIN users u ON sr.user_id = u.id
                WHERE sr.status = 'pending'
                ORDER BY sr.created_at DESC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function updateStatus(string $id, string $status): bool
    {
        $sql = "UPDATE stock_reports SET status = :status WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':status' => $status, ':id' => $id]);
    }
    

}
