<?php
/**
 * Base Model Class
 */

namespace App\Models;

use PDO;

abstract class Model
{
    protected PDO $db;
    protected string $table;
    protected string $primaryKey = 'id';

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function findAll(int $limit = 100, int $offset = 0): array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM {$this->table} ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
        );
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function findById(string $id): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM {$this->table} WHERE {$this->primaryKey} = :id"
        );
        $stmt->execute(['id' => $id]);
        
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function create(array $data): string
    {
        // Auto-generate UUID for ID if not provided and not using AUTO_INCREMENT
        if ($this->primaryKey === 'id' && !isset($data['id'])) {
            // Check if we assume UUID. If table uses INT AUTO_INCREMENT, this will fail or be wrong.
            // A simple heuristic: if it's not 'categories' (which we know is INT), generate UUID.
            // Better: Check if we expect a UUID. For this project, only 'categories' is INT.
            if ($this->table !== 'categories') {
                $data['id'] = $this->generateUuid();
            }
        }

        $columns = implode(', ', array_keys($data));
        $placeholders = ':' . implode(', :', array_keys($data));
        
        $stmt = $this->db->prepare(
            "INSERT INTO {$this->table} ({$columns}) VALUES ({$placeholders})"
        );
        $stmt->execute($data);
        
        if (isset($data['id'])) {
            return $data['id'];
        }
        
        return $this->db->lastInsertId();
    }

    public function update(string $id, array $data): bool
    {
        $sets = [];
        foreach (array_keys($data) as $key) {
            $sets[] = "{$key} = :{$key}";
        }
        $setString = implode(', ', $sets);
        
        $data['id'] = $id;
        // removed updated_at = CURRENT_TIMESTAMP explicit call as MySQL handles it with ON UPDATE
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET {$setString} WHERE {$this->primaryKey} = :id"
        );
        
        return $stmt->execute($data);
    }

    public function delete(string $id): bool
    {
        $stmt = $this->db->prepare(
            "DELETE FROM {$this->table} WHERE {$this->primaryKey} = :id"
        );
        
        return $stmt->execute(['id' => $id]);
    }

    public function count(string $where = '1=1', array $params = []): int
    {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM {$this->table} WHERE {$where}"
        );
        $stmt->execute($params);
        
        return (int) $stmt->fetchColumn();
    }

    protected function generateUuid(): string 
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
}
