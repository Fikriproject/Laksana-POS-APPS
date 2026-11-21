/**
 * WebUSB Thermal Printer Driver for ESC/POS
 * 100% Free, Native Browser Printing via USB-OTG
 * Works on Android Chrome & Chromium Browsers without RawBT or third-party paid apps.
 */

import { formatDateTime } from './format';

// Type definitions for WebUSB if not present in standard TypeScript environment
export interface WebUSBEndpoint {
    endpointNumber: number;
    direction: 'in' | 'out';
    type: 'bulk' | 'interrupt' | 'isochronous';
    packetSize?: number;
}

export interface WebUSBAlternate {
    alternateSetting: number;
    interfaceClass: number;
    interfaceSubclass: number;
    interfaceProtocol: number;
    endpoints: WebUSBEndpoint[];
}

export interface WebUSBInterface {
    interfaceNumber: number;
    claimed: boolean;
    alternates: WebUSBAlternate[];
}

export interface WebUSBConfiguration {
    configurationValue: number;
    interfaces: WebUSBInterface[];
}

export interface WebUSBDevice {
    vendorId: number;
    productId: number;
    productName?: string;
    manufacturerName?: string;
    serialNumber?: string;
    opened: boolean;
    configuration: WebUSBConfiguration | null;
    open(): Promise<void>;
    close(): Promise<void>;
    selectConfiguration(configurationValue: number): Promise<void>;
    claimInterface(interfaceNumber: number): Promise<void>;
    releaseInterface(interfaceNumber: number): Promise<void>;
    transferOut(endpointNumber: number, data: BufferSource): Promise<{ bytesWritten: number; status: 'ok' | 'stall' | 'babble' }>;
}

export interface PrinterConfig {
    name?: string;
    connectionType?: 'tcp' | 'bluetooth' | 'usb' | 'system';
    ipAddress?: string;
    port?: number;
    paperWidth?: '80mm' | '58mm';
    autoCut?: boolean;
    openCashDrawer?: boolean;
    storeName?: string;
    storeAddress?: string;
    storePhone?: string;
    receiptFooter?: string;
}

// Active cached connection in memory
let activeDevice: WebUSBDevice | null = null;
let activeEndpointNumber: number | null = null;
let activeInterfaceNumber: number | null = null;

/**
 * Check if current browser supports WebUSB
 */
export function isWebUsbSupported(): boolean {
    return typeof navigator !== 'undefined' && 'usb' in navigator;
}

/**
 * Get active or auto-reconnect to previously paired USB device
 */
export async function getPairedUsbDevice(): Promise<WebUSBDevice | null> {
    if (!isWebUsbSupported()) return null;
    try {
        const usb = (navigator as any).usb;
        const devices: WebUSBDevice[] = await usb.getDevices();
        if (devices && devices.length > 0) {
            return devices[0];
        }
    } catch (err) {
        console.warn('Gagal membaca perangkat USB berpasangan:', err);
    }
    return null;
}

/**
 * Request user to pick a USB thermal printer device via browser prompt
 */
export async function requestUsbPrinter(): Promise<WebUSBDevice> {
    if (!isWebUsbSupported()) {
        throw new Error('Browser Anda tidak mendukung WebUSB. Gunakan Google Chrome pada Android/PC.');
    }
    const usb = (navigator as any).usb;
    // Request device with no vendor filter to allow any brand (Xprinter, Epson, Panda, Iware, Winbond, etc.)
    const device: WebUSBDevice = await usb.requestDevice({ filters: [] });
    return device;
}

/**
 * Connect, configure, and claim interface on the USB device
 */
