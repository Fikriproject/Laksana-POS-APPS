import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Product } from '../pages/ProductsPage';

interface QuickPriceModalProps {
    isOpen: boolean;
    product: Product | null;
    onClose: () => void;
    onSuccess: (updatedProduct: Partial<Product>) => void;
    onSwitchToStock?: (product: Product) => void;
    canViewCost?: boolean;
    canUpdateStock?: boolean;
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

export const QuickPriceModal: React.FC<QuickPriceModalProps> = ({
    isOpen,
    product,
    onClose,
    onSuccess,
    onSwitchToStock,
    canViewCost = false,
    canUpdateStock = false
}) => {
    const [price, setPrice] = useState<string>('');
    const [wholesalePrice, setWholesalePrice] = useState<string>('');
    const [wholesaleMinQty, setWholesaleMinQty] = useState<number>(12);
    const [resellerPrice, setResellerPrice] = useState<string>('');
    const [isSaving, setIsSaving] = useState<boolean>(false);

    useEffect(() => {
        if (product && isOpen) {
            setPrice(product.price ? product.price.toString() : '');
            setWholesalePrice(product.wholesale_price ? product.wholesale_price.toString() : '');
            setWholesaleMinQty(Number(product.wholesale_min_qty) || 12);
            setResellerPrice(product.reseller_price ? product.reseller_price.toString() : '');
        }
    }, [product, isOpen]);

    if (!isOpen || !product) return null;

    const cost = Number(product.purchase_price) || 0;
    const numPrice = parseFloat(price) || 0;
    const numWs = wholesalePrice !== '' ? parseFloat(wholesalePrice) : null;
    const numRs = resellerPrice !== '' ? parseFloat(resellerPrice) : null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!numPrice || numPrice <= 0) {
            toast.error('Harga jual eceran wajib diisi dengan nilai yang valid');
            return;
        }

