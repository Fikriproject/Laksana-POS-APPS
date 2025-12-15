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

const statusStyles: Record<string, string> = {
    completed: 'bg-emerald-500/10 text-emerald-500',
    pending: 'bg-yellow-500/10 text-yellow-500',
    failed: 'bg-red-500/10 text-red-500',
    refunded: 'bg-purple-500/10 text-purple-500',
    cancelled: 'bg-gray-500/10 text-gray-500',
};

const RecentTransactions = ({ transactions }: RecentTransactionsProps) => {

    const formatCurrency = (amount: string | number) => {
        return formatRupiah(amount as number);
    };

    return (
        <section className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-bold">Recent Transactions</h3>
                <a href="/reports" className="text-primary text-sm font-medium hover:underline">View All</a>
            </div>
            <div className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-xs text-gray-500 dark:text-text-secondary border-b border-slate-200 dark:border-slate-800">
                            <th className="px-6 py-4 font-medium uppercase tracking-wider">ID</th>
                            <th className="px-6 py-4 font-medium uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-4 font-medium uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {transactions.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-text-secondary">No recent transactions</td>
                            </tr>
                        ) : (
                            transactions.map((transaction, index) => (
                                <tr
                                    key={transaction.id}
                                    className={`${index < transactions.length - 1 ? 'border-b border-slate-200 dark:border-slate-800' : ''} hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors`}
                                >
                                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{transaction.order_number}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-text-secondary">{transaction.customer_name || 'Walk-in Customer'}</td>
                                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">{formatCurrency(transaction.total_amount)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[transaction.status] || statusStyles['completed']}`}>
                                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default RecentTransactions;