export async function connectUsbPrinter(device?: WebUSBDevice): Promise<{ device: WebUSBDevice; endpointNumber: number }> {
    const targetDevice = device || activeDevice || (await getPairedUsbDevice());
    if (!targetDevice) {
        throw new Error('Tidak ada printer USB yang dipilih atau terhubung ke kabel OTG.');
    }

    try {
        if (!targetDevice.opened) {
            await targetDevice.open();
        }

        // Pastikan konfigurasi aktif (tangani jika OS sudah mengunci konfigurasi 1)
        if (targetDevice.configuration === null || targetDevice.configuration.configurationValue !== 1) {
            try {
                await targetDevice.selectConfiguration(1);
            } catch (cfgErr) {
                console.warn('selectConfiguration warning (sudah aktif di OS):', cfgErr);
            }
        }

        // Cari interface printer
        let foundInterfaceNumber: number | null = null;
        let foundEndpointNumber: number | null = null;

        const interfaces = targetDevice.configuration?.interfaces || [];

        // Prioritas 1: Cari interface dengan class 7 (USB Printer Class)
        for (const iface of interfaces) {
            for (const alt of iface.alternates) {
                if (alt.interfaceClass === 7) {
                    const outEndpoint = alt.endpoints.find(
                        (ep) => ep.direction === 'out' && (ep.type === 'bulk' || ep.type === 'interrupt')
                    );
                    if (outEndpoint) {
                        foundInterfaceNumber = iface.interfaceNumber;
                        foundEndpointNumber = outEndpoint.endpointNumber;
                        break;
                    }
                }
            }
            if (foundEndpointNumber !== null) break;
        }

        // Prioritas 2: Fallback jika printer generic tidak mendaftarkan class 7 (misal class 0 atau 255)
        if (foundEndpointNumber === null) {
            for (const iface of interfaces) {
                for (const alt of iface.alternates) {
                    const outEndpoint = alt.endpoints.find(
                        (ep) => ep.direction === 'out' && (ep.type === 'bulk' || ep.type === 'interrupt')
                    );
                    if (outEndpoint) {
                        foundInterfaceNumber = iface.interfaceNumber;
                        foundEndpointNumber = outEndpoint.endpointNumber;
                        break;
                    }
                }
                if (foundEndpointNumber !== null) break;
            }
        }

        if (foundInterfaceNumber === null || foundEndpointNumber === null) {
            throw new Error('Tidak ditemukan port transfer data (Bulk OUT) pada printer USB ini.');
        }

        // Klaim interface
        try {
            await targetDevice.claimInterface(foundInterfaceNumber);
        } catch (claimErr: any) {
            const msg = String(claimErr?.message || '');
            if (msg.includes('Unable to claim interface') || msg.includes('SecurityError') || msg.includes('Access denied')) {
                throw new Error(
                    'Akses ke printer USB ditolak oleh Android karena sedang digunakan oleh aplikasi lain (misal RawBT / ESC-POS service). ' +
                    'Silakan uninstall atau force stop aplikasi RawBT/ESC-POS di Android, lalu cabut-colok kembali kabel OTG.'
                );
            }
            console.warn('Claim interface info:', claimErr);
        }

        activeDevice = targetDevice;
        activeEndpointNumber = foundEndpointNumber;
        activeInterfaceNumber = foundInterfaceNumber;

        // Simpan info printer di localStorage
        try {
            localStorage.setItem(
                'pos_usb_printer_info',
                JSON.stringify({
                    productName: targetDevice.productName || 'Thermal Printer USB 80mm',
                    vendorId: targetDevice.vendorId,
                    productId: targetDevice.productId,
                    connectedAt: new Date().toISOString()
                })
            );
        } catch (_) {}

        return { device: targetDevice, endpointNumber: foundEndpointNumber };
    } catch (err: any) {
        console.error('Koneksi printer USB gagal:', err);
        throw new Error(err.message || 'Koneksi printer USB gagal. Periksa sambungan kabel OTG.');
    }
}

/**
 * Send raw binary data to the USB printer with 64-byte chunking for high stability on Android OTG
 */
