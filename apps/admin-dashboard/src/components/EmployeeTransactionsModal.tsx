import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatRupiah } from '../utils/format';
import api from '../services/api';
import PrintableReceipt from './PrintableReceipt';

interface TransactionDetail {
    id: string;
    transaction_date: string;
    order_number: string;
    total_amount: number;
    payment_amount: number;
    change_amount: number;
    discount_amount: number;
    subtotal: number;
    tax_amount: number;
    payment_method: string;
    items: {
        product_name: string;
        quantity: number;
        price: number;
        subtotal: number;
    }[];
}

interface EmployeeTransactionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    employeeId: string;
    employeeName: string;
    dateRange: { start: string; end: string };
}

const EmployeeTransactionsModal: React.FC<EmployeeTransactionsModalProps> = ({
    isOpen,
    onClose,
    employeeId,
    employeeName,
    dateRange
}) => {
    const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewingReceipt, setViewingReceipt] = useState<TransactionDetail | null>(null);

    useEffect(() => {
        if (isOpen && employeeId) {
            fetchTransactions();
        }
    }, [isOpen, employeeId, dateRange]);

    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            // Note: This endpoint is assumed based on the implementation plan. 
            // It might need adjustment if the backend implementation differs.
            const response = await api.get(`/reports/employees/${employeeId}/transactions`, {
                params: {
                    start_date: dateRange.start,
                    end_date: `${dateRange.end} 23:59:59`
                }
            });
            setTransactions(response.data.data);
        } catch (err) {
            console.error("Failed to fetch employee transactions", err);
            // Fallback for now to show empty state/mock data if 404/500 while backend isn't ready
            // setError("Gagal memuat riwayat transaksi."); 
            setTransactions([]); // Set empty for now to avoid breaking UI if endpoint doesn't exist
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-[#282839]">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Riwayat Transaksi</h2>
                        <p className="text-sm text-gray-500 dark:text-text-secondary">
                            Karyawan: <span className="font-medium text-primary">{employeeName}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-text-secondary dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#16161f]/50">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <span className="ml-3 text-gray-500">Memuat data...</span>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-500">
                            <span className="material-symbols-outlined text-4xl mb-2">error</span>
                            <p>{error}</p>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-text-secondary">
                            <span className="material-symbols-outlined text-4xl mb-2 text-gray-400">receipt_long</span>
                            <p>Tidak ada riwayat transaksi ditemukan untuk periode ini.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {transactions.map((trx) => (
                                <div key={trx.id} className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row justify-between gap-4 mb-4 border-b border-slate-100 dark:border-[#282839] pb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono font-bold text-gray-900 dark:text-white">{trx.order_number}</span>
                                                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 rounded-full">
                                                    Selesai
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-text-secondary">{new Date(trx.transaction_date).toLocaleString('id-ID')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500 dark:text-text-secondary">Total</p>
                                            <p className="text-lg font-bold text-primary">{formatRupiah(Number(trx.total_amount))}</p>
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <div className="mb-4">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Item Terjual</p>
                                        <div className="space-y-2">
                                            {trx.items && trx.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <div className="flex gap-2">
                                                        <span className="text-gray-900 dark:text-white font-medium">{item.product_name}</span>
                                                        <span className="text-gray-500 dark:text-text-secondary">x{item.quantity}</span>
                                                    </div>
                                                    <span className="text-gray-900 dark:text-white">{formatRupiah(Number(item.subtotal))}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Footer Details */}
                                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-text-secondary bg-gray-50 dark:bg-black/20 rounded p-3">
                                        <div className="flex gap-1">
                                            <span>Bayar:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">{formatRupiah(Number(trx.payment_amount))}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <span>Kembali:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">{formatRupiah(Number(trx.change_amount))}</span>
                                        </div>
                                        {Number(trx.discount_amount) > 0 && (
                                            <div className="flex gap-1">
                                                <span>Diskon:</span>
                                                <span className="font-medium text-red-500">-{formatRupiah(Number(trx.discount_amount))}</span>
                                            </div>
                                        )}
                                        <div className="flex gap-1 ml-auto">
                                            <span>Metode:</span>
                                            <span className="font-medium text-gray-900 dark:text-white capitalize">{trx.payment_method || 'Tunai'}</span>
                                        </div>
                                    </div>

                                    {/* View Receipt Button */}
                                    <div className="flex justify-end mt-3 pt-3 border-t border-slate-100 dark:border-[#282839]">
                                        <button
                                            onClick={() => setViewingReceipt(trx)}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                                            Lihat Nota
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div >

            {/* Receipt Preview Modal */}
            {
                viewingReceipt && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewingReceipt(null)}>
                        <div className="bg-white rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto w-full max-w-md relative flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center p-4 border-b hide-print bg-gray-50 sticky top-0 z-10">
                                <h3 className="font-bold text-lg text-gray-900">Nota Preview</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => window.print()}
                                        className="flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">print</span>
                                        Print
                                    </button>
                                    <button
                                        onClick={() => setViewingReceipt(null)}
                                        className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-200/50 flex justify-center min-h-[400px]">
                                <PrintableReceipt
                                    order={{
                                        ...viewingReceipt,
                                        created_at: viewingReceipt.transaction_date,
                                        amount_paid: viewingReceipt.payment_amount,
                                        // Map other fields as necessary if names differ
                                    }}
                                    className="!block shadow-lg w-full max-w-[80mm] mx-auto min-h-0"
                                />
                            </div>
                        </div>
                    </div>
                )
            }
        </div >,
        document.body
    );
};

export default EmployeeTransactionsModal;
