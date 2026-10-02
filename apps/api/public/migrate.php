<?php
/**
 * Web Migration Trigger for Laksana POS
 * Useful for servers without SSH / CLI access (cPanel, Shared Hosting, Webhook)
 *
 * Usage:
 *   GET /migrate.php?secret=laksana_secret
 *   Or when API_DEBUG=true in .env, secret is optional or default
 */

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use App\Config\Database;
use App\Config\Cors;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

// Enable CORS
Cors::headers();

$configuredSecret = $_ENV['MIGRATION_SECRET'] ?? getenv('MIGRATION_SECRET') ?: 'laksana_pos_migrate_secret';
$providedSecret = $_GET['secret'] ?? '';
$isDebug = (filter_var($_ENV['API_DEBUG'] ?? getenv('API_DEBUG'), FILTER_VALIDATE_BOOLEAN));

// Security check: require secret unless in debug mode with local request
if (!$isDebug && $providedSecret !== $configuredSecret) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Akses ditolak. Parameter ?secret=... tidak sesuai dengan MIGRATION_SECRET di .env'
    ], JSON_PRETTY_PRINT);
    exit;
}

// Redirect CLI output to buffer for web display
ob_start();
$_SERVER['argv'] = ['migrate.php'];
if (isset($_GET['seed']) && $_GET['seed'] === 'true') {
    $_SERVER['argv'][] = '--seed';
}
if (isset($_GET['status']) && $_GET['status'] === 'true') {
    $_SERVER['argv'][] = '--status';
}

require_once __DIR__ . '/../migrate.php';
$output = ob_get_clean();

// Strip ANSI color codes for clean HTML/JSON output
$cleanOutput = preg_replace('/\033\[[0-9;]*m/', '', $output);

if (isset($_GET['format']) && $_GET['format'] === 'json') {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'output' => $cleanOutput
    ], JSON_PRETTY_PRINT);
    exit;
}

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laksana POS - Database Migration</title>
    <style>
        body { font-family: monospace, Consolas, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; line-height: 1.5; }
        .card { max-width: 800px; margin: 0 auto; background: #1e293b; border-radius: 8px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); }
        h1 { color: #38bdf8; font-size: 1.25rem; margin-top: 0; }
        pre { background: #090d16; padding: 16px; border-radius: 6px; overflow-x: auto; color: #a5f3fc; }
        .btn { display: inline-block; background: #0284c7; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 10px; }
        .btn:hover { background: #0369a1; }
    </style>
</head>
<body>
    <div class="card">
        <h1>🛠️ Laksana POS - Database Migration Web Runner</h1>
        <pre><?= htmlspecialchars($cleanOutput) ?></pre>
        <p><a href="/" class="btn">Kembali ke API Root</a></p>
    </div>
</body>
</html>