export async function sendRawUsb(data: Uint8Array): Promise<void> {
    const { device, endpointNumber } = await connectUsbPrinter();

    // Kirim dalam potongan 64 byte (standar aman bulk transfer USB 2.0 Full-Speed)
    // agar buffer printer thermal tidak overload di Android OTG
    const chunkSize = 64;
    for (let offset = 0; offset < data.length; offset += chunkSize) {
        const chunk = data.slice(offset, offset + chunkSize);
        const result = await device.transferOut(endpointNumber, chunk);
        if (result.status !== 'ok') {
            throw new Error(`Gagal mengirim data ke printer USB (Status: ${result.status})`);
        }
    }
}

/**
 * Disconnect and release USB printer
 */
export async function disconnectUsbPrinter(): Promise<void> {
    if (activeDevice) {
        try {
            if (activeInterfaceNumber !== null) {
                await activeDevice.releaseInterface(activeInterfaceNumber);
            }
            if (activeDevice.opened) {
                await activeDevice.close();
            }
        } catch (e) {
            console.warn('Gagal disconnect USB device cleanly:', e);
        } finally {
            activeDevice = null;
            activeEndpointNumber = null;
            activeInterfaceNumber = null;
        }
    }
}

// ==========================================
// ESC/POS COMMAND BUILDER (80mm & 58mm)
// ==========================================

export class EscPosBuilder {
    private buffer: number[] = [];
    private encoder = new TextEncoder();
    private lineWidth: number;

    constructor(paperWidth: '80mm' | '58mm' = '80mm') {
        // Standar karakter per baris Font A (12x24): 80mm = 48 karakter, 58mm = 32 karakter
        this.lineWidth = paperWidth === '80mm' ? 48 : 32;
    }

    getLineWidth(): number {
        return this.lineWidth;
    }

    init(): this {
        this.buffer.push(0x1b, 0x40); // ESC @
        return this;
    }

    align(alignment: 'left' | 'center' | 'right'): this {
        const val = alignment === 'center' ? 0x01 : alignment === 'right' ? 0x02 : 0x00;
        this.buffer.push(0x1b, 0x61, val); // ESC a n
        return this;
    }

    bold(enable: boolean = true): this {
        this.buffer.push(0x1b, 0x45, enable ? 0x01 : 0x00); // ESC E n
        return this;
    }

    size(type: 'normal' | 'double-height' | 'double-width' | 'double'): this {
        let val = 0x00;
        if (type === 'double-height') val = 0x01;
        else if (type === 'double-width') val = 0x10;
        else if (type === 'double') val = 0x11;
        this.buffer.push(0x1d, 0x21, val); // GS ! n
        return this;
    }

    rawText(text: string): this {
        const bytes = this.encoder.encode(text);
        for (let i = 0; i < bytes.length; i++) {
            this.buffer.push(bytes[i]);
        }
        return this;
    }

    line(text: string = ''): this {
        this.rawText(text);
        this.buffer.push(0x0a); // LF
        return this;
    }

    feed(lines: number = 1): this {
        this.buffer.push(0x1b, 0x64, Math.max(1, lines)); // ESC d n
        return this;
    }

    divider(char: string = '-'): this {
        this.align('left');
        this.size('normal');
        this.bold(false);
        this.line(char.repeat(this.lineWidth));
        return this;
    }

    /**
     * Format baris 2 kolom rata kiri & rata kanan (misal: Subtotal Rp 50.000)
     */
    line2Col(left: string, right: string, bold: boolean = false): this {
        this.align('left');
        this.size('normal');
        this.bold(bold);

        const leftLen = left.length;
        const rightLen = right.length;
        const spaceCount = this.lineWidth - leftLen - rightLen;

        if (spaceCount >= 1) {
            this.line(left + ' '.repeat(spaceCount) + right);
        } else {
            // Jika kepanjangan, potong teks kiri dengan elipsis
            const maxLeft = Math.max(0, this.lineWidth - rightLen - 2);
            const truncatedLeft = left.slice(0, maxLeft) + '..';
            const remainingSpaces = Math.max(1, this.lineWidth - truncatedLeft.length - rightLen);
            this.line(truncatedLeft + ' '.repeat(remainingSpaces) + right);
        }
        return this;
    }

