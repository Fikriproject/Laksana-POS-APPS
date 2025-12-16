<?php

namespace App\Services;

use App\Config\Database;
use PDO;

class ExpenseService
{
    private $db;

    public function __construct()
    {
        $this->db = (new Database())->getConnection();
    }

    public function createExpense(array $data)
    {
        $id = $this->generateUuid();
        
        $createdAt = date('Y-m-d H:i:s');
        if (isset($data['date'])) {
            try {
                $dateObj = new \DateTime($data['date']);
                $createdAt = $dateObj->format('Y-m-d H:i:s');
            } catch (\Exception $e) {
                // Keep default
            }
        }

        $stmt = $this->db->prepare(
            "INSERT INTO expenses (id, user_id, category, amount, description, created_at) 
             VALUES (:id, :user_id, :category, :amount, :description, :created_at)"
        );
        $stmt->execute([
            'id' => $id,
            'user_id' => $data['user_id'],
            'category' => $data['category'],
            'amount' => $data['amount'],
            'description' => $data['description'] ?? null,
            'created_at' => $createdAt
        ]);
        return ['id' => $id, 'message' => 'Expense created successfully'];
    }

    private function generateUuid(): string 
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }

    public function getExpenses(string $startDate, string $endDate)
    {
        $stmt = $this->db->prepare(
            "SELECT e.*, u.full_name as user_name 
             FROM expenses e
             JOIN users u ON e.user_id = u.id
             WHERE e.created_at BETWEEN :start_date AND :end_date
             ORDER BY e.created_at DESC"
        );
        $stmt->execute([
            'start_date' => $startDate,
            'end_date' => $endDate
        ]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function getExpenseSummary(string $startDate, string $endDate)
    {
        $stmt = $this->db->prepare(
            "SELECT category, SUM(amount) as total
             FROM expenses
             WHERE created_at BETWEEN :start_date AND :end_date
             GROUP BY category
             ORDER BY total DESC"
        );
        $stmt->execute([
            'start_date' => $startDate,
            'end_date' => $endDate
        ]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
