<?php
/**
 * Upload Routes
 */

use App\Utils\Response;

return function ($method, $path, $user) {
    // All routes require authentication
    if (!$user) {
        Response::error('Authentication required', 401);
    }

    // POST /api/upload - Upload an image
    if ($method === 'POST' && $path === '') {
        // Debug logging
        error_log('Upload endpoint hit');
        error_log('Content-Type: ' . ($_SERVER['CONTENT_TYPE'] ?? 'Not set'));
        error_log('Files: ' . print_r($_FILES, true));
        error_log('Post: ' . print_r($_POST, true));

        if (!isset($_FILES['image'])) {
            Response::error('No file uploaded. Debug: Files array is empty. Content-Type: ' . ($_SERVER['CONTENT_TYPE'] ?? 'N/A'), 400);
        }

        $file = $_FILES['image'];
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $maxSize = 2 * 1024 * 1024; // 2MB

        // Validate file type
        if (!in_array($file['type'], $allowedTypes)) {
            Response::error('Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed', 400);
        }

        // Validate file size
        if ($file['size'] > $maxSize) {
            Response::error('File too large. Maximum size is 2MB', 400);
        }

        // Validate upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            Response::error('Upload failed with error code ' . $file['error'], 500);
        }

        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid('img_', true) . '.' . $extension;
        $uploadDir = __DIR__ . '/../../public/uploads/';
        
        // Ensure directory exists
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $destination = $uploadDir . $filename;

        // Move file
        if (move_uploaded_file($file['tmp_name'], $destination)) {
            $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'];
            // Determine port if standard locally
            $baseUrl = "$protocol://$host";
            
            Response::success([
                'url' => $baseUrl . '/uploads/' . $filename,
                'filename' => $filename
            ], 'File uploaded successfully', 201);
        } else {
            Response::error('Failed to move uploaded file', 500);
        }
    }

    Response::error('Route not found', 404);
};