    cut(full: boolean = false): this {
        this.feed(3);
        this.buffer.push(0x1d, 0x56, full ? 0x00 : 0x01); // GS V n
        return this;
    }

    cashDrawer(): this {
        this.buffer.push(0x1b, 0x70, 0x00, 0x19, 0xfa); // ESC p 0 25 250
        return this;
    }

    build(): Uint8Array {
        return new Uint8Array(this.buffer);
    }
}

// ==========================================
// FORMATTERS FOR RECEIPTS, TEST & Z-REPORT
// ==========================================

function formatRupiahSimple(num: number): string {
    return 'Rp ' + Math.round(num).toLocaleString('id-ID');
}

/**
 * Generate ESC/POS bytes for POS Sales Receipt (80mm default)
 */
export function buildReceiptBytes(order: any, config?: PrinterConfig): Uint8Array {
    const paperWidth = config?.paperWidth || '80mm';
    const builder = new EscPosBuilder(paperWidth);

    builder.init();

    // Open cash drawer at the start if configured
    if (config?.openCashDrawer) {
        builder.cashDrawer();
    }

    // Header Toko (Rata Tengah)
    builder.align('center');
    builder.size('double');
    builder.bold(true);
    builder.line(config?.storeName || 'KASIR LAKSANA');

    builder.size('normal');
    builder.bold(false);
    if (config?.storeAddress) {
        builder.line(config.storeAddress);
    }
    if (config?.storePhone) {
        builder.line(`Telp: ${config.storePhone}`);
    }

    builder.divider('-');

    // Informasi Nota
    builder.align('left');
    builder.line2Col('No. Nota :', order.order_number || '-');
    builder.line2Col(
        'Tanggal  :',
        order.created_at ? formatDateTime(order.created_at) : formatDateTime(new Date())
    );
    builder.line2Col('Kasir    :', order.user_name || 'Kasir');

    builder.divider('-');

    // Daftar Item Belanja
    const items = order.items || [];
    items.forEach((item: any) => {
        // Baris 1: Nama Produk (Bold)
        builder.align('left');
        builder.bold(true);
        builder.line(item.product_name || 'Item');

        // Baris 2: Qty x Harga Satuan (Left) ---- Subtotal (Right)
        builder.bold(false);
        const qty = item.quantity || 1;
        const unit = item.unit_name && item.unit_name !== 'pcs' ? item.unit_name : 'x';
        const price = item.unit_price || item.price || 0;
        const subtotal = item.subtotal || qty * price;

        let tierLabel = '';
        if (item.price_tier && item.price_tier !== 'retail') {
            tierLabel = ` (${item.price_tier.toUpperCase()})`;
        }

        const leftDetail = `  ${qty} ${unit} ${formatRupiahSimple(price)}${tierLabel}`;
        const rightDetail = formatRupiahSimple(subtotal);
        builder.line2Col(leftDetail, rightDetail);
    });

    if (items.length === 0) {
        builder.align('center');
        builder.line('(Tidak ada item belanja)');
    }

    builder.divider('-');

    // Ringkasan Pembayaran
    builder.line2Col('Subtotal', formatRupiahSimple(order.subtotal || 0));

    if (order.discount_amount && Number(order.discount_amount) > 0) {
        builder.line2Col('Diskon', `-${formatRupiahSimple(Number(order.discount_amount))}`);
    }

    if (order.tax_amount && Number(order.tax_amount) > 0) {
        builder.line2Col('Pajak', formatRupiahSimple(Number(order.tax_amount)));
    }

    // Total Belanja (Font lebih besar / tebal)
    builder.divider('=');
    builder.align('left');
    builder.size('double-height');
    builder.bold(true);
    builder.line2Col('TOTAL', formatRupiahSimple(order.total_amount || 0), true);

    builder.size('normal');
    builder.bold(false);

    if (order.amount_paid !== undefined && Number(order.amount_paid) > 0) {
        builder.line2Col('Tunai / Bayar', formatRupiahSimple(Number(order.amount_paid)));
        const change = Number(order.amount_paid) - Number(order.total_amount || 0);
        builder.line2Col('Kembali', formatRupiahSimple(Math.max(0, change)));
    }

    if (order.payment_method) {
        builder.line2Col('Metode Pembayaran', String(order.payment_method).toUpperCase());
    }

    builder.divider('-');

    // Footer Struk
    builder.align('center');
    builder.bold(true);
    builder.line('TERIMA KASIH');
    builder.bold(false);
    builder.line(config?.receiptFooter || 'Barang yang sudah dibeli tidak dapat ditukar/dikembalikan');

    // Potong Kertas
    if (config?.autoCut !== false) {
        builder.cut(false);
    } else {
        builder.feed(4);
    }

    return builder.build();
}

