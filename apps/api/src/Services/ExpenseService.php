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

    private static $categoryMigrated = false;

    private function ensureCategoryColumnType()
    {
        if (self::$categoryMigrated) return;
        try {
            $this->db->exec("ALTER TABLE expenses MODIFY category VARCHAR(100) NOT NULL DEFAULT 'Lainnya'");
            self::$categoryMigrated = true;
        } catch (\Exception $e) {
            // Ignore if already VARCHAR, postgres, or restricted permission
        }
    }

    private function getTableColumns(): array
    {
        try {
            $stmt = $this->db->query("SHOW COLUMNS FROM expenses");
            return $stmt->fetchAll(PDO::FETCH_COLUMN) ?: [];
        } catch (\Exception $e) {
            try {
                $stmt = $this->db->query("SELECT column_name FROM information_schema.columns WHERE table_name = 'expenses'");
                return $stmt->fetchAll(PDO::FETCH_COLUMN) ?: [];
            } catch (\Exception $ex) {
                return ['user_id', 'category', 'amount', 'description', 'created_at'];
            }
        }
    }

    private function needsUuidId(): bool
    {
        try {
            $stmt = $this->db->query("SHOW COLUMNS FROM expenses LIKE 'id'");
            $col = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($col) {
                $type = strtolower($col['Type'] ?? '');
                $extra = strtolower($col['Extra'] ?? '');
                if (strpos($extra, 'auto_increment') !== false) {
                    return false;
                }
                if (strpos($type, 'char') !== false || strpos($type, 'uuid') !== false) {
                    return true;
                }
            }
        } catch (\Exception $e) {}
        return false;
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

    public function createExpense(array $data)
    {
        // 1. Proactively ensure category column allows arbitrary category strings
        $this->ensureCategoryColumnType();

        $category = !empty($data['category']) ? trim($data['category']) : 'Lainnya';
        $title = $data['title'] ?? ($category . ' - ' . date('d/m/Y'));
        $date = $data['date'] ?? date('Y-m-d');

        try {
            $dateObj = new \DateTime($date);
            $formattedDate = $dateObj->format('Y-m-d');
        } catch (\Exception $e) {
            $formattedDate = date('Y-m-d');
        }

        $columns = $this->getTableColumns();
        $hasTitle = in_array('title', $columns);
        $hasDate = in_array('date', $columns);
        $needsUuid = $this->needsUuidId();

        $fields = ['user_id', 'category', 'amount', 'description', 'created_at'];
        $params = [
            'user_id' => $data['user_id'],
            'category' => $category,
            'amount' => $data['amount'],
            'description' => $data['description'] ?? null
        ];

        $uuid = null;
        if ($needsUuid) {
            $uuid = $this->generateUuid();
            $fields[] = 'id';
            $params['id'] = $uuid;
        }

        if ($hasTitle) {
            $fields[] = 'title';
            $params['title'] = $title;
        }

        if ($hasDate) {
            $fields[] = 'date';
            $params['date'] = $formattedDate;
        }

        $fieldNames = implode(', ', $fields);
        $placeholders = implode(', ', array_map(function($f) {
            return $f === 'created_at' ? 'NOW()' : ":$f";
        }, $fields));

        $sql = "INSERT INTO expenses ($fieldNames) VALUES ($placeholders)";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $newId = $uuid ?? $this->db->lastInsertId();
            return ['id' => $newId, 'message' => 'Expense created successfully'];
        } catch (\PDOException $e) {
            // Check for ENUM truncation error (SQLSTATE[01000] Warning: 1265 Data truncated)
            if (strpos($e->getMessage(), '1265') !== false || strpos($e->getMessage(), 'Data truncated') !== false) {
                try {
                    $this->db->exec("ALTER TABLE expenses MODIFY category VARCHAR(100) NOT NULL DEFAULT 'Lainnya'");
                    $stmt = $this->db->prepare($sql);
                    $stmt->execute($params);
                    $newId = $uuid ?? $this->db->lastInsertId();
                    return ['id' => $newId, 'message' => 'Expense created successfully'];
                } catch (\Exception $ex) {
                    // Fallback to legacy ENUM safe value 'Lainnya' so transaction never fails
                    $params['category'] = 'Lainnya';
                    $params['description'] = ($data['description'] ?? '') . " [{$category}]";
                    $stmt = $this->db->prepare($sql);
                    $stmt->execute($params);
                    $newId = $uuid ?? $this->db->lastInsertId();
                    return ['id' => $newId, 'message' => 'Expense created successfully'];
                }
            }
            throw $e;
        }
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
