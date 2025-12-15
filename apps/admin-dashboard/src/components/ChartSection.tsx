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

    // Format date for display (e.g., "Mon", "Tue")
    const formatXAxis = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    const formatTooltip = (value: number) => {
        return formatRupiah(value);
    };

    return (
        <section className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Weekly Sales Overview</h3>
                    <p className="text-gray-500 dark:text-text-secondary text-sm">Revenue performance over the last 7 days</p>
                </div>
                <button className="flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                    Export Report
                </button>
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
                                borderRadius: '8px',
                                color: isDark ? '#fff' : '#1e293b'
                            }}
                            itemStyle={{ color: isDark ? '#fff' : '#6467f2' }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                            labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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
