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
        // Fix: Use SERIAL (auto-increment) for ID, do not generate UUID.
        // Fix: 'title' and 'date' are required in schema but might be missing from input
        
        $title = $data['title'] ?? ($data['category'] . ' - ' . date('d/m/Y'));
        $date = $data['date'] ?? date('Y-m-d');

        // Ensure date format is Y-m-d
        try {
            $dateObj = new \DateTime($date);
            $formattedDate = $dateObj->format('Y-m-d');
        } catch (\Exception $e) {
            $formattedDate = date('Y-m-d');
        }

        $stmt = $this->db->prepare(
            "INSERT INTO expenses (user_id, title, category, amount, description, date, created_at) 
             VALUES (:user_id, :title, :category, :amount, :description, :date, NOW())
             RETURNING id"
        );
        
        $stmt->execute([
            'user_id' => $data['user_id'],
            'title' => $title,
            'category' => $data['category'],
            'amount' => $data['amount'],
            'description' => $data['description'] ?? null,
            'date' => $formattedDate
        ]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return ['id' => $result['id'], 'message' => 'Expense created successfully'];
    }

    // Removed unused generateUuid method

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
