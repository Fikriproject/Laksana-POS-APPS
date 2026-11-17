import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { formatRupiah } from '../utils/format';
import PrintableZReport, { ZReportData } from '../components/PrintableZReport';
import PrintableReceipt from '../components/PrintableReceipt';
import ThemeToggle from '../components/ThemeToggle';
import UserMenu from '../components/UserMenu';

interface DashboardContextType {
    toggleSidebar: () => void;
}

export const DailySettlementPage = () => {
    const { toggleSidebar } = useOutletContext<DashboardContextType>();
    
    // Default: Hari ini (YYYY-MM-DD)
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });

    const [loading, setLoading] = useState<boolean>(true);
    const [settlementData, setSettlementData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'orders' | 'expenses' | 'shifts'>('orders');
    const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

    // Fetch data setiap kali tanggal berubah
    const fetchSettlement = async (date: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/reports/daily-settlement?date=${date}`);
            setSettlementData(res.data.data);
        } catch (error: any) {
            console.error('Failed to fetch daily settlement:', error);
            toast.error(error.response?.data?.message || 'Gagal memuat rekap harian');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettlement(selectedDate);
    }, [selectedDate]);

    // Format tanggal ramah bahasa Indonesia
    const formatDisplayDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr + 'T00:00:00');
            return d.toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const handleSetToday = () => {
        const now = new Date();
        const dStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        setSelectedDate(dStr);
    };

    const handleSetYesterday = () => {
        const now = new Date();
        now.setDate(now.getDate() - 1);
        const dStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        setSelectedDate(dStr);
    };

    // Data Z-Report untuk cetak thermal / print
    const zReportPrintData: ZReportData | null = settlementData ? {
        title: `REKAP HARIAN - ${formatDisplayDate(selectedDate)}`,
        shift: settlementData.shifts && settlementData.shifts.length > 0 ? {
            id: settlementData.shifts[0].id,
            user_name: settlementData.shifts.map((s: any) => s.user_name).filter(Boolean).join(', ') || 'Semua Kasir',
            started_at: settlementData.shifts[0].started_at,
            ended_at: settlementData.shifts[settlementData.shifts.length - 1].ended_at,
            opening_cash: settlementData.cash_drawer.total_opening_cash,
            closing_cash: settlementData.cash_drawer.actual_cash
        } : undefined,
        cash_drawer: {
            opening_cash: settlementData.cash_drawer.total_opening_cash,
            cash_sales: settlementData.cash_drawer.cash_sales,
            non_cash_sales: settlementData.summary.non_cash_sales,
            total_expenses: settlementData.cash_drawer.total_expenses,
            expected_cash: settlementData.cash_drawer.expected_cash,
            actual_cash: settlementData.cash_drawer.actual_cash,
            cash_difference: settlementData.cash_drawer.cash_difference
        },
        sales_summary: settlementData.summary,
        expenses: settlementData.expenses
    } : null;

    const [printMode, setPrintMode] = useState<'zreport' | 'receipt'>('zreport');

    const handlePrintZReport = () => {
        if (!settlementData) return;
        setPrintMode('zreport');
        setTimeout(() => {
            window.print();
        }, 250);
    };

    const handlePrintReceipt = () => {
        if (!selectedReceipt) return;
        setPrintMode('receipt');
        setTimeout(() => {
            window.print();
        }, 250);
    };

    return (
        <>
            {/* Thermal Print Template (Z-Report or Receipt) */}
            {printMode === 'zreport' ? (
                <PrintableZReport data={zReportPrintData} />
            ) : (
                <PrintableReceipt order={selectedReceipt} />
            )}

            {/* Modal Detail Nota untuk Cetak Ulang */}
            {selectedReceipt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in print:hidden">
                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl w-full max-w-md p-5 shadow-2xl">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-base">Detail Nota {selectedReceipt.order_number}</h3>
                                <p className="text-xs text-gray-500">{new Date(selectedReceipt.created_at).toLocaleString('id-ID')}</p>
                            </div>
                            <button
                                onClick={() => setSelectedReceipt(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>

                        <div className="py-4 space-y-2 max-h-[60vh] overflow-y-auto">
                            <div className="flex justify-between text-xs text-gray-500 pb-1 border-b border-slate-100 dark:border-white/5">
                                <span>Kasir: <strong>{selectedReceipt.cashier_name || 'Admin'}</strong></span>
                                <span>Metode: <strong className="uppercase">{selectedReceipt.payment_method}</strong></span>
                            </div>

                            <div className="space-y-2 pt-2">
                                {selectedReceipt.items && selectedReceipt.items.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between text-xs">
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">{item.product_name}</p>
                                            <p className="text-[11px] text-gray-400">{item.quantity} x {formatRupiah(item.unit_price)}</p>
                                        </div>
                                        <p className="font-bold text-gray-900 dark:text-white">{formatRupiah(item.subtotal)}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-slate-200 dark:border-[#282839] pt-3 space-y-1 text-xs">
                                {selectedReceipt.discount_amount > 0 && (
                                    <div className="flex justify-between text-red-500">
                                        <span>Diskon:</span>
                                        <span>-{formatRupiah(selectedReceipt.discount_amount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-sm text-gray-900 dark:text-white pt-1">
                                    <span>Total Tagihan:</span>
                                    <span className="text-primary">{formatRupiah(selectedReceipt.total_amount)}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Uang Diterima:</span>
                                    <span>{formatRupiah(selectedReceipt.amount_paid || selectedReceipt.total_amount)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                            <button
                                onClick={() => setSelectedReceipt(null)}
                                className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#282839] text-gray-600 dark:text-gray-300"
                            >
                                Tutup
                            </button>
                            <button
                                onClick={handlePrintReceipt}
                                className="flex-1 py-2 text-xs font-bold rounded-xl bg-primary text-white flex items-center justify-center gap-1.5 shadow-md shadow-primary/25"
                            >
                                <span className="material-symbols-outlined text-[16px]">print</span>
                                Cetak Nota
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Konten Halaman Layar */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-light dark:bg-background-dark font-sans print:hidden">
                {/* Header Atas */}
                <header className="border-b border-slate-200 dark:border-[#282839] px-4 sm:px-6 py-3.5 bg-white dark:bg-surface-dark flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleSidebar}
                            className="p-1.5 -ml-1 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[24px]">menu</span>
                        </button>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[22px]">receipt_long</span>
                                Rekap Harian & Tutup Buku
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-text-secondary">
                                {formatDisplayDate(selectedDate)}
                            </p>
                        </div>
                    </div>

                    {/* Filter Tanggal & Tombol Cetak & Theme & User */}
                    <div className="flex items-center flex-wrap gap-2 sm:gap-2.5">
                        <div className="flex items-center bg-gray-100/80 dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-xl p-1 gap-1">
                            <button
                                type="button"
                                onClick={handleSetToday}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                    selectedDate === new Date().toISOString().split('T')[0]
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                Hari Ini
                            </button>
                            <button
                                type="button"
                                onClick={handleSetYesterday}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all"
                            >
                                Kemarin
                            </button>
                            <div className="w-px h-4 bg-slate-300 dark:bg-[#282839] mx-0.5" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="px-2 py-1 text-xs font-semibold bg-transparent text-gray-900 dark:text-white focus:outline-none"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handlePrintZReport}
                            disabled={loading || !settlementData}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/25 transition-all disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-[16px]">print</span>
                            <span className="hidden sm:inline">Cetak Rekap</span> (Z-Report)
                        </button>

                        <div className="flex items-center gap-2 ml-auto sm:ml-0">
                            <ThemeToggle />
                            <UserMenu />
                        </div>
                    </div>
                </header>

                {/* Body Konten */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    {loading ? (
                        <div className="p-16 flex flex-col items-center justify-center text-gray-400 gap-3">
                            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                            <p className="text-sm font-semibold">Memuat rekap data tanggal {selectedDate}...</p>
                        </div>
                    ) : !settlementData ? (
                        <div className="p-12 text-center text-gray-400">
                            Tidak ada data untuk tanggal ini.
                        </div>
                    ) : (
                        <>
                            {/* Kartu Ringkasan KPI Utama */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                {/* Total Omset Bersih */}
                                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-4 sm:p-5 shadow-sm">
                                    <div className="flex items-center justify-between text-gray-500 mb-2">
                                        <span className="text-xs font-semibold">Penjualan Bersih (Omset)</span>
                                        <div className="size-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[18px]">payments</span>
                                        </div>
                                    </div>
                                    <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white">
                                        {formatRupiah(settlementData.summary.net_sales)}
                                    </p>
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        {settlementData.summary.total_orders} Transaksi Sukses
                                    </p>
                                </div>

                                {/* Modal Barang Terjual (HPP) */}
                                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-4 sm:p-5 shadow-sm">
                                    <div className="flex items-center justify-between text-gray-500 mb-2">
                                        <span className="text-xs font-semibold">Modal Barang (HPP)</span>
                                        <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[18px]">inventory</span>
                                        </div>
                                    </div>
                                    <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white">
                                        {formatRupiah(settlementData.summary.total_cogs)}
                                    </p>
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        Modal kulakan produk
                                    </p>
                                </div>

                                {/* Pengeluaran Kasir / Kas Keluar */}
                                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-4 sm:p-5 shadow-sm">
                                    <div className="flex items-center justify-between text-gray-500 mb-2">
                                        <span className="text-xs font-semibold">Kas Keluar Toko</span>
                                        <div className="size-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[18px]">shopping_cart_checkout</span>
                                        </div>
                                    </div>
                                    <p className="text-lg sm:text-2xl font-black text-red-600 dark:text-red-400">
                                        {formatRupiah(settlementData.summary.total_expenses)}
                                    </p>
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        {settlementData.expenses.length} Catatan Biaya Toko
                                    </p>
                                </div>

                                {/* Laba Bersih Hari Ini */}
                                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-4 sm:p-5 shadow-lg shadow-emerald-500/20">
                                    <div className="flex items-center justify-between text-white/80 mb-2">
                                        <span className="text-xs font-bold uppercase tracking-wider">Laba Bersih Hari Ini</span>
                                        <div className="size-8 rounded-lg bg-white/20 text-white flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[18px]">trending_up</span>
                                        </div>
                                    </div>
                                    <p className="text-lg sm:text-2xl font-black text-white">
                                        {formatRupiah(settlementData.summary.net_profit)}
                                    </p>
                                    <p className="text-[11px] text-white/80 mt-1">
                                        Keuntungan riil masuk kantong
                                    </p>
                                </div>
                            </div>

                            {/* Kotak Rekonsiliasi Kas Laci (Sinkronisasi Uang Orang Tua) */}
                            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-5 sm:p-6 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-primary/10 text-primary dark:text-indigo-400 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[22px]">point_of_sale</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white text-base">Rekonsiliasi Kas Laci Kasir</h3>
                                            <p className="text-xs text-gray-500 dark:text-text-secondary">Pencocokan uang fisik di laci dengan catatan otomatis aplikasi</p>
                                        </div>
                                    </div>

                                    {/* Badge Status Selisih */}
                                    {settlementData.cash_drawer.actual_cash !== null ? (
                                        <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                                            settlementData.cash_drawer.cash_difference === 0
                                                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 text-emerald-700'
                                                : settlementData.cash_drawer.cash_difference < 0
                                                ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 text-rose-700'
                                                : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 text-blue-700'
                                        }`}>
                                            <span className="material-symbols-outlined text-[18px]">
                                                {settlementData.cash_drawer.cash_difference === 0 ? 'verified' : 'error'}
                                            </span>
                                            <span>
                                                {settlementData.cash_drawer.cash_difference === 0
                                                    ? 'UANG LACI PAS (SELISIH RP 0)'
                                                    : `SELISIH ${settlementData.cash_drawer.cash_difference > 0 ? '+' : ''}${formatRupiah(settlementData.cash_drawer.cash_difference)}`}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-200 dark:border-amber-800">
                                            Kasir Masih Terbuka (Belum Tutup Shift)
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 text-xs">
                                    <div className="p-3 bg-gray-50 dark:bg-background-dark rounded-xl border border-slate-100 dark:border-[#282839]">
                                        <p className="text-gray-500 mb-1">Modal Kas Awal</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            {formatRupiah(settlementData.cash_drawer.total_opening_cash)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-background-dark rounded-xl border border-slate-100 dark:border-[#282839]">
                                        <p className="text-gray-500 mb-1">Penjualan Tunai (+)</p>
                                        <p className="text-sm font-bold text-green-600">
                                            {formatRupiah(settlementData.cash_drawer.cash_sales)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-background-dark rounded-xl border border-slate-100 dark:border-[#282839]">
                                        <p className="text-gray-500 mb-1">Kas Keluar Toko (-)</p>
                                        <p className="text-sm font-bold text-red-600">
                                            -{formatRupiah(settlementData.cash_drawer.total_expenses)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20">
                                        <p className="text-primary dark:text-indigo-400 font-semibold mb-1">Uang Sistem di Laci</p>
                                        <p className="text-sm font-black text-primary dark:text-indigo-400">
                                            {formatRupiah(settlementData.cash_drawer.expected_cash)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-background-dark rounded-xl border border-slate-100 dark:border-[#282839]">
                                        <p className="text-gray-500 mb-1">Uang Fisik Dihitung</p>
                                        <p className="text-sm font-black text-gray-900 dark:text-white">
                                            {settlementData.cash_drawer.actual_cash !== null
                                                ? formatRupiah(settlementData.cash_drawer.actual_cash)
                                                : '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs Rincian Transaksi, Pengeluaran, dan Shift */}
                            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl overflow-hidden shadow-sm">
                                <div className="flex border-b border-slate-200 dark:border-[#282839] px-4 pt-3 gap-2 overflow-x-auto">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('orders')}
                                        className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                                            activeTab === 'orders'
                                                ? 'border-primary text-primary dark:text-indigo-400'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">receipt</span>
                                        Daftar Transaksi ({settlementData.orders.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('expenses')}
                                        className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                                            activeTab === 'expenses'
                                                ? 'border-primary text-primary dark:text-indigo-400'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">payments</span>
                                        Uang Kas Keluar ({settlementData.expenses.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('shifts')}
                                        className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                                            activeTab === 'shifts'
                                                ? 'border-primary text-primary dark:text-indigo-400'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">lock_clock</span>
                                        Riwayat Shift ({settlementData.shifts.length})
                                    </button>
                                </div>

                                {/* Tab 1: Tabel Seluruh Transaksi / Nota */}
                                {activeTab === 'orders' && (
                                    <div className="overflow-x-auto">
                                        {settlementData.orders.length === 0 ? (
                                            <p className="p-8 text-center text-xs text-gray-400">Tidak ada transaksi penjualan pada tanggal ini.</p>
                                        ) : (
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-gray-50 dark:bg-background-dark/50 text-gray-500 border-b border-slate-200 dark:border-[#282839]">
                                                    <tr>
                                                        <th className="py-3 px-4 font-semibold">No. Nota</th>
                                                        <th className="py-3 px-4 font-semibold">Jam</th>
                                                        <th className="py-3 px-4 font-semibold">Kasir</th>
                                                        <th className="py-3 px-4 font-semibold">Produk Dibeli</th>
                                                        <th className="py-3 px-4 font-semibold">Metode</th>
                                                        <th className="py-3 px-4 font-semibold text-right">Total Nota</th>
                                                        <th className="py-3 px-4 font-semibold text-center">Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                                    {settlementData.orders.map((ord: any) => (
                                                        <tr key={ord.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                            <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                                                                {ord.order_number}
                                                            </td>
                                                            <td className="py-3 px-4 text-gray-500">
                                                                {new Date(ord.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                            </td>
                                                            <td className="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">
                                                                {ord.cashier_name || 'Admin'}
                                                            </td>
                                                            <td className="py-3 px-4 max-w-xs truncate text-gray-600 dark:text-gray-400">
                                                                {ord.items && ord.items.length > 0
                                                                    ? ord.items.map((it: any) => `${it.product_name} (${it.quantity})`).join(', ')
                                                                    : '-'}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                                                                    ord.payment_method === 'cash'
                                                                        ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                                                }`}>
                                                                    {ord.payment_method}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4 font-bold text-right text-gray-900 dark:text-white">
                                                                {formatRupiah(ord.total_amount)}
                                                            </td>
                                                            <td className="py-3 px-4 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedReceipt(ord)}
                                                                    className="px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                                >
                                                                    Lihat Nota
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}

                                {/* Tab 2: Tabel Pengeluaran Kasir */}
                                {activeTab === 'expenses' && (
                                    <div className="overflow-x-auto">
                                        {settlementData.expenses.length === 0 ? (
                                            <p className="p-8 text-center text-xs text-gray-400">Tidak ada pengeluaran kas tercatat pada tanggal ini.</p>
                                        ) : (
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-gray-50 dark:bg-background-dark/50 text-gray-500 border-b border-slate-200 dark:border-[#282839]">
                                                    <tr>
                                                        <th className="py-3 px-4 font-semibold">Jam</th>
                                                        <th className="py-3 px-4 font-semibold">Kasir</th>
                                                        <th className="py-3 px-4 font-semibold">Kategori</th>
                                                        <th className="py-3 px-4 font-semibold">Keterangan / Keperluan</th>
                                                        <th className="py-3 px-4 font-semibold text-right">Nominal</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                                    {settlementData.expenses.map((exp: any) => (
                                                        <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                            <td className="py-3 px-4 text-gray-500">
                                                                {exp.created_at ? new Date(exp.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                            </td>
                                                            <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                                                                {exp.user_name || 'Kasir'}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-background-dark border border-slate-200 dark:border-[#282839]">
                                                                    {exp.category}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4 text-gray-800 dark:text-gray-200">
                                                                {exp.description || '-'}
                                                            </td>
                                                            <td className="py-3 px-4 font-bold text-right text-red-600 dark:text-red-400">
                                                                {formatRupiah(exp.amount)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}

                                {/* Tab 3: Tabel Riwayat Shift */}
                                {activeTab === 'shifts' && (
                                    <div className="overflow-x-auto">
                                        {settlementData.shifts.length === 0 ? (
                                            <p className="p-8 text-center text-xs text-gray-400">Tidak ada data shift kasir pada tanggal ini.</p>
                                        ) : (
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-gray-50 dark:bg-background-dark/50 text-gray-500 border-b border-slate-200 dark:border-[#282839]">
                                                    <tr>
                                                        <th className="py-3 px-4 font-semibold">Kasir</th>
                                                        <th className="py-3 px-4 font-semibold">Waktu Buka</th>
                                                        <th className="py-3 px-4 font-semibold">Waktu Tutup</th>
                                                        <th className="py-3 px-4 font-semibold">Modal Awal</th>
                                                        <th className="py-3 px-4 font-semibold">Kas Akhir</th>
                                                        <th className="py-3 px-4 font-semibold">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                                    {settlementData.shifts.map((s: any) => (
                                                        <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                            <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                                                                {s.user_name || 'Kasir'}
                                                            </td>
                                                            <td className="py-3 px-4 text-gray-500">
                                                                {new Date(s.started_at).toLocaleTimeString('id-ID')}
                                                            </td>
                                                            <td className="py-3 px-4 text-gray-500">
                                                                {s.ended_at ? new Date(s.ended_at).toLocaleTimeString('id-ID') : '-'}
                                                            </td>
                                                            <td className="py-3 px-4 font-semibold">
                                                                {formatRupiah(s.opening_cash)}
                                                            </td>
                                                            <td className="py-3 px-4 font-semibold">
                                                                {s.closing_cash !== null ? formatRupiah(s.closing_cash) : '-'}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                                                                    s.status === 'open'
                                                                        ? 'bg-amber-100 text-amber-700'
                                                                        : 'bg-green-100 text-green-700'
                                                                }`}>
                                                                    {s.status === 'open' ? 'Sedang Aktif' : 'Sudah Ditutup'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default DailySettlementPage;
