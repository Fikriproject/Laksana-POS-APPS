import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Product {
    id: string;
    name: string;
    sku: string;
    stock_quantity: number;
    low_stock_threshold: number;
    price: number;
}

interface LowStockReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
    userRole?: string;
}

const LowStockReportModal = ({ isOpen, onClose, products, userRole }: LowStockReportModalProps) => {
    const [reportingId, setReportingId] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleReport = async (product: Product) => {
        if (!confirm(`Laporkan stok menipis untuk ${product.name}?`)) return;

        setReportingId(product.id);
        try {
            await api.post('/stock-reports', {
                product_id: product.id,
                notes: `Stok tersisa: ${product.stock_quantity}. Ambang batas: ${product.low_stock_threshold}`
            });
            alert('Laporan berhasil dikirim ke Admin.');
        } catch (error) {
            console.error('Failed to report stock', error);
            alert('Gagal mengirim laporan.');
        } finally {
            setReportingId(null);
        }
    };

    const handleRestock = (product: Product) => {
        navigate('/inventory', { state: { action: 'stock-in', productId: product.id, productName: product.name } });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl transition-colors">
                <div className="p-6 border-b border-slate-200 dark:border-[#282839] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Laporan Stok Menipis</h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-text-secondary hover:text-gray-900 dark:hover:text-white text-sm">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {products.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-text-secondary py-8">
                            Tidak ada produk dengan stok menipis saat ini.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {products.map(product => (
                                <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#151520] rounded-lg border border-slate-200 dark:border-[#282839] transition-colors">
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">{product.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-text-secondary">SKU: {product.sku}</p>
                                        <div className="flex gap-4 mt-2 text-sm">
                                            <span className="text-red-500 dark:text-red-400">Sisa: {product.stock_quantity}</span>
                                            <span className="text-gray-500 dark:text-text-secondary">Min: {product.low_stock_threshold}</span>
                                        </div>
                                    </div>
                                    {userRole === 'admin' ? (
                                        <button
                                            onClick={() => handleRestock(product)}
                                            className="px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors text-sm font-bold flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-sm">add_box</span>
                                            Isi Stok
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleReport(product)}
                                            disabled={reportingId === product.id}
                                            className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors text-sm font-bold flex items-center gap-2"
                                        >
                                            {reportingId === product.id ? (
                                                <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                                            ) : (
                                                <span className="material-symbols-outlined text-sm">campaign</span>
                                            )}
                                            Lapor
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-[#282839] flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-200 dark:bg-[#282839] text-gray-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-[#32324a] transition-colors font-medium"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LowStockReportModal;
