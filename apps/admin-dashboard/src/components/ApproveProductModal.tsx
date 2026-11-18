import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Product } from '../pages/ProductsPage';
import { useConfirm } from '../context/ConfirmContext';

interface CategoryOption {
    id: number | string;
    name: string;
}

interface ApproveProductModalProps {
    isOpen: boolean;
    product: Product | null;
    categories: CategoryOption[];
    onClose: () => void;
    onApproved: () => void;
    onRejected: () => void;
}

const formatRupiah = (val: number | string | null | undefined): string => {
    if (val === null || val === undefined || val === '') return 'Rp 0';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
};

export const ApproveProductModal: React.FC<ApproveProductModalProps> = ({
    isOpen,
    product,
    categories,
    onClose,
    onApproved,
    onRejected
}) => {
    const { confirm } = useConfirm();

    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [stockQuantity, setStockQuantity] = useState('0');
    const [baseUnit, setBaseUnit] = useState('pcs');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [price, setPrice] = useState('');
    const [wholesalePrice, setWholesalePrice] = useState('');
    const [wholesaleMinQty, setWholesaleMinQty] = useState('12');
    const [resellerPrice, setResellerPrice] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    useEffect(() => {
        if (product && isOpen) {
            setName(product.name || '');
            setSku(product.sku || '');
            setCategoryId(product.category_id ? String(product.category_id) : '');
            setStockQuantity(String(product.stock_quantity ?? 0));
            setBaseUnit(product.base_unit || 'pcs');
            setPurchasePrice(product.purchase_price && Number(product.purchase_price) > 0 ? String(product.purchase_price) : '');
            setPrice(product.price && Number(product.price) > 0 ? String(product.price) : '');
            setWholesalePrice(product.wholesale_price ? String(product.wholesale_price) : '');
            setWholesaleMinQty(String(product.wholesale_min_qty || 12));
            setResellerPrice(product.reseller_price ? String(product.reseller_price) : '');
        }
    }, [product, isOpen]);

    if (!isOpen || !product) return null;

    const numCost = parseFloat(purchasePrice) || 0;
    const numPrice = parseFloat(price) || 0;
    const numWs = wholesalePrice !== '' ? parseFloat(wholesalePrice) : null;
    const numRs = resellerPrice !== '' ? parseFloat(resellerPrice) : null;

    const handleAutoMargin = () => {
        if (numCost <= 0) {
            toast.error('Isi Harga Modal (HPP) terlebih dahulu untuk menghitung margin otomatis.');
            return;
        }
        const round100 = (v: number) => Math.ceil(v / 100) * 100;
        setPrice(String(round100(numCost * 1.35)));
        setWholesalePrice(String(round100(numCost * 1.20)));
        setResellerPrice(String(round100(numCost * 1.10)));
        toast.success('Harga eceran (+35%), grosir (+20%), & reseller (+10%) otomatis dihitung!');
    };

    const calcMargin = (sellVal: number | null) => {
        if (!sellVal || sellVal <= 0 || numCost <= 0) return null;
        const profit = sellVal - numCost;
        const pct = ((profit / numCost) * 100).toFixed(1);
        return { profit, pct, isLoss: profit < 0 };
    };

    const handleApprove = async (e: React.FormEvent) => {
        e.preventDefault();
        if (purchasePrice === '' || isNaN(parseFloat(purchasePrice)) || parseFloat(purchasePrice) < 0) {
            toast.error('Harga Modal (HPP) wajib diisi.');
            return;
        }
        if (!numPrice || numPrice <= 0) {
            toast.error('Harga Jual Eceran wajib diisi (> Rp 0) sebelum produk diaktifkan.');
            return;
        }

        setIsSaving(true);
        try {
            await api.patch(`/products/${product.id}/approve`, {
                name: name.trim(),
                sku: sku.trim(),
                category_id: categoryId ? Number(categoryId) : null,
                stock_quantity: Math.max(0, parseInt(stockQuantity, 10) || 0),
                base_unit: baseUnit.trim() || 'pcs',
                purchase_price: parseFloat(purchasePrice),
                price: numPrice,
                wholesale_price: numWs,
                wholesale_min_qty: numWs !== null ? Math.max(1, parseInt(wholesaleMinQty, 10) || 12) : 12,
                reseller_price: numRs
            });
            toast.success(`"${name}" disetujui & kini aktif di katalog serta kasir POS!`);
            onApproved();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menyetujui produk');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReject = async () => {
        const ok = await confirm({
            title: 'Tolak Pengajuan Produk?',
            message: `Pengajuan "${product.name}" dari ${product.submitted_by || 'Kasir'} akan ditolak dan dihapus permanen dari antrean. Lanjutkan?`,
            confirmText: 'Ya, Tolak & Hapus',
            cancelText: 'Batal',
            type: 'danger'
        });
        if (!ok) return;

        setIsRejecting(true);
        try {
            await api.delete(`/products/${product.id}/reject`);
            toast.success(`Pengajuan "${product.name}" ditolak dan dihapus.`);
            onRejected();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menolak pengajuan');
        } finally {
            setIsRejecting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white dark:bg-[#1a1a26] rounded-2xl border border-slate-200 dark:border-[#282839] shadow-2xl w-full max-w-2xl overflow-hidden my-auto">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-[#282839] flex items-center justify-between bg-amber-50/70 dark:bg-amber-950/20">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[22px]">fact_check</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                                <span>Konfirmasi Produk Baru &amp; Input Modal</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                                    Diajukan: {product.submitted_by || 'Kasir'}
                                </span>
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Lengkapi harga modal (HPP) dan periksa data barang sebelum diaktifkan ke kasir POS.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-gray-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                <form onSubmit={handleApprove} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                    {/* Data Dasar Barang (Bisa dikoreksi Admin sekalian) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#13131c] border border-slate-200/80 dark:border-[#282839]">
                        <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                                Nama Barang *
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-[#1a1a26] border border-slate-200 dark:border-[#282839] rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                                SKU / Barcode
                            </label>
                            <input
                                type="text"
                                value={sku}
                                onChange={e => setSku(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-[#1a1a26] border border-slate-200 dark:border-[#282839] rounded-xl text-xs font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                                Kategori
                            </label>
                            <select
                                value={categoryId}
                                onChange={e => setCategoryId(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-[#1a1a26] border border-slate-200 dark:border-[#282839] rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                            >
                                <option value="">Tanpa Kategori</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                                Stok Awal ({baseUnit})
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={stockQuantity}
                                onChange={e => setStockQuantity(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-[#1a1a26] border border-slate-200 dark:border-[#282839] rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                                Satuan Dasar
                            </label>
                            <input
                                type="text"
                                value={baseUnit}
                                onChange={e => setBaseUnit(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-[#1a1a26] border border-slate-200 dark:border-[#282839] rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    {/* Input Utama Admin: Harga Modal (HPP) */}
                    <div className="p-4 rounded-xl border-2 border-amber-400/60 dark:border-amber-600/60 bg-amber-50/50 dark:bg-amber-950/20">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <label className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px]">payments</span>
                                <span>Harga Pokok / Modal Kulakan (HPP) *</span>
                            </label>
                            <button
                                type="button"
                                onClick={handleAutoMargin}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold border border-indigo-200 dark:border-indigo-800 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[14px]">bolt</span>
                                <span>Isi Otomatis Harga Jual dari Modal</span>
                            </button>
                        </div>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-600 dark:text-amber-400">Rp</span>
                            <input
                                type="number"
                                required
                                min="0"
                                step="any"
                                value={purchasePrice}
                                onChange={e => setPurchasePrice(e.target.value)}
                                placeholder="Masukkan harga beli / modal per satuan..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#111118] border border-amber-300 dark:border-amber-700 rounded-xl text-lg font-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                                autoFocus
                            />
                        </div>
                        <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1">
                            Modal: <strong>{formatRupiah(numCost)}</strong> / {baseUnit || 'pcs'} (hanya dilihat oleh Admin).
                        </p>
                    </div>

                    {/* Harga Jual Eceran, Grosir & Reseller */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Eceran */}
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-[#282839] bg-white dark:bg-[#161622]">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 uppercase">
                                    Eceran *
                                </span>
                                {!price && (
                                    <span className="text-[10px] font-bold text-red-500">Belum diisi kasir</span>
                                )}
                            </div>
                            <div className="relative mt-1.5">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    step="any"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    placeholder="Wajib > 0"
                                    className="w-full pl-8 pr-2.5 py-2 bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-lg text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                                />
                            </div>
                            {(() => {
                                const m = calcMargin(numPrice);
                                if (!m) return <p className="text-[10px] text-slate-400 mt-1">Harga jual utama</p>;
                                return (
                                    <p className={`text-[10px] font-bold mt-1 ${m.isLoss ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {m.isLoss ? `⚠️ Rugi ${formatRupiah(Math.abs(m.profit))}` : `Laba ${formatRupiah(m.profit)} (${m.pct}%)`}
                                    </p>
                                );
                            })()}
                        </div>

                        {/* Grosir */}
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-[#282839] bg-white dark:bg-[#161622]">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 uppercase">
                                    Grosir
                                </span>
                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                    <span>Min:</span>
                                    <input
                                        type="number"
                                        min="1"
                                        value={wholesaleMinQty}
                                        onChange={e => setWholesaleMinQty(e.target.value)}
                                        className="w-11 px-1 py-0.5 text-center rounded bg-slate-100 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] text-[10px] font-bold text-gray-800 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="relative mt-1.5">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={wholesalePrice}
                                    onChange={e => setWholesalePrice(e.target.value)}
                                    placeholder="Opsional"
                                    className="w-full pl-8 pr-2.5 py-2 bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-lg text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            {(() => {
                                const m = calcMargin(numWs);
                                if (!m) return <p className="text-[10px] text-slate-400 mt-1">Opsional</p>;
                                return (
                                    <p className={`text-[10px] font-bold mt-1 ${m.isLoss ? 'text-red-500' : 'text-purple-600 dark:text-purple-400'}`}>
                                        {m.isLoss ? `⚠️ Rugi ${formatRupiah(Math.abs(m.profit))}` : `Laba ${formatRupiah(m.profit)} (${m.pct}%)`}
                                    </p>
                                );
                            })()}
                        </div>

                        {/* Reseller */}
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-[#282839] bg-white dark:bg-[#161622]">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 uppercase">
                                    Reseller
                                </span>
                            </div>
                            <div className="relative mt-1.5">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={resellerPrice}
                                    onChange={e => setResellerPrice(e.target.value)}
                                    placeholder="Opsional"
                                    className="w-full pl-8 pr-2.5 py-2 bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-lg text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-amber-500"
                                />
                            </div>
                            {(() => {
                                const m = calcMargin(numRs);
                                if (!m) return <p className="text-[10px] text-slate-400 mt-1">Opsional</p>;
                                return (
                                    <p className={`text-[10px] font-bold mt-1 ${m.isLoss ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}`}>
                                        {m.isLoss ? `⚠️ Rugi ${formatRupiah(Math.abs(m.profit))}` : `Laba ${formatRupiah(m.profit)} (${m.pct}%)`}
                                    </p>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-3 border-t border-slate-100 dark:border-[#282839] flex flex-wrap items-center justify-between gap-2">
                        <button
                            type="button"
                            onClick={handleReject}
                            disabled={isRejecting || isSaving}
                            className="px-3.5 py-2.5 rounded-xl text-xs font-bold border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white transition-all flex items-center gap-1.5"
                        >
                            <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                            <span>{isRejecting ? 'Menghapus...' : 'Tolak & Hapus'}</span>
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-[#282839] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving || isRejecting}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 transition-all flex items-center gap-1.5"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Mengaktifkan...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                        <span>Setujui &amp; Aktifkan Produk</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApproveProductModal;
