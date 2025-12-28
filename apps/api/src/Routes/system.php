<?php
/**
 * System Routes
 */

use App\Utils\Response;

return function ($method, $path, $user = null) {
    
    // POST /api/system/shutdown
    if ($method === 'POST' && $path === '/shutdown') {
        if (!$user) {
            Response::error('Otentikasi diperlukan', 401);
        }

        // Send success response BEFORE killing the server
        // We flush the buffer to ensure the frontend gets the 200 OK
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'message' => 'Aplikasi sedang dimatikan...',
            'data' => null
        ]);
        
        if (function_exists('fastcgi_finish_request')) {
            fastcgi_finish_request();
        } else {
            flush();
        }

        // Execute Kill Commands
        // 1. Kill Frontend (Node/Vite)
        exec('taskkill /F /IM node.exe /T >nul 2>&1');
        
        // 2. Kill Launcher Window (by Title)
        exec('taskkill /F /FI "WINDOWTITLE eq Kasir Laksana Launcher" /T >nul 2>&1');
        
        // 3. Kill Backend (PHP) - This process
        // We use a slight delay or detached process to ensure this script finishes? 
        // No, we already correctly flushed the response.
        exec('taskkill /F /IM php.exe /T >nul 2>&1');
        
        exit;
    }

    Response::error('Rute tidak ditemukan', 404);
};
