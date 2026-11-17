import {
    AreaChart,
    Area,
    XAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from 'recharts';

import { formatRupiah } from '../utils/format';
import { useTheme } from '../context/ThemeContext';

interface ChartSectionProps {
    data: {
        date: string;
        revenue: number;
    }[];
}

const ChartSection = ({ data }: ChartSectionProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Format tanggal untuk sumbu X (misal: "Sen", "Sel", "Rab")
    const formatXAxis = (dateStr: string) => {
        const date = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
        return date.toLocaleDateString('id-ID', { weekday: 'short' });
    };

    const formatTooltip = (value: any) => {
        return formatRupiah(Number(value) || 0);
    };

    return (
        <section className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-[#282839] shadow-sm p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Tren Penjualan Mingguan</h3>
                    <p className="text-gray-500 dark:text-text-secondary text-xs sm:text-sm">Performa omset penjualan selama 7 hari terakhir</p>
                </div>
                <a
                    href="/reports"
                    className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3.5 py-2 rounded-xl transition-colors shadow-sm"
                >
                    <span className="material-symbols-outlined text-[16px]">bar_chart</span>
                    <span>Lihat Laporan Lengkap</span>
                </a>
            </div>
            <div className="relative w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6467f2" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6467f2" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#282839" : "#e2e8f0"} opacity={isDark ? 0.2 : 0.5} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={formatXAxis}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
                            dy={10}
                        />
                        <Tooltip
                            formatter={formatTooltip}
                            contentStyle={{
                                backgroundColor: isDark ? '#1e1e2d' : '#ffffff',
                                border: isDark ? '1px solid #282839' : '1px solid #e2e8f0',
                                borderRadius: '12px',
                                color: isDark ? '#fff' : '#1e293b'
                            }}
                            itemStyle={{ color: isDark ? '#fff' : '#6467f2' }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                            labelFormatter={(label: any) => new Date(String(label)).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#6467f2"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#chartGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
};

export default ChartSection;