        setIsSaving(true);
        try {
            const payload: any = {
                price: numPrice,
                wholesale_price: numWs,
                wholesale_min_qty: numWs !== null ? Math.max(1, Number(wholesaleMinQty) || 1) : null,
                reseller_price: numRs
            };

            const response = await api.patch(`/products/${product.id}/price`, payload);
            toast.success(`Harga "${product.name}" berhasil diperbarui!`);
            
            const updatedData = response.data?.data || payload;
            onSuccess(updatedData);
            onClose();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Gagal memperbarui harga';
            toast.error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white dark:bg-[#1a1a26] rounded-2xl border border-slate-200 dark:border-[#282839] shadow-2xl w-full max-w-lg overflow-hidden my-auto">
                {/* Header Modal */}
                <div className="p-5 border-b border-slate-100 dark:border-[#282839] flex items-center justify-between bg-slate-50/70 dark:bg-[#161622]">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                            <span className="material-symbols-outlined text-[22px]">price_change</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span>Ubah Harga Jual Barang</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                                    Kasir / Staff
                                </span>
                            </h3>
                            <p className="text-xs text-slate-400">
                                Sesuaikan harga eceran, grosir, dan reseller barang ini
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-gray-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Info Ringkas Produk */}
                <div className="p-4 mx-5 mt-5 rounded-xl bg-slate-50 dark:bg-[#13131c] border border-slate-200/80 dark:border-[#282839]">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
                                {product.name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                                <span>SKU: {product.sku || '-'}</span>
                                <span>•</span>
                                <span>Satuan: {product.base_unit || 'pcs'}</span>
                                <span>•</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                    Stok: {product.stock_quantity} {product.base_unit || 'pcs'}
                                </span>
                            </div>
                        </div>

                        {/* Pintasan ke Modal Stok jika berhak */}
                        {canUpdateStock && onSwitchToStock && (
                            <button
                                type="button"
                                onClick={() => onSwitchToStock(product)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white text-xs font-bold flex items-center gap-1 transition-all shrink-0"
                                title="Buka modal input stok fisik"
                            >
                                <span className="material-symbols-outlined text-[14px]">inventory</span>
                                <span>Stok</span>
                            </button>
                        )}
                    </div>

                    {/* Jika punya izin lihat modal toko */}
                    {canViewCost && cost > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs">
                            <span className="text-slate-500">Harga Modal Kulakan:</span>
                            <span className="font-mono font-bold text-gray-700 dark:text-slate-300">
                                {formatRupiah(cost)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Form Inputs Harga */}
                <form onSubmit={handleSave} className="p-5 space-y-4">
                    {/* 1. Harga Eceran (Utama) */}
                    <div className="p-3.5 rounded-xl border-2 border-primary/20 bg-primary/5 dark:bg-primary/[0.03]">
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-gray-900 dark:text-white uppercase flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-primary" />
                                1. Harga Jual Eceran (Utama) *
                            </label>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                Wajib
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                            Harga umum per {product.base_unit || 'pcs'} untuk pelanggan eceran
                        </p>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                                Rp
                            </span>
                            <input
                                type="number"
                                required
                                min="0"
                                step="any"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                placeholder="0"
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-xl text-lg font-black text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                autoFocus
                            />
                        </div>
                        <div className="flex items-center justify-between mt-1.5 text-xs">
                            <span className="font-semibold text-primary">
                                Preview: {formatRupiah(numPrice)} / {product.base_unit || 'pcs'}
                            </span>
                            {canViewCost && cost > 0 && numPrice > 0 && (
                                <span className={`text-[11px] font-bold ${numPrice < cost ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {numPrice < cost ? `⚠️ Di bawah modal (Rugi Rp ${formatRupiah(cost - numPrice).replace(/^Rp\s?/, '')})` : `Margin: Rp ${formatRupiah(numPrice - cost).replace(/^Rp\s?/, '')}`}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* 2. Harga Grosir */}
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#282839] bg-white dark:bg-[#161622]">
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-purple-500" />
                                2. Harga Grosir (Opsional)
                            </label>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                                Grosir
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                            Harga khusus bagi pelanggan yang beli dalam jumlah minimal
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                    Harga Grosir / {product.base_unit || 'pcs'}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                        Rp
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={wholesalePrice}
                                        onChange={e => setWholesalePrice(e.target.value)}
                                        placeholder="Kosongkan jika tdk ada"
                                        className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                    Min. Beli Grosir ({product.base_unit || 'pcs'})
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        value={wholesaleMinQty}
                                        onChange={e => setWholesaleMinQty(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                                        {product.base_unit || 'pcs'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {numWs !== null && numWs > 0 && (
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-white/5 text-[11px]">
                                <span className="font-semibold text-purple-600 dark:text-purple-400">
                                    {formatRupiah(numWs)} (Min {wholesaleMinQty} {product.base_unit || 'pcs'})
                                </span>
                                {numPrice > 0 && (
                                    <span className="text-slate-500">
                                        Lebih hemat Rp {formatRupiah(Math.max(0, numPrice - numWs)).replace(/^Rp\s?/, '')} dari ecer
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 3. Harga Reseller */}
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#282839] bg-white dark:bg-[#161622]">
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-amber-500" />
                                3. Harga Reseller (Opsional)
                            </label>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
                                Reseller
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                            Harga spesial per {product.base_unit || 'pcs'} untuk mitra reseller atau member terdaftar
                        </p>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                Rp
                            </span>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                value={resellerPrice}
                                onChange={e => setResellerPrice(e.target.value)}
                                placeholder="Kosongkan jika tdk ada harga reseller"
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                            />
                        </div>
                        {numRs !== null && numRs > 0 && (
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-white/5 text-[11px]">
                                <span className="font-semibold text-amber-600 dark:text-amber-400">
                                    Reseller: {formatRupiah(numRs)} / {product.base_unit || 'pcs'}
                                </span>
                                {numPrice > 0 && (
                                    <span className="text-slate-500">
                                        Selisih Rp {formatRupiah(Math.max(0, numPrice - numRs)).replace(/^Rp\s?/, '')}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Tombol Aksi */}
                    <div className="pt-2 flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-[#282839] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/25 transition-all flex items-center gap-1.5"
                        >
                            {isSaving ? (
                                <>
                                    <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[16px]">check</span>
                                    <span>Simpan Perubahan Harga</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuickPriceModal;
