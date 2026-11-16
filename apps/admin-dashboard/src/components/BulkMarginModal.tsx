import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

interface BulkMarginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    categories: Array<{ id: string | number; name: string }>;
}

export const BulkMarginModal: React.FC<BulkMarginModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    categories
}) => {
    const [baseMode, setBaseMode] = useState<'cost' | 'retail_discount'>('cost');
    const [wholesalePercent, setWholesalePercent] = useState<number>(25);
    const [resellerPercent, setResellerPercent] = useState<number>(20);
    const [minQty, setMinQty] = useState<number>(12);
    const [scope, setScope] = useState<'empty_only' | 'all'>('empty_only');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [loading, setLoading] = useState<boolean>(false);

    if (!isOpen) return null;

    // Hitung simulasi interaktif dengan contoh modal 600 & ecer 2.000
    const sampleCost = 600;
    const sampleRetail = 2000;
    let rawWs = 0;
    let rawRs = 0;

    if (baseMode === 'retail_discount') {
        rawWs = sampleRetail * (1 - (wholesalePercent || 0) / 100);
        rawRs = sampleRetail * (1 - (resellerPercent || 0) / 100);
    } else {
        rawWs = sampleCost * (1 + (wholesalePercent || 0) / 100);
        rawRs = sampleCost * (1 + (resellerPercent || 0) / 100);
    }

    let previewWs = Math.round(rawWs / 100) * 100;
    let previewRs = Math.round(rawRs / 100) * 100;

    if (previewWs === previewRs && wholesalePercent !== resellerPercent && Math.abs(rawWs - rawRs) >= 1) {
        const ws50 = Math.round(rawWs / 50) * 50;
        const rs50 = Math.round(rawRs / 50) * 50;
        if (ws50 !== rs50) {
            previewWs = ws50;
            previewRs = rs50;
        } else {
            previewWs = Math.round(rawWs / 10) * 10;
            previewRs = Math.round(rawRs / 10) * 10;
        }
    }

    const handleApply = async () => {
        setLoading(true);
        try {
            const res = await api.post('/products/bulk-margin', {
                base_mode: baseMode,
                wholesale_percent: wholesalePercent,
                reseller_percent: resellerPercent,
                min_qty: minQty,
                scope,
                category_id: selectedCategory
            });

            const count = res.data?.data?.updated || 0;
            toast.success(`Berhasil menerapkan margin otomatis ke ${count} produk!`, { duration: 4000 });
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to apply bulk margin:', error);
            toast.error(error.response?.data?.message || 'Gagal menerapkan margin massal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-200 dark:border-[#282839] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                            <span className="material-symbols-outlined text-[24px]">price_change</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-base">Terapkan Margin Massal</h3>
                            <p className="text-xs text-gray-500">Hitung otomatis harga grosir & reseller untuk produk toko</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Form Controls */}
                <div className="p-5 space-y-4 text-xs">
                    {/* Metode Perhitungan Basis */}
                    <div className="space-y-1.5">
                        <label className="text-gray-700 dark:text-gray-300 font-bold block">Basis Perhitungan:</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setBaseMode('cost')}
                                className={`p-2.5 rounded-xl border text-left transition-all ${
                                    baseMode === 'cost'
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold shadow-sm'
                                        : 'border-slate-200 dark:border-[#282839] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                                }`}
                            >
                                <div className="flex items-center gap-1.5 text-xs">
                                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                                    <span>Markup Modal</span>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-0.5 font-normal">Modal + Persen Markup</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setBaseMode('retail_discount')}
                                className={`p-2.5 rounded-xl border text-left transition-all ${
                                    baseMode === 'retail_discount'
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold shadow-sm'
                                        : 'border-slate-200 dark:border-[#282839] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                                }`}
                            >
                                <div className="flex items-center gap-1.5 text-xs">
                                    <span className="material-symbols-outlined text-[16px]">sell</span>
                                    <span>Diskon dari Ecer</span>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-0.5 font-normal">Harga Jual - Diskon %</p>
                            </button>
                        </div>
                    </div>

                    {/* Cakupan Target */}
                    <div className="space-y-1.5">
                        <label className="text-gray-700 dark:text-gray-300 font-bold block">Terapkan Ke:</label>
                        <div className="space-y-2 bg-slate-50 dark:bg-[#111118] p-3 rounded-xl border border-slate-200 dark:border-[#282839]">
                            <label className="flex items-start gap-2 cursor-pointer font-medium text-gray-800 dark:text-gray-200">
                                <input
                                    type="radio"
                                    name="scope"
                                    value="empty_only"
                                    checked={scope === 'empty_only'}
                                    onChange={() => setScope('empty_only')}
                                    className="text-primary focus:ring-primary size-3.5 mt-0.5"
                                />
                                <div>
                                    <span>Hanya produk yang grosir/resellernya masih kosong</span>
                                    <span className="block text-[10px] text-gray-400 font-normal">Tidak akan mengubah produk yang sudah memiliki harga</span>
                                </div>
                            </label>
                            <label className="flex items-start gap-2 cursor-pointer font-medium text-gray-800 dark:text-gray-200">
                                <input
                                    type="radio"
                                    name="scope"
                                    value="all"
                                    checked={scope === 'all'}
                                    onChange={() => setScope('all')}
                                    className="text-primary focus:ring-primary size-3.5 mt-0.5"
                                />
                                <div>
                                    <span className="font-bold text-purple-700 dark:text-purple-300">Semua produk (timpa & perbarui harga lama)</span>
                                    <span className="block text-[10px] text-purple-600/80 dark:text-purple-400/80 font-normal">Pilih opsi ini jika ingin merubah ulang harga yang sudah pernah diset</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Filter Kategori */}
                    <div className="space-y-1">
                        <label className="text-gray-700 dark:text-gray-300 font-bold block">Kategori Produk:</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] text-gray-900 dark:text-white font-medium"
                        >
                            <option value="all">Semua Kategori</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Persentase Margin / Diskon */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                            <label className="text-gray-700 dark:text-gray-300 font-bold block">
                                {baseMode === 'cost' ? 'Margin Grosir (+%)' : 'Diskon Grosir (-%)'}
                            </label>
                            <div className="flex items-center gap-1.5">
                                <input
                                    type="number"
                                    value={wholesalePercent}
                                    onChange={(e) => setWholesalePercent(Number(e.target.value))}
                                    className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] text-gray-900 dark:text-white font-bold"
                                />
                                <span className="font-bold text-gray-400">%</span>
                            </div>
                            <span className="text-[10px] text-gray-400">Min. beli {minQty} pcs</span>
                        </div>

                        <div className="space-y-1">
                            <label className="text-gray-700 dark:text-gray-300 font-bold block">
                                {baseMode === 'cost' ? 'Margin Reseller (+%)' : 'Diskon Reseller (-%)'}
                            </label>
                            <div className="flex items-center gap-1.5">
                                <input
                                    type="number"
                                    value={resellerPercent}
                                    onChange={(e) => setResellerPercent(Number(e.target.value))}
                                    className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] text-gray-900 dark:text-white font-bold"
                                />
                                <span className="font-bold text-gray-400">%</span>
                            </div>
                            <span className="text-[10px] text-gray-400">
                                {baseMode === 'cost' ? 'Di atas harga modal' : 'Potongan dari harga ecer'}
                            </span>
                        </div>
                    </div>

                    {/* Simulasi Interaktif Instan */}
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-900/40 text-[11px] space-y-2">
                        <div className="flex items-center justify-between font-bold text-purple-700 dark:text-purple-300">
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[15px]">calculate</span>
                                <span>Simulasi Hasil Perhitungan:</span>
                            </span>
                            <span className="text-[10px] font-normal text-purple-600/80 dark:text-purple-400/80">
                                (Contoh: Modal Rp 600 · Ecer Rp 2.000)
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white/80 dark:bg-[#111118] p-2 rounded-lg border border-purple-100 dark:border-purple-900/40">
                                <span className="text-[10px] text-gray-400 block font-medium">Harga Grosir:</span>
                                <span className="font-extrabold text-purple-700 dark:text-purple-300 text-sm">
                                    Rp {previewWs.toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="bg-white/80 dark:bg-[#111118] p-2 rounded-lg border border-purple-100 dark:border-purple-900/40">
                                <span className="text-[10px] text-gray-400 block font-medium">Harga Reseller:</span>
                                <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                                    Rp {previewRs.toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="px-5 py-3.5 border-t border-slate-200 dark:border-[#282839] flex justify-end gap-2 shrink-0 bg-slate-50/50 dark:bg-white/[0.02]">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#282839] text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-white/5"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleApply}
                        disabled={loading}
                        className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/25 flex items-center gap-1.5 transition-all"
                    >
                        {loading ? (
                            <>
                                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                <span>Menghitung...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[16px]">bolt</span>
                                <span>Terapkan Sekarang</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkMarginModal;
