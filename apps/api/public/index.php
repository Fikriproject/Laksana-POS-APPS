<?php
/**
 * POS API Entry Point
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use App\Config\Database;
use App\Config\Cors;
use App\Utils\Response;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

// Set CORS headers
Cors::headers();

// Error handling
set_exception_handler(function ($e) {
    $debug = $_ENV['API_DEBUG'] ?? false;
    Response::error(
        $debug ? $e->getMessage() : 'Internal server error',
        500,
        $debug ? ['trace' => $e->getTraceAsString()] : null
    );
});

// Get database connection
$database = new Database();
$db = $database->getConnection();

// Initialize Models
$userModel = new App\Models\User($db);
$productModel = new App\Models\Product($db);
$categoryModel = new App\Models\Category($db);
$orderModel = new App\Models\Order($db);
$orderItemModel = new App\Models\OrderItem($db);
$inventoryLogModel = new App\Models\InventoryLog($db);
$customerModel = new App\Models\Customer($db);
$supplierModel = new App\Models\Supplier($db);
$shiftModel = new App\Models\Shift($db);
$stockReportModel = new App\Models\StockReport($db);

// Initialize Services
$authService = new App\Services\AuthService($userModel, $shiftModel);
$userService = new App\Services\UserService($userModel);
$productService = new App\Services\ProductService($productModel, $categoryModel);
$orderService = new App\Services\OrderService($orderModel, $orderItemModel, $productModel, $inventoryLogModel, $db);
$reportService = new App\Services\ReportService($db);
$inventoryService = new App\Services\InventoryService($productModel, $inventoryLogModel, $supplierModel);
$shiftService = new App\Services\ShiftService($shiftModel, $orderModel);
$stockReportService = new App\Services\StockReportService($stockReportModel);

// Initialize Auth Middleware
$authMiddleware = new App\Middleware\AuthMiddleware($authService);

// Parse request
$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// Remove /api prefix and get route group
$path = preg_replace('/^\/api/', '', $path);

// Get authenticated user (if applicable)
$user = null;
$publicRoutes = ['/auth/login', '/auth/login/pin'];

if (!in_array($path, $publicRoutes) && $method !== 'OPTIONS') {
    try {
        $user = $authMiddleware->handle();
    } catch (\Exception $e) {
        // Continue without user for public routes
    }
}

// Route to appropriate handler
// Route to appropriate handler
// Routes
// $path is already stripped of /api prefix from line 65
$method = $_SERVER['REQUEST_METHOD'];

// Add CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($method === 'OPTIONS') {
    exit(0);
}

error_log("Router Debug - Path: " . $path . " Method: " . $method);

// Router
if (strpos($path, '/auth') === 0) {
    $routePath = substr($path, strlen('/auth'));
    $handler = require __DIR__ . '/../src/Routes/auth.php';
    $handler($method, $routePath, $authService, $shiftService, $user);
} elseif (strpos($path, '/users') === 0) {
    $routePath = substr($path, strlen('/users'));
    $handler = require __DIR__ . '/../src/Routes/users.php';
    $handler($method, $routePath, $userService, $user);
} elseif (strpos($path, '/products') === 0) {
    $routePath = substr($path, strlen('/products'));
    $handler = require __DIR__ . '/../src/Routes/products.php';
    $handler($method, $routePath, $productService, $user);
} elseif (strpos($path, '/orders') === 0) {
    $routePath = substr($path, strlen('/orders'));
    $handler = require __DIR__ . '/../src/Routes/orders.php';
    $handler($method, $routePath, $orderService, $shiftService, $user);
} elseif (strpos($path, '/inventory') === 0) {
    $routePath = substr($path, strlen('/inventory'));
    $handler = require __DIR__ . '/../src/Routes/inventory.php';
    $handler($method, $routePath, $inventoryService, $user);
} elseif (strpos($path, '/reports') === 0) {
    $routePath = substr($path, strlen('/reports'));
    $handler = require __DIR__ . '/../src/Routes/reports.php';
    $handler($method, $routePath, $reportService, $user);
} elseif (strpos($path, '/shifts') === 0) {
    $routePath = substr($path, strlen('/shifts'));
    $handler = require __DIR__ . '/../src/Routes/shifts.php';
    $handler($method, $routePath, $shiftService, $user);
} elseif (strpos($path, '/stock-reports') === 0) {
    $routePath = substr($path, strlen('/stock-reports'));
    $handler = require __DIR__ . '/../src/Routes/stock_reports.php';
    $handler($method, $routePath, $stockReportService, $user);
} elseif (strpos($path, '/upload') === 0) {
    $routePath = substr($path, strlen('/upload'));
    $handler = require __DIR__ . '/../src/Routes/upload.php';
    $handler($method, $routePath, $user);
} else {
    App\Utils\Response::error('Endpoint tidak ditemukan: ' . $path, 404);
}

// Health check endpoint
if ($path === '/health' || $path === '/') {
    Response::success([
        'status' => 'ok',
        'version' => '1.0.0',
        'timestamp' => date('c')
    ], 'POS API is running');
}

// 404 for unmatched routes
Response::error('Endpoint not found', 404);