/**
 * Generate ESC/POS bytes for Test Print Receipt (80mm default)
 */
export function buildTestReceiptBytes(config?: PrinterConfig): Uint8Array {
    const paperWidth = config?.paperWidth || '80mm';
    const builder = new EscPosBuilder(paperWidth);

    builder.init();

    if (config?.openCashDrawer) {
        builder.cashDrawer();
    }

    // Header
    builder.align('center');
    builder.size('double');
    builder.bold(true);
    builder.line(config?.storeName || 'KASIR LAKSANA');

    builder.size('normal');
    builder.bold(false);
    builder.line(config?.storeAddress || 'Alamat Toko');
    builder.line(`Telp: ${config?.storePhone || '-'}`);

    builder.divider('=');

    // Banner Test Print
    builder.align('center');
    builder.bold(true);
    builder.size('double-height');
    builder.line('*** TEST PRINT BERHASIL ***');

    builder.size('normal');
    builder.bold(false);
    builder.line('Koneksi: USB Direct (Kabel OTG)');

    builder.divider('-');

    // Info Konfigurasi
    builder.line2Col('Waktu Test', new Date().toLocaleString('id-ID'));
    builder.line2Col('Ukuran Kertas', paperWidth === '80mm' ? '80mm (48 Karakter)' : '58mm (32 Karakter)');
    builder.line2Col('Auto Cut', config?.autoCut !== false ? 'AKTIF (ON)' : 'MATI');
    builder.line2Col('Cash Drawer', config?.openCashDrawer ? 'AKTIF (ON)' : 'MATI');

    builder.divider('-');

    // Test Perataan & Format Teks
    builder.align('left');
    builder.line('Rata Kiri: Teks Standar Pembelian');
    builder.align('center');
    builder.bold(true);
    builder.line('Rata Tengah: Teks Tebal (Bold)');
    builder.align('right');
    builder.bold(false);
    builder.line('Rata Kanan: Format Harga');

    builder.divider('-');

    // Test Baris 2 Kolom
    builder.line2Col('Produk Contoh A', 'Rp 25.000');
    builder.line2Col('Produk Contoh B', 'Rp 75.000');
    builder.divider('=');
    builder.line2Col('TOTAL UJI COBA', 'Rp 100.000', true);

    builder.divider('-');

    // Footer
    builder.align('center');
    builder.line(config?.receiptFooter || 'Printer USB OTG Siap Digunakan!');
    builder.line('Laksana POS Application v1.0 (WebUSB)');

    if (config?.autoCut !== false) {
        builder.cut(false);
    } else {
        builder.feed(4);
    }

    return builder.build();
}

/**
 * Generate ESC/POS bytes for Z-Report (Tutup Kasir)
 */
