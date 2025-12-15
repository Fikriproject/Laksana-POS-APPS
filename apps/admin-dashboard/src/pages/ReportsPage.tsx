import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';
import { formatRupiah } from '../utils/format';
import { useTheme } from '../context/ThemeContext';
import { DashboardContextType } from '../layouts/DashboardLayout';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

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

// --- Component ---

const ReportsPage = () => {
    // State
    const { toggleSidebar } = useOutletContext<DashboardContextType>();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'employees' | 'tax'>('sales');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(1)).toISOString().split('T')[0], // 1st of current month
        end: new Date().toISOString().split('T')[0] // Today
    });
    const [filterType, setFilterType] = useState<'today' | 'week' | 'month' | 'custom'>('month');

    // Data State
    const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
    const [salesByDate, setSalesByDate] = useState<SalesByDate[]>([]);
    const [salesByCategory, setSalesByCategory] = useState<SalesByCategory[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus | null>(null);
    const [employeeStats, setEmployeeStats] = useState<EmployeePerformance[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

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
            start.setDate(1); // 1st of month
        }

        setDateRange({
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        });
    };

    const fetchSalesData = async () => {
        const requestId = ++requestRef.current;
        setLoading(true);
        setError(null);
        try {
            const params = { start_date: dateRange.start, end_date: `${dateRange.end} 23:59:59` };

            const [summaryRes, byDateRes, byCatRes, topProdRes] = await Promise.all([
                api.get('/reports/sales/summary', { params }),
                api.get('/reports/sales/by-date', { params: { ...params, group_by: filterType === 'today' ? 'hour' : 'day' } }),
                api.get('/reports/sales/by-category', { params }),
                api.get('/reports/products/top-selling', { params: { ...params, limit: 5 } })
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

    // --- Effects ---

    useEffect(() => {
        if (activeTab === 'sales' || activeTab === 'tax') {
            fetchSalesData();
        }
    }, [activeTab, dateRange, filterType]);

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
    const handleExport = () => {
        const escapeCSV = (val: any) => `"${String(val).replace(/"/g, '""')}"`;
        let csvContent = "";
        let fileName = "laporan.csv";

        // Add BOM for Excel UTF-8 compatibility
        const BOM = "\uFEFF";
        csvContent += BOM;

        if (activeTab === 'sales' && salesByDate.length > 0) {
            csvContent += "Tanggal,Transaksi,Pendapatan\n";
            salesByDate.forEach(row => {
                csvContent += `${escapeCSV(row.date)},${row.transactions},${row.revenue}\n`;
            });
            fileName = "laporan_penjualan.csv";
        } else if (activeTab === 'inventory' && inventoryStatus) {
            csvContent += "Metrik,Nilai\n";
            csvContent += `Total Produk,${inventoryStatus.total_products}\n`;
            csvContent += `Produk Aktif,${inventoryStatus.active_products}\n`;
            csvContent += `Stok Tipis,${inventoryStatus.low_stock_products}\n`;
            csvContent += `Stok Habis,${inventoryStatus.out_of_stock_products}\n`;
            csvContent += `Nilai Inventaris,${inventoryStatus.total_inventory_value}\n`;
            fileName = "status_inventaris.csv";
        } else if (activeTab === 'employees' && employeeStats.length > 0) {
            csvContent += "Karyawan,ID,Transaksi,Total Penjualan,Rata-rata Penjualan\n";
            employeeStats.forEach(row => {
                csvContent += `${escapeCSV(row.full_name)},${escapeCSV(row.employee_id)},${row.transactions},${row.total_sales},${row.avg_sale}\n`;
            });
            fileName = "kinerja_karyawan.csv";
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
                                className="lg:hidden p-2 -ml-2 text-gray-500 dark:text-text-secondary hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Laporan & Analisis</h1>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            {/* Date Filter */}
                            <div className="flex flex-wrap items-center bg-gray-50 dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-lg p-1 w-full sm:w-auto transition-colors">
                                {[
                                    { id: 'today', label: 'Hari Ini' },
                                    { id: 'week', label: 'Minggu Ini' },
                                    { id: 'month', label: 'Bulan Ini' }
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => handleFilterChange(t.id as any)}
                                        className={`px-3 py-1.5 text-xs font-medium capitalize rounded transition-colors flex-1 sm:flex-none ${filterType === t.id ? 'bg-primary text-white shadow-sm' : 'text-gray-500 dark:text-text-secondary hover:text-gray-900 dark:hover:text-white'}`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                                <div className="w-px h-4 bg-slate-300 dark:bg-[#282839] mx-1 hidden sm:block" />
                                <div className="flex items-center gap-2 px-3 w-full sm:w-auto border-t border-slate-200 dark:border-[#282839] sm:border-t-0 pt-2 sm:pt-0 mt-1 sm:mt-0 justify-between sm:justify-start">
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => {
                                            setFilterType('custom');
                                            setDateRange(prev => ({ ...prev, start: e.target.value }));
                                        }}
                                        className="bg-transparent text-xs text-gray-900 dark:text-white focus:outline-none w-[110px]"
                                    />
                                    <span className="text-gray-400 dark:text-text-secondary">-</span>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => {
                                            setFilterType('custom');
                                            setDateRange(prev => ({ ...prev, end: e.target.value }));
                                        }}
                                        className="bg-transparent text-xs text-gray-900 dark:text-white focus:outline-none w-[110px]"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium shadow-lg shadow-primary/20 w-full sm:w-auto justify-center"
                            >
                                <span className="material-symbols-outlined text-[18px]">download</span>
                                Ekspor CSV
                            </button>
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
                                    {/* Stats Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {[
                                            { label: 'Total Pendapatan', value: formatRupiah(salesSummary.total_revenue), icon: 'payments', color: 'text-green-500', bg: 'bg-green-500/10' },
                                            { label: 'Transaksi', value: salesSummary.total_transactions, icon: 'receipt_long', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                            { label: 'Rata-rata Order', value: formatRupiah(salesSummary.avg_order_value), icon: 'shopping_bag', color: 'text-orange-500', bg: 'bg-orange-500/10' },
                                            { label: 'Penjualan Bersih', value: formatRupiah(Number(salesSummary.total_revenue) - Number(salesSummary.total_tax) - Number(salesSummary.total_discounts)), icon: 'account_balance_wallet', color: 'text-purple-500', bg: 'bg-purple-500/10' },
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-xl p-5 shadow-sm transition-colors">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-gray-500 dark:text-text-secondary text-sm font-medium mb-1">{stat.label}</p>
                                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                                                    </div>
                                                    <div className={`size-10 rounded-lg ${stat.bg} flex items-center justify-center ${stat.color}`}>
                                                        <span className="material-symbols-outlined">{stat.icon}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Charts Row */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Revenue Trend */}
                                        <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-xl p-6 shadow-sm min-h-[400px] transition-colors">
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
                                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-xl p-6 shadow-sm min-h-[400px] transition-colors">
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
                                                                {salesByCategory.map((entry, index) => (
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
                                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-xl overflow-hidden shadow-sm transition-colors">
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
                                </div>
                            )}

                            {/* INVENTORY TAB */}
                            {activeTab === 'inventory' && inventoryStatus && (
                                <div className="flex flex-col gap-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {[
                                            { label: 'Total Nilai', value: formatRupiah(inventoryStatus.total_inventory_value), icon: 'monetization_on', color: 'text-green-500', bg: 'bg-green-500/10' },
                                            { label: 'Total Barang', value: inventoryStatus.total_products, icon: 'inventory_2', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                            { label: 'Stok Tipis', value: inventoryStatus.low_stock_products, icon: 'warning', color: 'text-orange-500', bg: 'bg-orange-500/10' },
                                            { label: 'Stok Habis', value: inventoryStatus.out_of_stock_products, icon: 'remove_shopping_cart', color: 'text-red-500', bg: 'bg-red-500/10' },
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-xl p-5 shadow-sm transition-colors">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-gray-500 dark:text-text-secondary text-sm font-medium mb-1">{stat.label}</p>
                                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                                                    </div>
                                                    <div className={`size-10 rounded-lg ${stat.bg} flex items-center justify-center ${stat.color}`}>
                                                        <span className="material-symbols-outlined">{stat.icon}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-xl p-6 shadow-sm min-h-[400px] transition-colors">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Distribusi Stok</h3>
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
                                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-xl overflow-hidden shadow-sm transition-colors">
                                        <div className="p-6 border-b border-slate-200 dark:border-[#282839]">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Kinerja Karyawan</h3>
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
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 dark:divide-[#282839]">
                                                    {employeeStats.map((emp) => (
                                                        <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-3">
                                                                <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                                    {emp.full_name.charAt(0)}
                                                                </div>
                                                                {emp.full_name}
                                                            </td>
                                                            <td className="px-6 py-4">{emp.employee_id}</td>
                                                            <td className="px-6 py-4 text-right">{emp.transactions}</td>
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
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-xl p-6 shadow-sm min-h-[400px] transition-colors">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Penjualan per Karyawan</h3>
                                        <div className="h-[300px] w-full">
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
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAX TAB */}
                            {activeTab === 'tax' && salesSummary && (
                                <div className="flex flex-col gap-6">
                                    {/* Stats Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            { label: 'Total Pajak Terkumpul', value: formatRupiah(salesSummary.total_tax), icon: 'account_balance', color: 'text-red-500', bg: 'bg-red-500/10' },
                                            { label: 'Total Diskon Diberikan', value: formatRupiah(salesSummary.total_discounts), icon: 'sell', color: 'text-orange-500', bg: 'bg-orange-500/10' },
                                            { label: 'Total Pengembalian', value: salesSummary.refunded_orders, icon: 'keyboard_return', color: 'text-purple-500', bg: 'bg-purple-500/10' },
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-xl p-5 shadow-sm transition-colors">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-gray-500 dark:text-text-secondary text-sm font-medium mb-1">{stat.label}</p>
                                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                                                    </div>
                                                    <div className={`size-10 rounded-lg ${stat.bg} flex items-center justify-center ${stat.color}`}>
                                                        <span className="material-symbols-outlined">{stat.icon}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-xl p-6 shadow-sm min-h-[400px] max-w-2xl mx-auto w-full transition-colors">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Rincian Potongan Keuangan</h3>
                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={[
                                                            { name: 'Pajak', value: Number(salesSummary.total_tax) },
                                                            { name: 'Diskon', value: Number(salesSummary.total_discounts) },
                                                        ]}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={100}
                                                        dataKey="value"
                                                    >
                                                        <Cell fill="#ef4444" />
                                                        <Cell fill="#f59e0b" />
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: isDark ? '#1c1c27' : '#ffffff', borderColor: isDark ? '#3b3c54' : '#e2e8f0' }}
                                                        itemStyle={{ color: isDark ? '#fff' : '#1e293b' }}
                                                        formatter={(value: any) => formatRupiah(value)}
                                                    />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};


export default ReportsPage;
