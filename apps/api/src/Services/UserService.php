<?php

namespace App\Services;

use App\Models\User;
use Exception;

class UserService
{
    private User $userModel;

    public function __construct(User $userModel)
    {
        $this->userModel = $userModel;
    }

    public function getAllUsers()
    {
        return $this->userModel->findAllWithStats();
    }

    public function createUser(array $data)
    {
        // Check if username already exists
        if ($this->userModel->findByUsername($data['username'])) {
            throw new Exception("Username sudah digunakan");
        }
        
        // Check employee ID
        if (isset($data['employee_id']) && $this->userModel->findByEmployeeId($data['employee_id'])) {
            throw new Exception("ID Karyawan sudah digunakan");
        }

        return $this->userModel->createUser($data);
    }

    public function updateUser(string $id, array $data)
    {
        // Validation could be added here to check duplicates if username/employee_id changes
        // For now relying on simple update
        return $this->userModel->update($id, $data);
    }

    public function deleteUser(string $id)
    {
        // Soft delete? Or hard delete?
        // Usually soft delete is better, but Model::delete is hard delete.
        // Let's implement Soft Delete by setting is_active = false
        return $this->userModel->update($id, ['is_active' => 0]);
        // Ideally we shouldn't delete users with transactions, so soft delete/deactivate is safer.
    }
}
