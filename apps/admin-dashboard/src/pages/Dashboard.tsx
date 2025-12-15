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

const Dashboard = () => {
    const { user } = useAuth();
    const { toggleSidebar } = useOutletContext<DashboardContextType>();
    const [stats, setStats] = useState({
        revenue: 0,
        transactions: 0,
        netProfit: 0,
        lowStock: 0
    });
    // ... existings state ...
    const [chartData, setChartData] = useState<{ date: string; revenue: number }[]>([]);
    const [topProducts, setTopProducts] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [ordersRes, lowStockRes, chartRes, topProductsRes, recentRes] = await Promise.all([
                    api.get('/orders/today'),
                    api.get('/products/low-stock'),
                    api.get('/reports/sales/by-date?group_by=day&start_date=' + new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + '&end_date=' + new Date().toISOString().split('T')[0]),
                    api.get('/products/top-selling?limit=5'),
                    api.get('/orders?per_page=5')
                ]);

                const revenue = parseFloat(ordersRes.data.data.total_revenue || 0);
                const transactions = parseInt(ordersRes.data.data.total_transactions || 0);
                // netSales is used in other charts potentially, but here we just need netProfit from API
                // const netSales = parseFloat(ordersRes.data.data.net_sales || 0);
                const netProfit = parseFloat(ordersRes.data.data.net_profit || 0);

                setStats({
                    revenue,
                    transactions,
                    netProfit,
                    lowStock: lowStockRes.data.data.length
                });

                setLowStockProducts(lowStockRes.data.data);

                // Process chart data
                const salesData = chartRes.data.data;
                const last7Days = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    last7Days.push(d.toISOString().split('T')[0]);
                }

                const processedChartData = last7Days.map(date => {
                    const found = salesData.find((item: any) => item.date === date);
                    return {
                        date,
                        revenue: found ? Number(found.revenue) : 0
                    };
                });

                setChartData(processedChartData);

                setTopProducts(topProductsRes.data.data);
                setRecentTransactions(recentRes.data.data.orders);

            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="flex flex-col gap-8 w-full p-8 max-w-7xl mx-auto">
            {/* Header */}
            <Header onMenuClick={toggleSidebar} />

            {/* Stats Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon="payments"
                    iconBgColor="bg-primary/10"
                    iconColor="text-primary"
                    label="Pendapatan (Hari Ini)"
                    value={loading ? "..." : formatRupiah(stats.revenue)}
                    change="+12%"
                    changePositive={true}
                />
                <StatCard
                    icon="receipt_long"
                    iconBgColor="bg-blue-500/10"
                    iconColor="text-blue-500"
                    label="Transaksi (Hari Ini)"
                    value={loading ? "..." : stats.transactions.toString()}
                    change="+5%"
                    changePositive={true}
                />
                <StatCard
                    icon="trending_up"
                    iconBgColor="bg-emerald-500/10"
                    iconColor="text-emerald-500"
                    label="Laba Bersih (Hari Ini)"
                    value={loading ? "..." : formatRupiah(stats.netProfit)}
                    change="+8%"
                    changePositive={true}
                />
                <StatCard
                    icon="warning"
                    iconBgColor="bg-orange-500/10"
                    iconColor="text-orange-500"
                    label="Stok Tipis"
                    value={loading ? "..." : `${stats.lowStock} Barang`}
                    change={stats.lowStock > 0 ? "Perhatian" : "Aman"}
                    changePositive={stats.lowStock === 0}
                    actionable={true}
                    onClick={() => setIsStockModalOpen(true)}
                />
            </section>

            <LowStockReportModal
                isOpen={isStockModalOpen}
                onClose={() => setIsStockModalOpen(false)}
                products={lowStockProducts}
                userRole={user?.role}
            />

            {/* Chart Section */}
            <ChartSection data={chartData} />

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
                <TopSellingProducts products={topProducts} />
                <RecentTransactions transactions={recentTransactions} />
            </div>
        </div>
    );
};

export default Dashboard;

