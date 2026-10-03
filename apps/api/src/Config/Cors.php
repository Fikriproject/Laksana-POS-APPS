<?php
/**
 * CORS Configuration
 */

namespace App\Config;

class Cors
{
    public static function headers(): void
    {
        $httpOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $configuredOrigin = $_ENV['CORS_ORIGIN'] ?? '';

        if (!empty($httpOrigin)) {
            // Izinkan origin penelusur yang sedang mengakses (IP lokal, localhost, domain)
            $origin = $httpOrigin;
        } elseif (!empty($configuredOrigin) && $configuredOrigin !== '*') {
            $origin = $configuredOrigin;
        } else {
            $origin = '*';
        }
        
        header("Access-Control-Allow-Origin: {$origin}");
        header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Access-Control-Allow-Credentials: true");
        header("Content-Type: application/json; charset=UTF-8");
        
        // Handle preflight requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }
}