export function buildZReportBytes(report: any, config?: PrinterConfig): Uint8Array {
    const paperWidth = config?.paperWidth || '80mm';
    const builder = new EscPosBuilder(paperWidth);

    builder.init();

    if (config?.openCashDrawer) {
        builder.cashDrawer();
    }

    builder.align('center');
    builder.size('double');
    builder.bold(true);
    builder.line(config?.storeName || 'KASIR LAKSANA');

    builder.size('normal');
    builder.bold(false);
    builder.line('LAPORAN TUTUP KASIR (Z-REPORT)');
    builder.divider('=');

    // Info Shift
    builder.line2Col('Shift ID', report.shift?.id ? `#${report.shift.id}` : '-');
    builder.line2Col('Kasir', report.shift?.user_name || 'Kasir');
    builder.line2Col('Mulai', report.shift?.started_at ? new Date(report.shift.started_at).toLocaleString('id-ID') : '-');
    builder.line2Col('Tutup', report.shift?.ended_at ? new Date(report.shift.ended_at).toLocaleString('id-ID') : new Date().toLocaleString('id-ID'));

    builder.divider('-');

    // Ringkasan Laci Kas
    builder.align('left');
    builder.bold(true);
    builder.line('REKONSILIASI KAS (LACI UANG):');
    builder.bold(false);

    const cd = report.cash_drawer || {};
    builder.line2Col('Modal Awal Kas', formatRupiahSimple(cd.opening_cash || 0));
    builder.line2Col('Penjualan Tunai (+)', formatRupiahSimple(cd.cash_sales || 0));
    builder.line2Col('Pengeluaran Toko (-)', formatRupiahSimple(cd.total_expenses || 0));
    builder.divider('-');
    builder.line2Col('Uang Sistem (Expected)', formatRupiahSimple(cd.expected_cash || 0), true);

    if (cd.actual_cash !== undefined && cd.actual_cash !== null) {
        builder.line2Col('Uang Fisik Kasir', formatRupiahSimple(cd.actual_cash));
        const diff = cd.cash_difference || 0;
        const diffStr = diff === 0 ? 'PAS (Rp 0)' : (diff > 0 ? `+${formatRupiahSimple(diff)}` : `-${formatRupiahSimple(Math.abs(diff))}`);
        builder.line2Col('Selisih Kas', diffStr, true);
    }

    builder.divider('-');

    // Ringkasan Penjualan
    const sm = report.sales_summary || {};
    builder.align('left');
    builder.bold(true);
    builder.line('RINGKASAN PENJUALAN:');
    builder.bold(false);
    builder.line2Col('Total Transaksi', `${sm.total_orders || 0} Struk`);
    builder.line2Col('Total Penjualan Kotor', formatRupiahSimple(sm.gross_sales || 0));
    if (sm.total_discount > 0) {
        builder.line2Col('Total Diskon', `-${formatRupiahSimple(sm.total_discount)}`);
    }
    builder.line2Col('Penjualan Bersih (Net)', formatRupiahSimple(sm.net_sales || 0), true);
    builder.line2Col('Non-Tunai (QRIS/Transfer)', formatRupiahSimple(cd.non_cash_sales || 0));

    builder.divider('=');
    builder.align('center');
    builder.line('Laporan ini dicetak otomatis');
    builder.line('oleh Laksana POS System');

    if (config?.autoCut !== false) {
        builder.cut(false);
    } else {
        builder.feed(4);
    }

    return builder.build();
}

/**
 * Print sales receipt directly to USB printer
 */
export async function printReceiptUsb(order: any, config?: PrinterConfig): Promise<boolean> {
    const bytes = buildReceiptBytes(order, config);
    await sendRawUsb(bytes);
    return true;
}

/**
 * Print test receipt directly to USB printer
 */
export async function printTestReceiptUsb(config?: PrinterConfig): Promise<boolean> {
    const bytes = buildTestReceiptBytes(config);
    await sendRawUsb(bytes);
    return true;
}

/**
 * Print Z-report directly to USB printer
 */
export async function printZReportUsb(report: any, config?: PrinterConfig): Promise<boolean> {
    const bytes = buildZReportBytes(report, config);
    await sendRawUsb(bytes);
    return true;
}
