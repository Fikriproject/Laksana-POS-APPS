import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';
import { formatRupiah } from '../utils/format';
import { useTheme } from '../context/ThemeContext';
import { DashboardContextType } from '../layouts/DashboardLayout';
import ThemeToggle from '../components/ThemeToggle';
import UserMenu from '../components/UserMenu';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import EmployeeTransactionsModal from '../components/EmployeeTransactionsModal';

// --- Interfaces ---

interface SalesSummary {
    total_transactions: number;
    total_revenue: number;
    total_tax: number;
    total_discounts: number;
    avg_order_value: number;
    completed_orders: number;
    refunded_orders: number;
}

interface SalesByDate {
    date: string;
    transactions: number;
    revenue: number;
    [key: string]: any;
}

interface SalesByCategory {
    category: string;
    transactions: number;
    items_sold: number;
    revenue: number;
    [key: string]: any;
}

interface TopProduct {
    id: string;
    name: string;
    sku: string;
    price: number;
    category: string;
    total_sold: number;
    total_revenue: number;
}

interface InventoryStatus {
    total_products: number;
    active_products: number;
    low_stock_products: number;
    out_of_stock_products: number;
    total_inventory_value: number;
}

interface EmployeePerformance {
    id: string;
    full_name: string;
    employee_id: string;
    avatar_url: string;
    transactions: number;
    total_sales: number;
    avg_sale: number;
    [key: string]: any;
}


interface Expense {
    id: string;
    category: string;
    amount: number;
    description: string;
    created_at: string;
    user_name?: string;
}

interface ExpenseSummary {
    category: string;
    total: number;
    [key: string]: any;
}

interface DailyFinancial {
    date: string;
    revenue: number;
    expense: number;
    net_profit: number;
}

const formatLocalDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// --- Component ---

