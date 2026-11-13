import React from 'react';

export interface PrinterConfig {
    name: string;
    connectionType: 'tcp' | 'bluetooth' | 'usb' | 'system';
    ipAddress: string;
    port: number;
    paperWidth: '80mm' | '58mm';
    autoCut: boolean;
    openCashDrawer: boolean;
    storeName: string;
    storeAddress: string;
    storePhone: string;
    receiptFooter: string;
}

interface PrintableTestReceiptProps {
    config: PrinterConfig;
}

const PrintableTestReceipt: React.FC<PrintableTestReceiptProps> = ({ config }) => {
    const is80mm = config.paperWidth === '80mm';
    const maxWidthClass = is80mm ? 'max-w-[80mm]' : 'max-w-[58mm]';

    return (
        <div id="printable-test-receipt" className="hidden print:block print:w-full print:bg-white text-black font-mono p-4 bg-white text-xs leading-relaxed">
            <div className={`${maxWidthClass} mx-auto`}>
                {/* Header Toko */}
                <div className="text-center mb-3">
                    <h2 className="font-extrabold text-base sm:text-lg uppercase tracking-tight">{config.storeName || 'KASIR LAKSANA'}</h2>
                    {config.storeAddress && <p className="text-[11px]">{config.storeAddress}</p>}
                    {config.storePhone && <p className="text-[11px]">Telp: {config.storePhone}</p>}
                </div>

                <div className="border-b-2 border-dashed border-black my-2"></div>

                {/* Banner Test Print */}
                <div className="text-center py-1 bg-black text-white font-bold text-xs uppercase tracking-wider my-1">
                    *** TEST PRINT BERHASIL ***
                </div>

                <div className="border-b border-dashed border-black my-2"></div>

                {/* Informasi Konfigurasi Printer */}
                <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                        <span>Waktu Test:</span>
                        <span className="font-semibold">{new Date().toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Nama Printer:</span>
                        <span className="font-bold">{config.name || 'Printer Kasir POS-80'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Koneksi:</span>
                        <span className="font-semibold uppercase">{config.connectionType === 'tcp' ? 'LAN / WiFi (TCP/IP)' : config.connectionType}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Alamat IP:</span>
                        <span className="font-bold font-mono text-[12px]">{config.ipAddress}:{config.port}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Ukuran Kertas:</span>
                        <span className="font-bold">{config.paperWidth}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Auto Cut Kertas:</span>
                        <span>{config.autoCut ? 'AKTIF (ON)' : 'TIDAK'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Laci Uang (Drawer):</span>
                        <span>{config.openCashDrawer ? 'AKTIF (ON)' : 'TIDAK'}</span>
                    </div>
                </div>

                <div className="border-b border-dashed border-black my-2.5"></div>

                {/* Uji Perataan Font & Lebar Baris */}
                <div className="text-[10px] space-y-1">
                    <div className="text-left">Rata Kiri: Teks Normal</div>
                    <div className="text-center font-bold">Rata Tengah: Teks Tebal (Bold)</div>
                    <div className="text-right italic">Rata Kanan: Miring (Italic)</div>
                    <div className="flex justify-between font-bold pt-1">
                        <span>KOLOM A</span>
                        <span>KOLOM B</span>
                        <span>KOLOM C</span>
                    </div>
                </div>

                <div className="border-b-2 border-dashed border-black my-3"></div>

                {/* Footer Struk */}
                <div className="text-center text-[11px] space-y-0.5">
                    <p className="font-semibold">{config.receiptFooter || 'Printer siap digunakan untuk transaksi!'}</p>
                    <p className="text-[10px] text-gray-700">Laksana POS Application v1.0</p>
                </div>

                {/* Feed Spacing untuk Thermal Cutter */}
                <div className="h-14"></div>
            </div>
        </div>
    );
};

export default PrintableTestReceipt;
