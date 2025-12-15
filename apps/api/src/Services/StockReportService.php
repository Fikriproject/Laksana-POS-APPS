<?php
namespace App\Services;

use App\Models\StockReport;

class StockReportService
{
    private StockReport $stockReportModel;

    public function __construct(StockReport $stockReportModel)
    {
        $this->stockReportModel = $stockReportModel;
    }

    public function createReport(string $userId, array $data): array
    {
        $data['user_id'] = $userId;
        $id = $this->stockReportModel->create($data);
        return ['id' => $id, 'message' => 'Laporan berhasil dibuat'];
    }

    public function getAllReports(int $page = 1, int $perPage = 20): array
    {
        $offset = ($page - 1) * $perPage;
        $reports = $this->stockReportModel->findAll($perPage, $offset);
        $total = $this->stockReportModel->count();
        
        return [
            'data' => $reports,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => ceil($total / $perPage)
            ]
        ];
    }
    
    public function getPendingReports(): array
    {
        return $this->stockReportModel->findPending();
    }

    public function resolveReport(string $id): bool
    {
        return $this->stockReportModel->updateStatus($id, 'resolved');
    }
}
