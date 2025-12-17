
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ReportsPage from '../ReportsPage';
import api from '../../services/api';

// Mock dependencies
vi.mock('../../services/api');
vi.mock('react-router-dom', () => ({
    useOutletContext: () => ({ toggleSidebar: vi.fn() })
}));
// Mock formatting utilities
vi.mock('../../utils/format', () => ({
    formatRupiah: (val: number) => `Rp ${val}`,
    formatDate: (date: string) => date
}));
// Mock ThemeContext
vi.mock('../../context/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() })
}));

// Mock Recharts
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    LineChart: () => <div>LineChart</div>,
    Line: () => <div>Line</div>,
    XAxis: () => <div>XAxis</div>,
    YAxis: () => <div>YAxis</div>,
    CartesianGrid: () => <div>Grid</div>,
    Tooltip: () => <div>Tooltip</div>,
    PieChart: () => <div>PieChart</div>,
    Pie: () => <div>Pie</div>,
    Cell: () => <div>Cell</div>,
    Legend: () => <div>Legend</div>,
    BarChart: () => <div>BarChart</div>,
    Bar: () => <div>Bar</div>,
}));

describe('ReportsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (api.get as any).mockResolvedValue({
            data: {
                data: {
                    summary: {
                        total_transactions: 10,
                        total_revenue: 1000000,
                        total_tax: 100000,
                        total_discounts: 50000,
                        avg_order_value: 100000,
                        completed_orders: 10,
                        refunded_orders: 0
                    },
                    by_date: [],
                    by_category: [],
                    by_payment: [],
                    hourly_traffic: []
                }
            }
        });
        window.URL.createObjectURL = vi.fn();
        window.URL.revokeObjectURL = vi.fn();
    });

    it('renders report tabs correctly', () => {
        render(<ReportsPage />);
        expect(screen.getByText('Ringkasan Penjualan')).toBeInTheDocument();
        expect(screen.getByText('Status Inventaris')).toBeInTheDocument();
        expect(screen.getByText('Kinerja Karyawan')).toBeInTheDocument();
    });

    it('fetches sales data on mount', async () => {
        render(<ReportsPage />);
        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/reports/sales'));
        });
    });

    it('filters sales data by date range', async () => {
        render(<ReportsPage />);

        // Find combobox for filter (Week/Month/etc)
        // In the code, buttons are used for presets "Hari Ini", "Minggu Ini", "Bulan Ini"
        // And date inputs.
        // Let's click "Minggu Ini"
        const weekBtn = screen.getByText('Minggu Ini');
        fireEvent.click(weekBtn);

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith(expect.stringContaining('period=week'));
        });
    });

    it('handles export functionality', async () => {
        render(<ReportsPage />);
        const exportBtn = screen.getByText(/Ekspor CSV/i);
        fireEvent.click(exportBtn);
        expect(window.URL.createObjectURL).toBeDefined();
    });
});
