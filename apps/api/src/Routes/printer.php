<?php
/**
 * Printer Routes - Direct Thermal ESC/POS Network Socket Printing
 */

use App\Utils\Response;

return function ($method, $path, $user) {
    if (!$user) {
        Response::error('Otentikasi diperlukan', 401);
    }

    // POST /api/printer/test-connection
    if ($method === 'POST' && ($path === '/test-connection' || $path === '/test')) {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $ip = trim($data['ip'] ?? '192.168.1.200');
        $port = intval($data['port'] ?? 9100);

        if (empty($ip)) {
            Response::error('Alamat IP printer harus diisi', 400);
        }

        // Test TCP connection with 2 second timeout
        $fp = @fsockopen($ip, $port, $errno, $errstr, 2);
        if (!$fp) {
            Response::error("Tidak dapat terhubung ke printer di {$ip}:{$port} ({$errstr})", 500, [
                'ip' => $ip,
                'port' => $port,
                'error_code' => $errno,
                'error_message' => $errstr
            ]);
        }

        fclose($fp);
        Response::success([
            'connected' => true,
            'ip' => $ip,
            'port' => $port
        ], "Berhasil terhubung ke printer thermal di {$ip}:{$port}!");
    }

    // POST /api/printer/print-test (Direct RAW ESC/POS Socket)
    if ($method === 'POST' && $path === '/print-test') {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $ip = trim($data['ip'] ?? '192.168.1.200');
        $port = intval($data['port'] ?? 9100);
        $storeName = $data['storeName'] ?? 'KASIR LAKSANA';
        $paperWidth = $data['paperWidth'] ?? '80mm';

        $fp = @fsockopen($ip, $port, $errno, $errstr, 3);
        if (!$fp) {
            Response::error("Gagal terhubung ke printer {$ip}:{$port}. Pastikan printer hidup dan 1 jaringan WiFi.", 500);
        }

        // ESC/POS Commands
        $ESC = "\x1b";
        $GS  = "\x1d";

        $init = $ESC . "@";                  // Initialize printer
        $alignCenter = $ESC . "a\x01";        // Align Center
        $alignLeft = $ESC . "a\x00";          // Align Left
        $boldOn = $ESC . "E\x01";             // Bold ON
        $boldOff = $ESC . "E\x00";            // Bold OFF
        $doubleOn = $ESC . "!\x30";           // Double Height & Width
        $doubleOff = $ESC . "!\x00";          // Normal size
        $cut = $GS . "V\x41\x03";             // Partial Cut
        $openDrawer = $ESC . "p\x00\x19\xfa"; // Open Cash Drawer pulse

        $divider = str_repeat("-", $paperWidth === '80mm' ? 46 : 32) . "\n";

        $raw = $init;
        if (!empty($data['openCashDrawer'])) {
            $raw .= $openDrawer;
        }

        $raw .= $alignCenter;
        $raw .= $boldOn . $doubleOn . strtoupper($storeName) . "\n" . $doubleOff . $boldOff;
        $raw .= "UJI COBA CETAK STRUK BERHASIL\n";
        $raw .= $divider;

        $raw .= $alignLeft;
        $raw .= "Waktu  : " . date('d-m-Y H:i:s') . "\n";
        $raw .= "IP/Port: {$ip}:{$port}\n";
        $raw .= "Kertas : {$paperWidth} (Driver POS-80)\n";
        $raw .= "Status : ONLINE & SIAP DIGUNAKAN\n";
        $raw .= $divider;

        $raw .= $alignCenter;
        $raw .= "Terima kasih atas kunjungan Anda\n";
        $raw .= "Laksana POS System v1.0\n\n\n\n";

        if (!empty($data['autoCut'])) {
            $raw .= $cut;
        }

        fwrite($fp, $raw);
        fclose($fp);

        Response::success([
            'status' => 'printed',
            'ip' => $ip,
            'port' => $port
        ], 'Struk uji coba berhasil dikirim ke printer!');
    }

    Response::error('Endpoint printer tidak valid', 404);
};
