import { useAuth } from '../context/AuthContext';
import { formatRupiah } from '../utils/format';

// Keep TransactionStatus if needed, or update based on API
type TransactionStatus = 'completed' | 'pending' | 'failed' | 'refunded' | 'cancelled';

interface Transaction {
    id: string;
    order_number: string;
    customer_name?: string;
    total_amount: string | number;
    status: TransactionStatus;
}

interface RecentTransactionsProps {
    transactions: Transaction[];
}

const statusStyles: Record<string, { bg: string; label: string }> = {
    completed: { bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20', label: 'Selesai' },
    pending: { bg: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20', label: 'Menunggu' },
    failed: { bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20', label: 'Gagal' },
    refunded: { bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20', label: 'Refund' },
    cancelled: { bg: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20', label: 'Dibatalkan' },
};

const RecentTransactions = ({ transactions }: RecentTransactionsProps) => {
    const { user } = useAuth();

    const formatCurrency = (amount: string | number) => {
        return formatRupiah(amount as number);
    };

    return (
        <section className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-[#282839] shadow-sm flex flex-col h-full overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-[#282839] flex justify-between items-center">
                <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Transaksi Terakhir</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Riwayat nota transaksi terbaru kasir</p>
                </div>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                    <a href="/reports" className="text-primary text-xs font-bold hover:underline flex items-center gap-1">
                        <span>Lihat Semua</span>
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </a>
                )}
            </div>
            <div className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[11px] font-bold text-gray-400 border-b border-slate-100 dark:border-[#282839] bg-slate-50/50 dark:bg-white/[0.02]">
                            <th className="px-5 py-3.5 uppercase tracking-wider">No. Nota</th>
                            <th className="px-5 py-3.5 uppercase tracking-wider">Pelanggan</th>
                            <th className="px-5 py-3.5 uppercase tracking-wider">Total</th>
                            <th className="px-5 py-3.5 uppercase tracking-wider text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="text-xs">
                        {transactions.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-400 font-medium">
                                    Belum ada transaksi terbaru
                                </td>
                            </tr>
                        ) : (
                            transactions.map((transaction, index) => {
                                const st = statusStyles[transaction.status] || statusStyles['completed'];
                                return (
                                    <tr
                                        key={transaction.id}
                                        className={`${index < transactions.length - 1 ? 'border-b border-slate-100 dark:border-[#282839]/60' : ''} hover:bg-slate-50 dark:hover:bg-white/5 transition-colors`}
                                    >
                                        <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white">{transaction.order_number}</td>
                                        <td className="px-5 py-3.5 text-gray-600 dark:text-text-secondary">{transaction.customer_name || 'Pelanggan Umum'}</td>
                                        <td className="px-5 py-3.5 font-black text-slate-900 dark:text-white">{formatCurrency(transaction.total_amount)}</td>
                                        <td className="px-5 py-3.5 text-right">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${st.bg}`}>
                                                {st.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default RecentTransactions;
