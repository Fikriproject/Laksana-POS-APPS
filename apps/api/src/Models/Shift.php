<?php
/**
 * Shift Model
 */

namespace App\Models;

class Shift extends Model
{
    protected string $table = 'shifts';

    public function findCurrentOpen(): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT s.*, u.full_name as user_name, u.role as user_role
             FROM {$this->table} s
             LEFT JOIN users u ON s.user_id = u.id
             WHERE s.status = 'open'
             ORDER BY s.started_at DESC
             LIMIT 1"
        );
        $stmt->execute();
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function findOpenByUser(string $userId): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT s.*, u.full_name as user_name, u.role as user_role
             FROM {$this->table} s
             LEFT JOIN users u ON s.user_id = u.id
             WHERE s.user_id = :user_id AND s.status = 'open'
             ORDER BY s.started_at DESC
             LIMIT 1"
        );
        $stmt->execute(['user_id' => $userId]);
        
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function getShiftWithUser(string $shiftId): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT s.*, u.full_name as user_name, u.role as user_role
             FROM {$this->table} s
             LEFT JOIN users u ON s.user_id = u.id
             WHERE s.id = :id"
        );
        $stmt->execute(['id' => $shiftId]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function getShiftsByDate(string $date): array
    {
        $stmt = $this->db->prepare(
            "SELECT s.*, u.full_name as user_name, u.role as user_role
             FROM {$this->table} s
             LEFT JOIN users u ON s.user_id = u.id
             WHERE DATE(s.started_at) = :date
             ORDER BY s.started_at ASC"
        );
        $stmt->execute(['date' => $date]);
        return $stmt->fetchAll() ?: [];
    }

    public function openShift(string $userId, float $openingCash = 0): string
    {
        return $this->create([
            'user_id' => $userId,
            'opening_cash' => $openingCash,
            'status' => 'open'
        ]);
    }

    public function closeShift(string $shiftId, float $closingCash): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} 
             SET status = 'closed', closing_cash = :closing_cash, ended_at = CURRENT_TIMESTAMP 
             WHERE id = :id"
        );
        
        return $stmt->execute(['closing_cash' => $closingCash, 'id' => $shiftId]);
    }

    public function getShiftDuration(string $shiftId): ?string
    {
        $stmt = $this->db->prepare(
            "SELECT 
                CASE 
                    WHEN ended_at IS NOT NULL THEN ended_at - started_at
                    ELSE CURRENT_TIMESTAMP - started_at
                END as duration
             FROM {$this->table} WHERE id = :id"
        );
        $stmt->execute(['id' => $shiftId]);
        
        $result = $stmt->fetch();
        return $result ? $result['duration'] : null;
    }
}
