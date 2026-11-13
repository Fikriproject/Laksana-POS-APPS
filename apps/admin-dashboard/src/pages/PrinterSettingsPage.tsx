import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { DashboardContextType } from '../layouts/DashboardLayout';
import toast from 'react-hot-toast';
import PrintableTestReceipt, { PrinterConfig } from '../components/PrintableTestReceipt';
import api from '../services/api';

const DEFAULT_CONFIG: PrinterConfig = {
    name: 'Printer Kasir Utama (POS-80)',
    connectionType: 'tcp',
    ipAddress: '192.168.1.200',
    port: 9100,
    paperWidth: '80mm',
    autoCut: true,
    openCashDrawer: true,
    storeName: 'Kasir Laksana',
    storeAddress: 'Kramat Dukupuntang',
    storePhone: '+62 851-8316-7100',
    receiptFooter: 'Terima kasih atas kunjungan Anda'
};

const PrinterSettingsPage: React.FC = () => {
    const { toggleSidebar } = useOutletContext<DashboardContextType>();

    const [config, setConfig] = useState<PrinterConfig>(() => {
        try {
            const saved = localStorage.getItem('pos_printer_settings');
            if (saved) {
                return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.error('Failed to parse printer settings from localStorage', e);
        }
        return DEFAULT_CONFIG;
    });

    const [isTestingSocket, setIsTestingSocket] = useState(false);
    const [socketStatus, setSocketStatus] = useState<'idle' | 'success' | 'failed'>('idle');

    // Save to localStorage
    const handleSave = () => {
        try {
            localStorage.setItem('pos_printer_settings', JSON.stringify(config));
            toast.success('Pengaturan printer berhasil disimpan!', {
                icon: '🖨️',
                duration: 3000
            });
        } catch (e) {
            toast.error('Gagal menyimpan pengaturan.');
        }
    };

    // Reset to default settings
    const handleReset = () => {
        if (window.confirm('Kembalikan konfigurasi printer ke pengaturan bawaan (192.168.1.200:9100, Kertas 80mm)?')) {
            setConfig(DEFAULT_CONFIG);
            localStorage.setItem('pos_printer_settings', JSON.stringify(DEFAULT_CONFIG));
            toast.success('Pengaturan printer dikembalikan ke default.');
        }
    };

    // Test print via browser dialog / POS-80 driver
    const handleTestPrint = () => {
        // Simpan dulu setting aktif
        localStorage.setItem('pos_printer_settings', JSON.stringify(config));

        toast.loading('Menyiapkan struk uji coba...', { id: 'test-print', duration: 1500 });

        setTimeout(() => {
            window.print();
            toast.success('Perintah cetak uji coba terkirim!', { id: 'test-print' });
        }, 300);
    };

    // Test connection direct socket ke backend jika server lokal
    const handleTestSocket = async () => {
        setIsTestingSocket(true);
        setSocketStatus('idle');
        try {
            const res = await api.post('/printer/test-connection', {
                ip: config.ipAddress,
                port: config.port
            });
            if (res.data?.success) {
                setSocketStatus('success');
                toast.success(res.data.message || `Berhasil terhubung ke ${config.ipAddress}:${config.port}!`);
            } else {
                setSocketStatus('failed');
                toast.error(res.data?.message || `Gagal terhubung ke printer ${config.ipAddress}:${config.port}`);
            }
        } catch (err: any) {
            setSocketStatus('failed');
            // Jika backend offline atau cloud tidak bisa jangkau IP lokal, beri tahu dengan ramah
            toast(
                `Catatan: Direct socket backend tidak dapat menjangkau ${config.ipAddress} jika server berada di cloud. Cetak dari tablet tetap berjalan via driver sistem POS-80.`,
                { icon: 'ℹ️', duration: 5000 }
            );
        } finally {
            setIsTestingSocket(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white print:hidden">
            {/* Header */}
            <header className="flex-shrink-0 px-4 md:px-8 py-4 md:py-6 border-b border-slate-200 dark:border-[#282839] bg-white dark:bg-surface-dark transition-colors">
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 -ml-2 text-gray-500 dark:text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 shrink-0"
                        title="Buka Menu"
                    >
                        <span className="material-symbols-outlined text-[24px]">menu</span>
                    </button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[28px] sm:text-[32px]">print</span>
                            Pengaturan Printer
                        </h1>
                        <p className="text-gray-500 dark:text-text-secondary text-xs sm:text-sm mt-1">
                            Konfigurasi printer thermal LAN, WiFi, dan Bluetooth untuk mencetak nota dari tablet, HP, dan PC.
                        </p>
                    </div>
                </div>
            </header>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Column: Form Pengaturan (7 Cols) */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                        {/* Card 1: Konfigurasi Jaringan & Perangkat */}
                        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-[#282839] p-5 sm:p-6 shadow-sm space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#282839]">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-9 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[20px]">router</span>
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-base text-gray-900 dark:text-white">Koneksi & Perangkat Printer</h2>
                                        <p className="text-xs text-gray-500 dark:text-text-secondary">Pilih tipe koneksi dan alamat IP printer</p>
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    Aktif
                                </span>
                            </div>

                            {/* Nama Printer */}
                            <div className="space-y-1.5">
                                <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Nama Printer / Device Label
                                </label>
                                <input
                                    type="text"
                                    value={config.name}
                                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                                    placeholder="Contoh: Printer Kasir Utama (POS-80)"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#282839] bg-gray-50 dark:bg-[#111118] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-all font-medium"
                                />
                            </div>

                            {/* Jenis Koneksi / Interface */}
                            <div className="space-y-1.5">
                                <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Jenis Koneksi / Interface
                                </label>
                                <select
                                    value={config.connectionType}
                                    onChange={(e) => setConfig({ ...config, connectionType: e.target.value as any })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#282839] bg-gray-50 dark:bg-[#111118] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-all font-medium"
                                >
                                    <option value="tcp">LAN, WiFi, Ethernet, atau TCP/IP (Rekomendasi POS Network)</option>
                                    <option value="system">Driver Sistem Tablet / Browser (POS-80 Driver)</option>
                                    <option value="bluetooth">Bluetooth Thermal Printer</option>
                                    <option value="usb">USB Direct Cable</option>
                                </select>
                            </div>

                            {/* IP Address & Port */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-2 space-y-1.5">
                                    <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Alamat IP (IP Address)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={config.ipAddress}
                                            onChange={(e) => setConfig({ ...config, ipAddress: e.target.value.trim() })}
                                            placeholder="192.168.1.200"
                                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#282839] bg-gray-50 dark:bg-[#111118] font-mono text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-all font-bold"
                                        />
                                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[18px]">
                                            lan
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-text-secondary">
                                        IP static printer thermal di jaringan lokal toko Anda.
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Port (Default: 9100)
                                    </label>
                                    <input
                                        type="number"
                                        value={config.port}
                                        onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 9100 })}
                                        placeholder="9100"
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#282839] bg-gray-50 dark:bg-[#111118] font-mono text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-all font-bold"
                                    />
                                    <p className="text-[11px] text-gray-500 dark:text-text-secondary">
                                        Standard RAW port
                                    </p>
                                </div>
                            </div>

                            {/* Ukuran Kertas */}
                            <div className="space-y-2">
                                <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Ukuran Kertas (Paper Width)
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setConfig({ ...config, paperWidth: '80mm' })}
                                        className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                                            config.paperWidth === '80mm'
                                                ? 'border-primary bg-primary/10 text-primary dark:text-indigo-400 font-bold shadow-sm'
                                                : 'border-slate-200 dark:border-[#282839] hover:bg-gray-50 dark:hover:bg-[#1c1c27] text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                                            <div>
                                                <div className="text-sm font-bold">80mm (Standar POS-80)</div>
                                                <div className="text-[11px] opacity-75">Lebar, jelas, pas untuk driver POS-80</div>
                                            </div>
                                        </div>
                                        {config.paperWidth === '80mm' && (
                                            <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setConfig({ ...config, paperWidth: '58mm' })}
                                        className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                                            config.paperWidth === '58mm'
                                                ? 'border-primary bg-primary/10 text-primary dark:text-indigo-400 font-bold shadow-sm'
                                                : 'border-slate-200 dark:border-[#282839] hover:bg-gray-50 dark:hover:bg-[#1c1c27] text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span className="material-symbols-outlined text-[20px]">receipt</span>
                                            <div>
                                                <div className="text-sm font-bold">58mm (Ringkas / Mini)</div>
                                                <div className="text-[11px] opacity-75">Format sempit untuk printer mobile</div>
                                            </div>
                                        </div>
                                        {config.paperWidth === '58mm' && (
                                            <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Fitur Hardware: Auto Cut & Cash Drawer */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-[#282839] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#151520] transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={config.autoCut}
                                        onChange={(e) => setConfig({ ...config, autoCut: e.target.checked })}
                                        className="size-4.5 rounded text-primary focus:ring-primary dark:bg-[#111118]"
                                    />
                                    <div>
                                        <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">Auto-Cut Paper</div>
                                        <div className="text-[11px] text-gray-500">Potong kertas otomatis setelah struk selesai</div>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-[#282839] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#151520] transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={config.openCashDrawer}
                                        onChange={(e) => setConfig({ ...config, openCashDrawer: e.target.checked })}
                                        className="size-4.5 rounded text-primary focus:ring-primary dark:bg-[#111118]"
                                    />
                                    <div>
                                        <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">Buka Laci Uang (RJ11)</div>
                                        <div className="text-[11px] text-gray-500">Kirim sinyal buka cash drawer saat mencetak</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Card 2: Header & Footer Struk */}
                        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-[#282839] p-5 sm:p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-[#282839]">
                                <div className="size-9 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[20px]">badge</span>
                                </div>
                                <div>
                                    <h2 className="font-bold text-base text-gray-900 dark:text-white">Informasi Struk / Nota</h2>
                                    <p className="text-xs text-gray-500 dark:text-text-secondary">Identitas toko yang tercetak di atas dan bawah nota</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Nama Toko</label>
                                    <input
                                        type="text"
                                        value={config.storeName}
                                        onChange={(e) => setConfig({ ...config, storeName: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#282839] bg-gray-50 dark:bg-[#111118] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-all font-semibold"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">No. Telepon Toko</label>
                                    <input
                                        type="text"
                                        value={config.storePhone}
                                        onChange={(e) => setConfig({ ...config, storePhone: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#282839] bg-gray-50 dark:bg-[#111118] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Alamat Toko</label>
                                <input
                                    type="text"
                                    value={config.storeAddress}
                                    onChange={(e) => setConfig({ ...config, storeAddress: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#282839] bg-gray-50 dark:bg-[#111118] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Pesan Penutup Struk (Footer)</label>
                                <textarea
                                    rows={2}
                                    value={config.receiptFooter}
                                    onChange={(e) => setConfig({ ...config, receiptFooter: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#282839] bg-gray-50 dark:bg-[#111118] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-all resize-none"
                                />
                            </div>
                        </div>

                        {/* Action Buttons: Simpan & Reset */}
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleSave}
                                className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm sm:text-base"
                            >
                                <span className="material-symbols-outlined text-[20px]">save</span>
                                <span>Simpan Pengaturan</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="h-12 px-5 border border-slate-200 dark:border-[#282839] bg-white dark:bg-surface-dark text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm"
                                title="Kembalikan ke default"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Live Struk Preview & Testing (5 Cols) */}
                    <div className="lg:col-span-5 flex flex-col gap-6">

                        {/* Verification / Test Print Card */}
                        <div className="bg-gradient-to-br from-primary/10 via-white to-indigo-50 dark:from-primary/15 dark:via-surface-dark dark:to-surface-dark rounded-2xl border border-primary/30 p-5 sm:p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
                                    <h3 className="font-bold text-base text-gray-900 dark:text-white">Uji Coba Cetak (Test Print)</h3>
                                </div>
                            </div>

                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                Pastikan tablet/HP Anda sudah terhubung ke WiFi toko dan driver <strong>POS-80</strong> aktif. Klik tombol di bawah untuk mencetak struk uji coba:
                            </p>

                            {/* Tombol Test Print Utama */}
                            <button
                                type="button"
                                onClick={handleTestPrint}
                                className="w-full h-13 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm sm:text-base rounded-xl shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5"
                            >
                                <span className="material-symbols-outlined text-[22px]">print</span>
                                <span>Test Print / Cetak Uji Coba</span>
                            </button>

                            {/* Opsi Ping / Socket Test */}
                            <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs">
                                <span className="text-gray-500 dark:text-[#9d9db9]">
                                    Target Socket: <code className="font-bold text-gray-900 dark:text-white">{config.ipAddress}:{config.port}</code>
                                </span>
                                <button
                                    type="button"
                                    onClick={handleTestSocket}
                                    disabled={isTestingSocket}
                                    className="text-primary hover:underline font-semibold flex items-center gap-1 disabled:opacity-50"
                                >
                                    {isTestingSocket ? (
                                        <>
                                            <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span>
                                            <span>Mengecek...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[14px]">sensors</span>
                                            <span>Tes Sambungan</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Struk Thermal Mockup / Live Preview */}
                        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-[#282839] p-5 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[18px] text-gray-400">preview</span>
                                    Preview Tampilan Nota ({config.paperWidth})
                                </h3>
                                <span className="text-[10px] font-mono bg-gray-100 dark:bg-background-dark text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded font-semibold">
                                    {config.paperWidth === '80mm' ? 'Lebar 80mm / 48 char' : 'Lebar 58mm / 32 char'}
                                </span>
                            </div>

                            {/* Kertas Struk Simulasi */}
                            <div className="bg-amber-50/50 dark:bg-[#111118] border-2 border-dashed border-slate-300 dark:border-[#282839] rounded-xl p-4 font-mono text-[11px] text-gray-900 dark:text-gray-200 space-y-2 select-none shadow-inner max-w-[340px] mx-auto">
                                <div className="text-center">
                                    <div className="font-extrabold text-sm uppercase">{config.storeName || 'KASIR LAKSANA'}</div>
                                    <div className="text-[10px] text-gray-500">{config.storeAddress || 'Alamat Toko'}</div>
                                    <div className="text-[10px] text-gray-500">Telp: {config.storePhone || '-'}</div>
                                </div>
                                <div className="border-b border-dashed border-gray-400 my-1"></div>
                                <div className="text-[10px] flex justify-between">
                                    <span>Tgl: {new Date().toLocaleDateString('id-ID')}</span>
                                    <span>Kasir: Kasir 1</span>
                                </div>
                                <div className="border-b border-dashed border-gray-400 my-1"></div>
                                <div className="space-y-1">
                                    <div>
                                        <div className="font-semibold">Buku Catatan A5</div>
                                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                            <span>2 x Rp 15.000</span>
                                            <span>Rp 30.000</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-semibold">Pulpen Gel 0.5mm</div>
                                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                            <span>1 x Rp 5.000</span>
                                            <span>Rp 5.000</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="border-b border-dashed border-gray-400 my-1"></div>
                                <div className="space-y-0.5">
                                    <div className="flex justify-between font-bold text-xs">
                                        <span>TOTAL</span>
                                        <span>Rp 35.000</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                        <span>TUNAI</span>
                                        <span>Rp 50.000</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                        <span>KEMBALI</span>
                                        <span>Rp 15.000</span>
                                    </div>
                                </div>
                                <div className="border-b border-dashed border-gray-400 my-2"></div>
                                <div className="text-center text-[10px] text-gray-500">
                                    <div>{config.receiptFooter || 'Terima kasih atas kunjungan Anda'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Petunjuk Koneksi Singkat */}
                        <div className="bg-slate-50 dark:bg-background-dark rounded-2xl border border-slate-200 dark:border-[#282839] p-4 text-xs space-y-2 text-gray-600 dark:text-text-secondary">
                            <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px] text-amber-500">lightbulb</span>
                                Tips Cetak dari Tablet & HP:
                            </h4>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>
                                    Pastikan tablet terhubung ke <strong>WiFi/Router yang sama</strong> dengan printer (<code className="font-bold">192.168.1.xxx</code>).
                                </li>
                                <li>
                                    Pada tablet Android, tambahkan layanan pencetakan driver <strong>POS-80</strong> atau <strong>RawBT</strong> pada menu <em>Pengaturan &rarr; Perangkat Terhubung &rarr; Pencetakan</em>.
                                </li>
                                <li>
                                    Saat dialog cetak muncul, pilih printer <strong>POS-80</strong> dan atur margin ke <strong>Tanpa Margin (None)</strong>.
                                </li>
                            </ul>
                        </div>

                    </div>
                </div>
            </div>

            {/* Hidden Component Khusus Test Print (Hanya Muncul Saat window.print) */}
            <PrintableTestReceipt config={config} />
        </div>
    );
};

export default PrinterSettingsPage;