const ReportsPage = () => {
    // State
    const { toggleSidebar } = useOutletContext<DashboardContextType>();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'employees' | 'tax'>('sales');
    const [dateRange, setDateRange] = useState(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
            start: formatLocalDate(startOfMonth),
            end: formatLocalDate(now)
        };
    });
    const [filterType, setFilterType] = useState<'today' | 'week' | 'month' | 'custom'>('month');
    const [financialGroupBy, setFinancialGroupBy] = useState<'day' | 'week' | 'month' | 'year'>('day');

    // Data State
    const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
    const [salesByDate, setSalesByDate] = useState<SalesByDate[]>([]);
    const [salesByCategory, setSalesByCategory] = useState<SalesByCategory[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus | null>(null);
    const [employeeStats, setEmployeeStats] = useState<EmployeePerformance[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null);
    const [dailyFinancials, setDailyFinancials] = useState<DailyFinancial[]>([]);

    // Expense State
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary[]>([]);
    const [isAddingExpense, setIsAddingExpense] = useState(false);
    const [newExpense, setNewExpense] = useState({
        category: 'Belanja',
        amount: '',
        description: ''
    });
    const expenseCategories = ['Operasional', 'Belanja', 'Konsumsi', 'Tamu', 'Infaq', 'Lainnya', 'Tanah sewa', 'Arisan'];

    // Race condition handling
    const requestRef = useRef<number>(0);

    // --- Helpers ---

    const handleFilterChange = (type: 'today' | 'week' | 'month') => {
        setFilterType(type);
        const end = new Date();
        let start = new Date();

        if (type === 'today') {
            // Start is same as end (today)
        } else if (type === 'week') {
            start.setDate(end.getDate() - 7);
        } else if (type === 'month') {
            start = new Date(end.getFullYear(), end.getMonth(), 1);
        }

        setDateRange({
            start: formatLocalDate(start),
            end: formatLocalDate(end)
        });
    };

    const fetchSalesData = async () => {
        const requestId = ++requestRef.current;
        setLoading(true);
        setError(null);
        try {
            const params = { start_date: dateRange.start, end_date: `${dateRange.end} 23:59:59` };

            const [summaryRes, byDateRes, byCatRes, topProdRes, dailyFinRes] = await Promise.all([
                api.get('/reports/sales/summary', { params }),
                api.get('/reports/sales/by-date', { params: { ...params, group_by: filterType === 'today' ? 'hour' : 'day' } }),
                api.get('/reports/sales/by-category', { params }),
                api.get('/reports/products/top-selling', { params: { ...params, limit: 5 } }),
                api.get('/reports/sales/daily-financials', { params: { ...params, group_by: financialGroupBy } })
            ]);

            if (requestId !== requestRef.current) return;

            setSalesSummary({
                ...summaryRes.data.data,
                total_transactions: Number(summaryRes.data.data.total_transactions),
                total_revenue: Number(summaryRes.data.data.total_revenue),
                total_tax: Number(summaryRes.data.data.total_tax),
                total_discounts: Number(summaryRes.data.data.total_discounts),
                avg_order_value: Number(summaryRes.data.data.avg_order_value),
                completed_orders: Number(summaryRes.data.data.completed_orders),
                refunded_orders: Number(summaryRes.data.data.refunded_orders),
            });
            setSalesByDate(byDateRes.data.data.map((item: any) => ({
                ...item,
                transactions: Number(item.transactions),
                revenue: Number(item.revenue)
            })));
            setSalesByCategory(byCatRes.data.data.map((item: any) => ({
                ...item,
                transactions: Number(item.transactions),
                items_sold: Number(item.items_sold),
                revenue: Number(item.revenue)
            })));
            setTopProducts(topProdRes.data.data.map((item: any) => ({
                ...item,
                price: Number(item.price),
                total_sold: Number(item.total_sold),
                total_revenue: Number(item.total_revenue)
            })));
            setDailyFinancials(dailyFinRes.data.data.map((item: any) => ({
                date: item.date,
                revenue: Number(item.revenue),
                expense: Number(item.expense),
                net_profit: Number(item.net_profit)
            })));
        } catch (error) {
            if (requestId === requestRef.current) {
                console.error("Failed to fetch sales reports", error);
                setError("Gagal memuat laporan penjualan. Silakan coba lagi.");
            }
        } finally {
            if (requestId === requestRef.current) {
                setLoading(false);
            }
        }
    };

    const fetchInventoryData = async () => {
        const requestId = ++requestRef.current;
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/reports/inventory/status');

            if (requestId !== requestRef.current) return;

            const data = response.data.data;
            setInventoryStatus({
                ...data,
                total_products: Number(data.total_products),
                active_products: Number(data.active_products),
                low_stock_products: Number(data.low_stock_products),
                out_of_stock_products: Number(data.out_of_stock_products),
                total_inventory_value: Number(data.total_inventory_value)
            });
        } catch (error) {
            if (requestId === requestRef.current) {
                console.error("Failed to fetch inventory reports", error);
                setError("Gagal memuat status inventaris.");
            }
        } finally {
            if (requestId === requestRef.current) {
                setLoading(false);
            }
        }
    };

    const fetchEmployeeData = async () => {
        const requestId = ++requestRef.current;
        setLoading(true);
        setError(null);
        try {
            const params = { start_date: dateRange.start, end_date: `${dateRange.end} 23:59:59` };
            const response = await api.get('/reports/employees/performance', { params });

            if (requestId !== requestRef.current) return;

            setEmployeeStats(response.data.data.map((item: any) => ({
                ...item,
                transactions: Number(item.transactions),
                total_sales: Number(item.total_sales),
                avg_sale: Number(item.avg_sale)
            })));
        } catch (error) {
            if (requestId === requestRef.current) {
                console.error("Failed to fetch employee reports", error);
                setError("Gagal memuat kinerja karyawan.");
            }
        } finally {
            if (requestId === requestRef.current) {
                setLoading(false);
            }
        }
    };

    const fetchExpensesData = async () => {
        const requestId = ++requestRef.current;
        setLoading(true);
        setError(null);
        try {
            const params = { start_date: dateRange.start, end_date: `${dateRange.end} 23:59:59` };

            const [listRes, summaryRes] = await Promise.all([
                api.get('/expenses', { params }),
                api.get('/expenses', { params: { ...params, summary: 'true' } })
            ]);

            if (requestId !== requestRef.current) return;

            setExpenses(listRes.data.data.map((item: any) => ({
                ...item,
                amount: Number(item.amount)
            })));
            setExpenseSummary(summaryRes.data.data.map((item: any) => ({
                category: item.category,
                total: Number(item.total)
            })));
        } catch (error) {
            if (requestId === requestRef.current) {
                console.error("Failed to fetch expenses", error);
                // Don't block the whole page if expenses fail, just log
            }
        } finally {
            if (requestId === requestRef.current) {
                setLoading(false);
            }
        }
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/expenses', {
                ...newExpense,
                amount: parseFloat(newExpense.amount),
                date: new Date().toISOString() // Use current time for expense
            });
            setIsAddingExpense(false);
            setNewExpense({ category: 'Belanja', amount: '', description: '' });
            fetchExpensesData(); // Refresh list
            // Also refresh sales data if needed, but expenses are usually separate from sales revenue unless calculated together
        } catch (err) {
            alert('Gagal menyimpan pengeluaran');
            console.error(err);
        }
    };

    // --- Effects ---

    useEffect(() => {
        if (activeTab === 'sales') {
            fetchSalesData();
        } else if (activeTab === 'tax') {
            fetchSalesData();
            fetchExpensesData();
        }
    }, [activeTab, dateRange, filterType, financialGroupBy]);

    useEffect(() => {
        if (activeTab === 'inventory') {
            fetchInventoryData();
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'employees') {
            fetchEmployeeData();
        }
    }, [activeTab, dateRange]);

    // --- Export ---
    // --- Export ---
    const handleExport = () => {
        const escapeCSV = (val: any) => {
            if (val === null || val === undefined) return '""';
            return `"${String(val).replace(/"/g, '""')}"`;
        };

        let csvContent = "";
        let fileName = "laporan.csv";
        const title = activeTab === 'sales' ? "Laporan Penjualan & Keuangan"
            : activeTab === 'inventory' ? "Laporan Status Inventaris"
                : activeTab === 'employees' ? "Laporan Kinerja Karyawan"
                    : "Laporan";

        // Add BOM for Excel UTF-8 compatibility
        const BOM = "\uFEFF";
        csvContent += BOM;

        // Metadata Header - Using semicolon delimiter
        csvContent += `${title}\n`;
        csvContent += `Periode;${dateRange.start} s.d ${dateRange.end}\n`;
        csvContent += `Tanggal Cetak;${new Date().toLocaleString('id-ID')}\n\n`;

        if (activeTab === 'sales') {
            // Use dailyFinancials if available for nicer export, or fall back to salesByDate
            if (dailyFinancials.length > 0) {
                csvContent += "Tanggal;Pendapatan;Pengeluaran;Laba Bersih\n";
                dailyFinancials.forEach(row => {
                    csvContent += `${escapeCSV(new Date(row.date).toLocaleDateString('id-ID'))};${row.revenue};${row.expense};${row.net_profit}\n`;
                });
                // Add Total Row
                const totalRev = dailyFinancials.reduce((acc, c) => acc + c.revenue, 0);
                const totalExp = dailyFinancials.reduce((acc, c) => acc + c.expense, 0);
                const totalNet = dailyFinancials.reduce((acc, c) => acc + c.net_profit, 0);
                csvContent += `TOTAL;${totalRev};${totalExp};${totalNet}\n`;
            } else if (salesByDate.length > 0) {
                csvContent += "Tanggal;Transaksi;Pendapatan\n";
                salesByDate.forEach(row => {
                    csvContent += `${escapeCSV(row.date)};${row.transactions};${row.revenue}\n`;
                });
            }
            fileName = "laporan_penjualan_harian.csv";

        } else if (activeTab === 'inventory' && inventoryStatus) {
            csvContent += "Metrik;Nilai\n";
            csvContent += `Total Produk;${inventoryStatus.total_products}\n`;
            csvContent += `Produk Aktif;${inventoryStatus.active_products}\n`;
            csvContent += `Stok Tipis;${inventoryStatus.low_stock_products}\n`;
            csvContent += `Stok Habis;${inventoryStatus.out_of_stock_products}\n`;
            csvContent += `Nilai Inventaris (Rp);${inventoryStatus.total_inventory_value}\n`;
            fileName = "status_inventaris.csv";

        } else if (activeTab === 'employees' && employeeStats.length > 0) {
            csvContent += "Nama Karyawan;ID Karyawan;Total Transaksi;Total Penjualan;Rata-rata Penjualan\n";
            employeeStats.forEach(row => {
                csvContent += `${escapeCSV(row.full_name)};${escapeCSV(row.employee_id)};${row.transactions};${row.total_sales};${row.avg_sale}\n`;
            });
            fileName = "kinerja_karyawan.csv";

        } else if (activeTab === 'tax' && salesSummary) {
            csvContent += "Metrik;Nilai\n";
            csvContent += `Total Pajak Terkumpul;${salesSummary.total_tax}\n`;
            csvContent += `Total Diskon Diberikan;${salesSummary.total_discounts}\n`;
            csvContent += `Total Pengembalian (Refund);${salesSummary.refunded_orders}\n`;

            // Add expense summary if available
            if (expenseSummary.length > 0) {
                csvContent += "\n\nRincian Pengeluaran per Kategori\n";
                csvContent += "Kategori;Total\n";
                expenseSummary.forEach(exp => {
                    csvContent += `${escapeCSV(exp.category)};${exp.total}\n`;
                });
            }
            fileName = "laporan_pajak_pengeluaran.csv";

        } else {
            alert("Tidak ada data untuk diekspor pada tampilan saat ini.");
            return;
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    };

    // --- Colors for Charts ---
    const COLORS = ['#6467f2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    // Calculated Summaries
    const totalExpenses = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalEmployeeSales = employeeStats.reduce((sum, e) => sum + (Number(e.total_sales) || 0), 0);
    const totalEmployeeTransactions = employeeStats.reduce((sum, e) => sum + (Number(e.transactions) || 0), 0);
    const topEmployee = employeeStats.length > 0
        ? [...employeeStats].sort((a, b) => Number(b.total_sales) - Number(a.total_sales))[0]
        : null;

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark font-display text-white">

            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header */}
                <header className="flex-shrink-0 px-4 md:px-8 py-4 md:py-6 flex flex-col gap-4 border-b border-slate-200 dark:border-[#282839] bg-white dark:bg-background-dark transition-colors">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            {/* Hamburger */}
                            <button
                                onClick={toggleSidebar}
                                className="p-2 -ml-2 text-gray-500 dark:text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 shrink-0" title="Buka Menu"
                            >
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Laporan & Analisis</h1>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            {/* Date Filter */}
                            <div className="flex flex-wrap items-center bg-gray-100/80 dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-xl p-1 gap-1 w-full sm:w-auto transition-colors">
                                {[
                                    { id: 'today', label: 'Hari Ini' },
                                    { id: 'week', label: 'Minggu Ini' },
                                    { id: 'month', label: 'Bulan Ini' }
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => handleFilterChange(t.id as any)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex-1 sm:flex-none ${filterType === t.id ? 'bg-primary text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                                <div className="w-px h-4 bg-slate-300 dark:bg-[#282839] mx-0.5 hidden sm:block" />
                                <div className="flex items-center gap-2 px-2.5 w-full sm:w-auto border-t border-slate-200 dark:border-[#282839] sm:border-t-0 pt-2 sm:pt-0 mt-1 sm:mt-0 justify-between sm:justify-start">
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => {
                                            setFilterType('custom');
                                            setDateRange(prev => ({ ...prev, start: e.target.value }));
                                        }}
                                        className="bg-transparent text-xs font-semibold text-gray-900 dark:text-white focus:outline-none w-[110px]"
                                    />
                                    <span className="text-gray-400 dark:text-text-secondary font-bold">-</span>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => {
                                            setFilterType('custom');
                                            setDateRange(prev => ({ ...prev, end: e.target.value }));
                                        }}
                                        className="bg-transparent text-xs font-semibold text-gray-900 dark:text-white focus:outline-none w-[110px]"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleExport}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl transition-all text-xs font-bold shadow-md shadow-primary/25 w-full sm:w-auto justify-center"
                            >
                                <span className="material-symbols-outlined text-[18px]">download</span>
                                <span>Ekspor CSV</span>
                            </button>

                            <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
                                <ThemeToggle />
                                <UserMenu />
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar whitespace-nowrap -mx-4 md:-mx-8 px-4 md:px-8 pb-1">
                        {[
                            { id: 'sales', label: 'Ringkasan Penjualan' },
                            { id: 'inventory', label: 'Status Inventaris' },
                            { id: 'employees', label: 'Kinerja Karyawan' },
                            { id: 'tax', label: 'Pajak & Pengeluaran' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex-shrink-0 ${activeTab === tab.id ? 'text-primary border-primary' : 'text-gray-500 dark:text-text-secondary hover:text-gray-900 dark:hover:text-white border-transparent hover:border-slate-300 dark:hover:border-[#282839]'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {loading ? (
                        <div className="flex items-center justify-center h-64 text-[#9d9db9]">Memuat laporan...</div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-64 text-red-500">
                            <span className="material-symbols-outlined text-4xl mb-2">error</span>
                            <p>{error}</p>
                            <button
                                onClick={() => {
                                    if (activeTab === 'sales' || activeTab === 'tax') fetchSalesData();
                                    else if (activeTab === 'inventory') fetchInventoryData();
                                    else fetchEmployeeData();
                                }}
                                className="mt-4 px-4 py-2 bg-slate-100 dark:bg-surface-dark rounded-lg hover:bg-slate-200 dark:hover:bg-opacity-80 transition-colors text-sm font-medium"
                            >
                                Coba Lagi
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* SALES TAB */}
                            {activeTab === 'sales' && salesSummary && (
                                <div className="flex flex-col gap-6">
                                    {/* Stats Cards (Seragam dengan Rekap Harian & Dashboard) */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                        {/* Card 1: Total Pendapatan */}
                                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                                            <div className="flex items-center justify-between text-gray-500 mb-2">
                                                <span className="text-xs font-semibold">Total Pendapatan</span>
                                                <div className="size-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[18px]">payments</span>
                                                </div>
                                            </div>
                                            <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white">
                                                {formatRupiah(salesSummary.total_revenue)}
                                            </p>
                                            <p className="text-[11px] text-gray-400 mt-1">Total kotor periode ini</p>
                                        </div>

                                        {/* Card 2: Total Transaksi */}
                                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                                            <div className="flex items-center justify-between text-gray-500 mb-2">
                                                <span className="text-xs font-semibold">Total Transaksi</span>
                                                <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                                                </div>
                                            </div>
                                            <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white">
                                                {salesSummary.total_transactions.toLocaleString('id-ID')}
                                            </p>
                                            <p className="text-[11px] text-gray-400 mt-1">Transaksi berhasil</p>
                                        </div>

                                        {/* Card 3: Rata-rata Order */}
                                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                                            <div className="flex items-center justify-between text-gray-500 mb-2">
                                                <span className="text-xs font-semibold">Rata-rata Order</span>
                                                <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                                                </div>
                                            </div>
                                            <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white">
                                                {formatRupiah(salesSummary.avg_order_value)}
                                            </p>
                                            <p className="text-[11px] text-gray-400 mt-1">Rata-rata per nota</p>
                                        </div>

                                        {/* Card 4: Penjualan Bersih (Hero Hijau Kontras) */}
                                        <div className="bg-emerald-600 dark:bg-emerald-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg shadow-emerald-600/25 relative overflow-hidden flex flex-col justify-between">
                                            <div className="flex items-center justify-between text-emerald-100 mb-2">
                                                <span className="text-xs font-bold uppercase tracking-wider">PENJUALAN BERSIH</span>
                                                <div className="size-8 rounded-lg bg-white/20 text-white flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[18px]">trending_up</span>
                                                </div>
                                            </div>
                                            <p className="text-lg sm:text-2xl font-black text-white">
                                                {formatRupiah(Number(salesSummary.total_revenue) - Number(salesSummary.total_tax || 0))}
                                            </p>
                                            <p className="text-[11px] text-emerald-100 mt-1">
                                                Setelah potongan diskon & pajak
                                            </p>
                                        </div>
                                    </div>

                                    {/* Charts Row */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Revenue Trend */}
                                        <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-6 shadow-sm min-h-[400px] transition-colors">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Tren Pendapatan</h3>
                                            <div className="h-[300px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={salesByDate}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#282839" : "#e2e8f0"} vertical={false} />
                                                        <XAxis dataKey="date" stroke={isDark ? "#9d9db9" : "#94a3b8"} fontSize={12} tickLine={false} axisLine={false} />
                                                        <YAxis stroke={isDark ? "#9d9db9" : "#94a3b8"} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${(value / 1000).toFixed(0)}k`} />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: isDark ? '#1c1c27' : '#ffffff', borderColor: isDark ? '#3b3c54' : '#e2e8f0', color: isDark ? '#fff' : '#1e293b' }}
                                                            itemStyle={{ color: isDark ? '#fff' : '#1e293b' }}
                                                            formatter={(value: any) => formatRupiah(value)}
                                                        />
                                                        <Legend />
                                                        <Line type="monotone" dataKey="revenue" stroke="#6467f2" strokeWidth={3} dot={{ r: 4, fill: '#6467f2' }} activeDot={{ r: 6 }} name="Pendapatan" />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Sales by Category */}
                                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-6 shadow-sm min-h-[400px] transition-colors">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Penjualan per Kategori</h3>
                                            <div className="h-[300px] w-full flex items-center justify-center">
                                                {salesByCategory.length > 0 ? (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={salesByCategory}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={60}
                                                                outerRadius={80}
                                                                paddingAngle={5}
                                                                dataKey="revenue"
                                                                nameKey="category"
                                                            >
                                                                {salesByCategory.map((_, index) => (
                                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip
                                                                contentStyle={{ backgroundColor: isDark ? '#1c1c27' : '#ffffff', borderColor: isDark ? '#3b3c54' : '#e2e8f0' }}
                                                                itemStyle={{ color: isDark ? '#fff' : '#1e293b' }}
                                                                formatter={(value: any) => formatRupiah(value)}
                                                            />
                                                            <Legend />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <p className="text-gray-500 dark:text-text-secondary text-sm">Tidak ada data penjualan per kategori</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Top Selling Products */}
                                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl overflow-hidden shadow-sm transition-colors">
                                        <div className="p-6 border-b border-slate-200 dark:border-[#282839]">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Produk Terlaris</h3>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm text-gray-500 dark:text-text-secondary">
                                                <thead className="bg-gray-50 dark:bg-[#16161f] text-xs uppercase font-semibold text-gray-500 dark:text-text-secondary">
                                                    <tr>
                                                        <th className="px-6 py-4">Nama Produk</th>
                                                        <th className="px-6 py-4">Kategori</th>
                                                        <th className="px-6 py-4 text-right">Harga Satuan</th>
                                                        <th className="px-6 py-4 text-right">Terjual</th>
                                                        <th className="px-6 py-4 text-right">Total Pendapatan</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 dark:divide-[#282839]">
                                                    {topProducts.map((product) => (
                                                        <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{product.name}</td>
                                                            <td className="px-6 py-4">{product.category}</td>
                                                            <td className="px-6 py-4 text-right">{formatRupiah(product.price)}</td>
                                                            <td className="px-6 py-4 text-right text-gray-900 dark:text-white">{product.total_sold}</td>
                                                            <td className="px-6 py-4 text-right font-bold text-primary">{formatRupiah(product.total_revenue)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Daily Financial Breakdown */}
                                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl overflow-hidden shadow-sm transition-colors mt-6">
                                        <div className="p-6 border-b border-slate-200 dark:border-[#282839] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Rincian Keuangan</h3>
                                            <div className="flex bg-gray-100 dark:bg-[#16161f] p-1 rounded-xl">
                                                {[
                                                    { id: 'day', label: 'Harian' },
                                                    { id: 'week', label: 'Mingguan' },
                                                    { id: 'month', label: 'Bulanan' },
                                                    { id: 'year', label: 'Tahunan' }
                                                ].map((t) => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => setFinancialGroupBy(t.id as any)}
                                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${financialGroupBy === t.id ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-gray-500 dark:text-text-secondary hover:text-gray-900 dark:hover:text-white'}`}
                                                    >
                                                        {t.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm text-gray-500 dark:text-text-secondary">
                                                <thead className="bg-gray-50 dark:bg-[#16161f] text-xs uppercase font-semibold text-gray-500 dark:text-text-secondary">
                                                    <tr>
                                                        <th className="px-6 py-4">Periode</th>
                                                        <th className="px-6 py-4 text-right">Pendapatan</th>
                                                        <th className="px-6 py-4 text-right">Pengeluaran</th>
                                                        <th className="px-6 py-4 text-right">Laba Bersih</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 dark:divide-[#282839]">
                                                    {dailyFinancials.length > 0 ? dailyFinancials.map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                                {financialGroupBy === 'day' && new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                                {financialGroupBy === 'month' && new Date(item.date + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                                                {financialGroupBy === 'year' && item.date}
                                                                {financialGroupBy === 'week' && `Minggu ke-${item.date.split('-')[1]} (${item.date.split('-')[0]})`}
                                                            </td>
                                                            <td className="px-6 py-4 text-right text-green-600 font-medium">
                                                                {formatRupiah(item.revenue)}
                                                            </td>
                                                            <td className="px-6 py-4 text-right text-red-500 font-medium">
                                                                {formatRupiah(item.expense)}
                                                            </td>
                                                            <td className={`px-6 py-4 text-right font-bold ${item.net_profit >= 0 ? 'text-primary' : 'text-orange-500'}`}>
                                                                {formatRupiah(item.net_profit)}
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        <tr>
                                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400 dark:text-text-secondary">
                                                                Tidak ada data keuangan untuk periode ini
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                                {dailyFinancials.length > 0 && (
                                                    <tfoot className="bg-gray-50 dark:bg-[#16161f] font-bold text-gray-900 dark:text-white">
                                                        <tr>
                                                            <td className="px-6 py-4">TOTAL</td>
                                                            <td className="px-6 py-4 text-right text-green-600">
                                                                {formatRupiah(dailyFinancials.reduce((acc, curr) => acc + curr.revenue, 0))}
                                                            </td>
                                                            <td className="px-6 py-4 text-right text-red-500">
                                                                {formatRupiah(dailyFinancials.reduce((acc, curr) => acc + curr.expense, 0))}
                                                            </td>
                                                            <td className="px-6 py-4 text-right text-primary">
                                                                {formatRupiah(dailyFinancials.reduce((acc, curr) => acc + curr.net_profit, 0))}
                                                            </td>
                                                        </tr>
                                                    </tfoot>
                                                )}
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* INVENTORY TAB */}
                            {activeTab === 'inventory' && inventoryStatus && (
                                <div className="flex flex-col gap-6">
                                    {/* Stats Cards Inventaris (Seragam dengan Rekap Harian) */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                        {/* Card 1: Total Produk */}
                                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                                            <div className="flex items-center justify-between text-gray-500 mb-2">
                                                <span className="text-xs font-semibold">Total Produk Terdaftar</span>
                                                <div className="size-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                                                </div>
                                            </div>
                                            <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white">
                                                {inventoryStatus.total_products.toLocaleString('id-ID')} Produk
                                            </p>
                                            <p className="text-[11px] text-gray-400 mt-1">Data master barang toko</p>
                                        </div>

                                        {/* Card 2: Stok Menipis */}
                                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                                            <div className="flex items-center justify-between text-gray-500 mb-2">
                                                <span className="text-xs font-semibold">Stok Menipis</span>
                                                <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[18px]">warning</span>
                                                </div>
                                            </div>
                                            <p className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                                                {inventoryStatus.low_stock_products} Produk
                                            </p>
                                            <p className="text-[11px] text-gray-400 mt-1">Perlu segera restock/kulakan</p>
                                        </div>

                                        {/* Card 3: Stok Habis */}
                                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                                            <div className="flex items-center justify-between text-gray-500 mb-2">
                                                <span className="text-xs font-semibold">Stok Habis (Kosong)</span>
                                                <div className="size-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[18px]">remove_shopping_cart</span>
                                                </div>
                                            </div>
                                            <p className="text-lg sm:text-2xl font-black text-red-600 dark:text-red-400">
                                                {inventoryStatus.out_of_stock_products} Produk
                                            </p>
                                            <p className="text-[11px] text-gray-400 mt-1">Barang tidak bisa dijual kasir</p>
                                        </div>

                                        {/* Card 4: Total Nilai Inventaris (HERO HIJAU KONTRAS) */}
                                        <div className="bg-emerald-600 dark:bg-emerald-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg shadow-emerald-600/25 relative overflow-hidden flex flex-col justify-between">
                                            <div className="flex items-center justify-between text-emerald-100 mb-2">
                                                <span className="text-xs font-bold uppercase tracking-wider">TOTAL ASET INVENTARIS</span>
                                                <div className="size-8 rounded-lg bg-white/20 text-white flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[18px]">monetization_on</span>
                                                </div>
                                            </div>
                                            <p className="text-lg sm:text-2xl font-black text-white">
                                                {formatRupiah(inventoryStatus.total_inventory_value)}
                                            </p>
                                            <p className="text-[11px] text-emerald-100 mt-1">Estimasi modal barang fisik</p>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-6 shadow-sm min-h-[400px] transition-colors">
                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-6">Distribusi Status Stok</h3>
                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={[
                                                            { name: 'Aktif (Aman)', value: Math.max(inventoryStatus.active_products - inventoryStatus.low_stock_products - inventoryStatus.out_of_stock_products, 0) },
                                                            { name: 'Stok Tipis', value: inventoryStatus.low_stock_products },
                                                            { name: 'Stok Habis', value: inventoryStatus.out_of_stock_products },
                                                        ]}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={0}
                                                        outerRadius={100}
                                                        dataKey="value"
                                                    >
                                                        <Cell key="cell-active" fill="#10b981" />
                                                        <Cell key="cell-low" fill="#f59e0b" />
                                                        <Cell key="cell-out" fill="#ef4444" />
                                                    </Pie>
                                                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#1c1c27' : '#ffffff', borderColor: isDark ? '#3b3c54' : '#e2e8f0' }} itemStyle={{ color: isDark ? '#fff' : '#1e293b' }} />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* EMPLOYEES TAB */}
                            {activeTab === 'employees' && (
                                <div className="flex flex-col gap-6">
                                    {/* Stats Cards Karyawan (Seragam dengan Rekap Harian) */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                        {/* Card 1: Total Karyawan */}
                                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                                            <div className="flex items-center justify-between text-gray-500 mb-2">
                                                <span className="text-xs font-semibold">Total Karyawan Aktif</span>
                                                <div className="size-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[18px]">group</span>
                                                </div>
                                            </div>
                                            <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white">
                                                {employeeStats.length} Karyawan
                                            </p>
                                            <p className="text-[11px] text-gray-400 mt-1">Staf kasir bertugas</p>
                                        </div>

                                        {/* Card 2: Total Transaksi Kasir */}
                                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                                            <div className="flex items-center justify-between text-gray-500 mb-2">
                                                <span className="text-xs font-semibold">Total Transaksi Kasir</span>
                                                <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                                                </div>
                                            </div>
                                            <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white">
                                                {totalEmployeeTransactions.toLocaleString('id-ID')}
                                            </p>
                                            <p className="text-[11px] text-gray-400 mt-1">Total nota ditangani</p>
                                        </div>

                                        {/* Card 3: Rata-rata Penjualan */}
                                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                                            <div className="flex items-center justify-between text-gray-500 mb-2">
                                                <span className="text-xs font-semibold">Rata-rata Penjualan</span>
                                                <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[18px]">query_stats</span>
                                                </div>
                                            </div>
                                            <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white">
                                                {formatRupiah(employeeStats.length > 0 ? (totalEmployeeSales / employeeStats.length) : 0)}
                                            </p>
                                            <p className="text-[11px] text-gray-400 mt-1">Omset rata-rata per staf</p>
                                        </div>

                                        {/* Card 4: Top Performer (Hero Hijau) */}
                                        <div className="bg-emerald-600 dark:bg-emerald-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg shadow-emerald-600/25 relative overflow-hidden flex flex-col justify-between">
                                            <div className="flex items-center justify-between text-emerald-100 mb-2">
                                                <span className="text-xs font-bold uppercase tracking-wider">KASIR TERBAIK</span>
                                                <div className="size-8 rounded-lg bg-white/20 text-white flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                                                </div>
                                            </div>
                                            <p className="text-lg sm:text-2xl font-black text-white truncate">
                                                {topEmployee ? topEmployee.full_name : '-'}
                                            </p>
                                            <p className="text-[11px] text-emerald-100 mt-1">
                                                {topEmployee ? `${formatRupiah(topEmployee.total_sales)} omset` : 'Belum ada data'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Table Kinerja Karyawan */}
                                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl overflow-hidden shadow-sm transition-colors">
                                        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-[#282839]">
                                            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Tabel Kinerja Karyawan</h3>
                                            <p className="text-xs text-gray-500 dark:text-text-secondary mt-0.5">Rincian performa penjualan setiap staf kasir</p>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm text-gray-500 dark:text-text-secondary">
                                                <thead className="bg-gray-50 dark:bg-[#16161f] text-xs uppercase font-semibold text-gray-500 dark:text-text-secondary">
                                                    <tr>
                                                        <th className="px-6 py-4">Karyawan</th>
                                                        <th className="px-6 py-4">ID</th>
                                                        <th className="px-6 py-4 text-right">Transaksi Ditangani</th>
                                                        <th className="px-6 py-4 text-right">Rata-rata Transaksi</th>
                                                        <th className="px-6 py-4 text-right">Total Penjualan</th>
                                                        <th className="px-6 py-4">Kinerja</th>
                                                        <th className="px-6 py-4 text-center">Detail</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 dark:divide-[#282839]">
                                                    {employeeStats.length > 0 ? employeeStats.map((emp) => (
                                                        <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-3">
                                                                <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                                    {emp.full_name.charAt(0)}
                                                                </div>
                                                                {emp.full_name}
                                                            </td>
                                                            <td className="px-6 py-4">{emp.employee_id}</td>
                                                            <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">{emp.transactions}</td>
                                                            <td className="px-6 py-4 text-right">{formatRupiah(emp.avg_sale)}</td>
                                                            <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">{formatRupiah(emp.total_sales)}</td>
                                                            <td className="px-6 py-4">
                                                                <div className="w-full bg-gray-200 dark:bg-[#282839] rounded-full h-2 max-w-[100px]">
                                                                    <div
                                                                        className="bg-green-500 h-2 rounded-full"
                                                                        style={{
                                                                            width: `${emp.total_sales ?
                                                                                Math.min((Number(emp.total_sales) / Math.max(...employeeStats.map(e => Number(e.total_sales)))) * 100, 100)
                                                                                : 0}%`
                                                                        }}
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <button
                                                                    onClick={() => setSelectedEmployee({ id: emp.id, name: emp.full_name })}
                                                                    className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                                    title="Lihat Detail Transaksi"
                                                                >
                                                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        <tr>
                                                            <td colSpan={7} className="px-6 py-8 text-center text-gray-400">Belum ada data kinerja karyawan pada rentang tanggal ini.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Chart Penjualan per Karyawan */}
                                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-6 shadow-sm min-h-[400px] transition-colors">
                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-6">Grafik Penjualan per Karyawan</h3>
                                        <div className="h-[300px] w-full">
                                            {employeeStats.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={employeeStats} layout="vertical">
                                                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#282839" : "#e2e8f0"} horizontal={false} />
                                                        <XAxis type="number" stroke={isDark ? "#9d9db9" : "#94a3b8"} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${(value / 1000).toFixed(0)}k`} />
                                                        <YAxis dataKey="full_name" type="category" stroke={isDark ? "#9d9db9" : "#94a3b8"} fontSize={12} tickLine={false} axisLine={false} width={100} />
                                                        <Tooltip
                                                            cursor={{ fill: isDark ? '#282839' : '#e2e8f0' }}
                                                            contentStyle={{ backgroundColor: isDark ? '#1c1c27' : '#ffffff', borderColor: isDark ? '#3b3c54' : '#e2e8f0', color: isDark ? '#fff' : '#1e293b' }}
                                                            formatter={(value: any) => formatRupiah(value)}
                                                        />
                                                        <Bar dataKey="total_sales" fill="#6467f2" radius={[0, 4, 4, 0]} barSize={20} name="Total Penjualan" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-gray-400 text-sm">Tidak ada data grafik karyawan</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAX & EXPENSES TAB */}
                            {activeTab === 'tax' && (
                                <div className="flex flex-col gap-6">
                                    {/* Row 1: Stats Cards (4 Kartu Seragam dengan Hero Merah Kontras) */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                        {/* Card 1: Total Pajak Terkumpul */}
                                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                                            <div className="flex items-center justify-between text-gray-500 mb-2">
                                                <span className="text-xs font-semibold">Total Pajak Terkumpul</span>
                                                <div className="size-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[18px]">account_balance</span>
                                                </div>
                                            </div>
                                            <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white">
                                                {formatRupiah(salesSummary?.total_tax || 0)}
                                            </p>
                                            <p className="text-[11px] text-gray-400 mt-1">Pajak penjualan (PPN)</p>
                                        </div>

                                        {/* Card 2: Total Diskon Diberikan */}
                                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                                            <div className="flex items-center justify-between text-gray-500 mb-2">
                                                <span className="text-xs font-semibold">Total Diskon Diberikan</span>
                                                <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[18px]">sell</span>
                                                </div>
                                            </div>
                                            <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white">
                                                {formatRupiah(salesSummary?.total_discounts || 0)}
                                            </p>
                                            <p className="text-[11px] text-gray-400 mt-1">Potongan harga promo</p>
                                        </div>

                                        {/* Card 3: Total Pengembalian / Refund */}
                                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                                            <div className="flex items-center justify-between text-gray-500 mb-2">
                                                <span className="text-xs font-semibold">Total Retur (Refund)</span>
                                                <div className="size-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[18px]">keyboard_return</span>
                                                </div>
                                            </div>
                                            <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white">
                                                {(salesSummary?.refunded_orders || 0).toLocaleString('id-ID')}
                                            </p>
                                            <p className="text-[11px] text-gray-400 mt-1">Transaksi nota dibatalkan</p>
                                        </div>

                                        {/* Card 4: TOTAL BIAYA PENGELUARAN (HERO MERAH KONTRAS) */}
                                        <div className="bg-gradient-to-br from-rose-600 to-red-700 text-white rounded-2xl p-4 sm:p-5 shadow-lg shadow-rose-600/25 relative overflow-hidden flex flex-col justify-between">
                                            <div className="flex items-center justify-between text-rose-100 mb-2">
                                                <span className="text-xs font-bold uppercase tracking-wider">TOTAL BIAYA PENGELUARAN</span>
                                                <div className="size-8 rounded-lg bg-white/20 text-white flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[18px]">shopping_cart_checkout</span>
                                                </div>
                                            </div>
                                            <p className="text-lg sm:text-2xl font-black text-white">
                                                {formatRupiah(totalExpenses)}
                                            </p>
                                            <p className="text-[11px] text-rose-100 mt-1">
                                                {expenses.length} Catatan pos biaya toko
                                            </p>
                                        </div>
                                    </div>

                                    {/* Row 2: Charts Row (2 Kolom Seimbang) */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Chart 1: Rincian Potongan Keuangan */}
                                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-6 shadow-sm min-h-[380px] flex flex-col transition-colors">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Rincian Potongan Keuangan</h3>
                                                    <p className="text-xs text-gray-500 dark:text-text-secondary mt-0.5">Perbandingan potongan diskon vs pajak terhimpun</p>
                                                </div>
                                                <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[18px]">pie_chart</span>
                                                </div>
                                            </div>
                                            <div className="h-[280px] w-full flex-1 flex items-center justify-center">
                                                {((Number(salesSummary?.total_tax) || 0) > 0 || (Number(salesSummary?.total_discounts) || 0) > 0) ? (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={[
                                                                    { name: 'Pajak', value: Number(salesSummary?.total_tax || 0) },
                                                                    { name: 'Diskon', value: Number(salesSummary?.total_discounts || 0) },
                                                                ]}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={65}
                                                                outerRadius={95}
                                                                paddingAngle={4}
                                                                dataKey="value"
                                                            >
                                                                <Cell fill="#6467f2" />
                                                                <Cell fill="#f59e0b" />
                                                            </Pie>
                                                            <Tooltip
                                                                contentStyle={{ backgroundColor: isDark ? '#1c1c27' : '#ffffff', borderColor: isDark ? '#3b3c54' : '#e2e8f0', borderRadius: '12px' }}
                                                                itemStyle={{ color: isDark ? '#fff' : '#1e293b' }}
                                                                formatter={(value: any) => formatRupiah(value)}
                                                            />
                                                            <Legend verticalAlign="bottom" height={36} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center text-gray-400 dark:text-text-secondary gap-2 py-8">
                                                        <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600">donut_large</span>
                                                        <p className="text-xs font-medium">Tidak ada data potongan pajak & diskon pada periode ini</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Chart 2: Komposisi Pengeluaran per Kategori */}
                                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-6 shadow-sm min-h-[380px] flex flex-col transition-colors">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Komposisi Pengeluaran per Kategori</h3>
                                                    <p className="text-xs text-gray-500 dark:text-text-secondary mt-0.5">Alokasi pos belanja dan beban operasional toko</p>
                                                </div>
                                                <div className="size-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                                                </div>
                                            </div>
                                            <div className="h-[280px] w-full flex-1 flex items-center justify-center">
                                                {expenseSummary.length > 0 ? (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={expenseSummary}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={65}
                                                                outerRadius={95}
                                                                paddingAngle={4}
                                                                dataKey="total"
                                                                nameKey="category"
                                                            >
                                                                {expenseSummary.map((_, index) => (
                                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip
                                                                contentStyle={{ backgroundColor: isDark ? '#1c1c27' : '#ffffff', borderColor: isDark ? '#3b3c54' : '#e2e8f0', borderRadius: '12px' }}
                                                                itemStyle={{ color: isDark ? '#fff' : '#1e293b' }}
                                                                formatter={(value: any) => formatRupiah(value)}
                                                            />
                                                            <Legend verticalAlign="bottom" height={36} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center text-gray-400 dark:text-text-secondary gap-2 py-8">
                                                        <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600">pie_chart</span>
                                                        <p className="text-xs font-medium">Belum ada catatan pengeluaran operasional pada periode ini</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 3: Expenses Table Card (Full Width) */}
                                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl overflow-hidden shadow-sm transition-colors">
                                        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-[#282839] flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-red-500 text-[20px]">receipt_long</span>
                                                    Daftar Riwayat Pengeluaran Toko
                                                </h3>
                                                <p className="text-xs text-gray-500 dark:text-text-secondary mt-0.5">
                                                    Total {expenses.length} transaksi pengeluaran tercatat dalam rentang tanggal terpilih
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setIsAddingExpense(true)}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all text-xs font-bold shadow-md shadow-red-600/20"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">add</span>
                                                Catat Pengeluaran Baru
                                            </button>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm text-gray-500 dark:text-text-secondary">
                                                <thead className="bg-gray-50 dark:bg-[#16161f] text-xs uppercase font-semibold text-gray-500 dark:text-text-secondary">
                                                    <tr>
                                                        <th className="px-6 py-3.5">Tanggal</th>
                                                        <th className="px-6 py-3.5">Kategori</th>
                                                        <th className="px-6 py-3.5">Keterangan</th>
                                                        <th className="px-6 py-3.5">Dicatat Oleh</th>
                                                        <th className="px-6 py-3.5 text-right">Jumlah Biaya</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 dark:divide-[#282839]">
                                                    {expenses.length > 0 ? expenses.map((exp) => (
                                                        <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                                                {new Date(exp.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-2.5 py-1 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold">
                                                                    {exp.category}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-xs text-gray-700 dark:text-gray-300">
                                                                {exp.description || '-'}
                                                            </td>
                                                            <td className="px-6 py-4 text-xs font-medium">
                                                                {exp.user_name || 'Administrator'}
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                                                                {formatRupiah(exp.amount)}
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        <tr>
                                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-text-secondary">
                                                                <div className="flex flex-col items-center justify-center gap-2">
                                                                    <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600">receipt</span>
                                                                    <p className="text-sm font-medium">Belum ada data pengeluaran pada rentang tanggal ini.</p>
                                                                    <p className="text-xs text-gray-400">Klik tombol "Catat Pengeluaran Baru" untuk menambahkan pos biaya.</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                                {expenses.length > 0 && (
                                                    <tfoot className="bg-gray-50/80 dark:bg-[#16161f] font-bold text-gray-900 dark:text-white border-t border-slate-200 dark:border-[#282839]">
                                                        <tr>
                                                            <td colSpan={4} className="px-6 py-4 text-right text-xs uppercase tracking-wider text-gray-500 dark:text-text-secondary">
                                                                Total Pengeluaran:
                                                            </td>
                                                            <td className="px-6 py-4 text-right text-base text-red-600 dark:text-red-400 font-black">
                                                                {formatRupiah(totalExpenses)}
                                                            </td>
                                                        </tr>
                                                    </tfoot>
                                                )}
                                            </table>
                                        </div>
                                    </div>

                                    {/* Add Expense Modal */}
                                    {isAddingExpense && (
                                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                                            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                                                <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200 dark:border-[#282839]">
                                                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-red-500 text-[20px]">add_circle</span>
                                                        Catat Pengeluaran Baru
                                                    </h3>
                                                    <button onClick={() => setIsAddingExpense(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                                                        <span className="material-symbols-outlined text-[20px]">close</span>
                                                    </button>
                                                </div>
                                                <form onSubmit={handleAddExpense} className="space-y-4">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-700 dark:text-text-secondary mb-1.5">Kategori Beban</label>
                                                        <select
                                                            value={newExpense.category}
                                                            onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-[#282839] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white text-sm"
                                                        >
                                                            {expenseCategories.map(cat => (
                                                                <option key={cat} value={cat}>{cat}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-700 dark:text-text-secondary mb-1.5">Nominal Biaya (Rp)</label>
                                                        <input
                                                            type="number"
                                                            value={newExpense.amount}
                                                            onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                                            placeholder="0"
                                                            required
                                                            min="0"
                                                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-[#282839] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-700 dark:text-text-secondary mb-1.5">Keterangan / Keperluan</label>
                                                        <textarea
                                                            value={newExpense.description}
                                                            onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                                            placeholder="Contoh: Beli pulsa token listrik, beli kantong plastik..."
                                                            rows={3}
                                                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-[#282839] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white text-sm resize-none"
                                                        />
                                                    </div>
                                                    <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-white/5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsAddingExpense(false)}
                                                            className="px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl border border-slate-200 dark:border-[#282839] transition-colors"
                                                        >
                                                            Batal
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-600/25"
                                                        >
                                                            Simpan Pengeluaran
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main >

            <EmployeeTransactionsModal
                isOpen={!!selectedEmployee}
                onClose={() => setSelectedEmployee(null)}
                employeeId={selectedEmployee?.id || ''}
                employeeName={selectedEmployee?.name || ''}
                dateRange={dateRange}
            />
        </div >
    );
};


export default ReportsPage;
