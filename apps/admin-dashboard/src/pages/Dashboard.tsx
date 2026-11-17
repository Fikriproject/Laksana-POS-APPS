import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import { DashboardContextType } from '../layouts/DashboardLayout';
import ChartSection from '../components/ChartSection';
import TopSellingProducts from '../components/TopSellingProducts';
import RecentTransactions from '../components/RecentTransactions';
import LowStockReportModal from '../components/LowStockReportModal';
import { formatRupiah } from '../utils/format';

import { useAuth } from '../context/AuthContext';

const formatLocalDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const Dashboard = () => {
    const { user } = useAuth();
    const { toggleSidebar } = useOutletContext<DashboardContextType>();
    const canViewFinancials = user?.role === 'admin' || user?.role === 'manager';

    const [stats, setStats] = useState({
        revenue: 0,
        transactions: 0,
        netProfit: 0,
        lowStock: 0
    });
    const [chartData, setChartData] = useState<{ date: string; revenue: number }[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const today = new Date();
                const todayStr = formatLocalDate(today);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 6);
                const startWeekStr = formatLocalDate(weekAgo);

                const promises: Promise<any>[] = [
                    api.get('/orders/today'),
                    api.get('/products/low-stock'),
                    api.get(`/products/top-selling?limit=5&start_date=${todayStr}&end_date=${todayStr}`),
                    api.get('/orders?per_page=5')
                ];

                if (canViewFinancials) {
                    promises.push(
                        api.get(`/reports/sales/by-date?group_by=day&start_date=${startWeekStr}&end_date=${todayStr}`)
                    );
                }

                const results = await Promise.all(promises);
                const ordersRes = results[0];
                const lowStockRes = results[1];
                const topProductsRes = results[2];
                const recentRes = results[3];
                const chartRes = canViewFinancials ? results[4] : null;

                const revenue = parseFloat(ordersRes.data?.data?.total_revenue || 0);
                const transactions = parseInt(ordersRes.data?.data?.total_transactions || 0);
                const netProfit = parseFloat(ordersRes.data?.data?.net_profit || 0);

                setStats({
                    revenue,
                    transactions,
                    netProfit,
                    lowStock: lowStockRes.data?.data?.length || 0
                });

                setLowStockProducts(lowStockRes.data?.data || []);

                // Process chart data jika berhak melihat pendapatan
                if (chartRes && chartRes.data?.data) {
                    const salesData = chartRes.data.data;
                    const last7Days: string[] = [];
                    for (let i = 6; i >= 0; i--) {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        last7Days.push(formatLocalDate(d));
                    }

                    const processedChartData = last7Days.map(date => {
                        const found = salesData.find((item: any) => item.date === date);
                        return {
                            date,
                            revenue: found ? Number(found.revenue) : 0
                        };
                    });

                    setChartData(processedChartData);
                }

                let topProductsList = topProductsRes.data?.data || [];
                // Fallback jika hari ini belum ada produk terjual, tampilkan all-time top selling
                if (topProductsList.length === 0) {
                    try {
                        const fallbackRes = await api.get('/products/top-selling?limit=5');
                        topProductsList = fallbackRes.data?.data || [];
                    } catch {
                        // ignore fallback error
                    }
                }
                setTopProducts(topProductsList);
                setRecentTransactions(recentRes.data?.data?.orders || []);

            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user?.role, canViewFinancials]);

    return (
        <div className="flex flex-col gap-8 w-full p-8 max-w-7xl mx-auto">
            {/* Header */}
            <Header onMenuClick={toggleSidebar} />

            {/* Kartu Ringkasan KPI Utama (Seragam dengan Rekap Harian) */}
            <section className={`grid grid-cols-2 ${canViewFinancials ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-3 sm:gap-4`}>
                {/* 1. Omset Penjualan Bersih */}
                {canViewFinancials && (
                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between text-gray-500 mb-2">
                            <span className="text-xs font-semibold">Penjualan Bersih (Omset)</span>
                            <div className="size-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[18px]">payments</span>
                            </div>
                        </div>
                        <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white">
                            {loading ? "..." : formatRupiah(stats.revenue)}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                            {stats.transactions} Transaksi Hari Ini
                        </p>
                    </div>
                )}

                {/* 2. Total Transaksi */}
                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-gray-500 mb-2">
                        <span className="text-xs font-semibold">Total Transaksi</span>
                        <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                        </div>
                    </div>
                    <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white">
                        {loading ? "..." : stats.transactions.toLocaleString('id-ID')}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                        Aktivitas kasir hari ini
                    </p>
                </div>

                {/* 3. Stok Tipis & Habis */}
                <div
                    onClick={() => setIsStockModalOpen(true)}
                    className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between cursor-pointer hover:border-amber-400 dark:hover:border-amber-500 transition-all group"
                >
                    <div className="flex items-center justify-between text-gray-500 mb-2">
                        <span className="text-xs font-semibold">Stok Tipis & Habis</span>
                        <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-[18px]">warning</span>
                        </div>
                    </div>
                    <p className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                        {loading ? "..." : `${stats.lowStock} Barang`}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                        <span>{stats.lowStock > 0 ? "Perlu restock segera" : "Semua stok aman"}</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </p>
                </div>

                {/* 4. LABA BERSIH (Hero Card Hijau Kontras) */}
                {canViewFinancials && (
                    <div className="bg-emerald-600 dark:bg-emerald-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg shadow-emerald-600/25 relative overflow-hidden flex flex-col justify-between">
                        <div className="flex items-center justify-between text-emerald-100 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider">LABA BERSIH HARI INI</span>
                            <div className="size-8 rounded-lg bg-white/20 text-white flex items-center justify-center">
                                <span className="material-symbols-outlined text-[18px]">trending_up</span>
                            </div>
                        </div>
                        <p className="text-lg sm:text-2xl font-black text-white">
                            {loading ? "..." : formatRupiah(stats.netProfit)}
                        </p>
                        <p className="text-[11px] text-emerald-100 mt-1">
                            Keuntungan riil masuk kantong
                        </p>
                    </div>
                )}
            </section>

            <LowStockReportModal
                isOpen={isStockModalOpen}
                onClose={() => setIsStockModalOpen(false)}
                products={lowStockProducts}
                userRole={user?.role}
            />

            {/* Chart Section (Hanya untuk Admin / Manager) */}
            {canViewFinancials && (
                <ChartSection data={chartData} />
            )}

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
                <TopSellingProducts products={topProducts} />
                <RecentTransactions transactions={recentTransactions} />
            </div>
        </div>
    );
};

export default Dashboard;

