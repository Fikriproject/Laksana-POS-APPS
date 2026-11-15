import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { formatRupiah } from '../utils/format';

interface ShiftData {
    id: string;
    started_at: string;
    opening_cash: number;
    user_name?: string;
    total_orders: number;
    total_sales: number;
    cash_sales: number;
    non_cash_sales: number;
    total_expenses: number;
    expected_cash: number;
}

interface OpenShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (shift: ShiftData) => void;
}

export const OpenShiftModal: React.FC<OpenShiftModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [openingCash, setOpeningCash] = useState<number>(200000);
    const [loading, setLoading] = useState<boolean>(false);

    if (!isOpen) return null;

    const quickAmounts = [50000, 100000, 200000, 300000, 500000];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/shifts/open', { opening_cash: openingCash });
            toast.success('Kasir berhasil dibuka! Selamat bertransaksi.');
            onSuccess(res.data.data);
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal membuka kasir');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="size-11 rounded-xl bg-primary/10 text-primary dark:text-indigo-400 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[26px]">storefront</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Buka Kasir Hari Ini</h2>
                        <p className="text-xs text-gray-500 dark:text-text-secondary">Masukkan uang modal awal di laci (uang kembalian)</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                            Uang Modal Awal (Kembalian di Laci)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">Rp</span>
                            <input
                                type="number"
                                min={0}
                                step="any"
                                value={openingCash || ''}
                                onChange={(e) => setOpeningCash(Number(e.target.value))}
                                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#282839] bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-white font-bold text-lg focus:outline-none focus:border-primary"
                                placeholder="0"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Tombol Cepat Nominal */}
                    <div>
                        <p className="text-[11px] font-medium text-gray-500 mb-1.5">Pilih Cepat:</p>
                        <div className="flex flex-wrap gap-2">
                            {quickAmounts.map((amt) => (
                                <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setOpeningCash(amt)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                                        openingCash === amt
                                            ? 'bg-primary text-white border-primary shadow-sm'
                                            : 'bg-gray-100 dark:bg-surface-dark/80 text-gray-700 dark:text-gray-300 border-slate-200 dark:border-[#282839] hover:border-primary/50'
                                    }`}
                                >
                                    {formatRupiah(amt)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2 flex gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#282839] text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >
                            Nanti Saja
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-md shadow-primary/25 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                            {loading ? (
                                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                    Buka Kasir
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface PettyCashModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const PettyCashModal: React.FC<PettyCashModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [amount, setAmount] = useState<number>(0);
    const [category, setCategory] = useState<string>('Operasional');
    const [description, setDescription] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    if (!isOpen) return null;

    const categories = ['Operasional', 'Belanja', 'Konsumsi', 'Tamu', 'Lainnya'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (amount <= 0) {
            toast.error('Nominal pengeluaran harus lebih dari Rp 0');
            return;
        }

        setLoading(true);
        try {
            await api.post('/expenses', {
                amount,
                category,
                description: description.trim() || `Pengeluaran ${category}`
            });
            toast.success(`Kas keluar ${formatRupiah(amount)} berhasil dicatat!`);
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal mencatat pengeluaran');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">payments</span>
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Catat Kas Keluar (Peti Kas)</h2>
                        <p className="text-xs text-gray-500 dark:text-text-secondary">Uang yang diambil langsung dari laci kasir</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                            Nominal Pengeluaran
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">Rp</span>
                            <input
                                type="number"
                                min={0}
                                step="any"
                                value={amount || ''}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="w-full pl-11 pr-4 py-2 rounded-xl border border-slate-200 dark:border-[#282839] bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-white font-bold text-base focus:outline-none focus:border-primary"
                                placeholder="0"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                            Kategori Pengeluaran
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategory(cat)}
                                    className={`px-3 py-1 text-xs rounded-lg border font-medium transition-all ${
                                        category === cat
                                            ? 'bg-red-500 text-white border-red-500 shadow-sm'
                                            : 'bg-gray-100 dark:bg-surface-dark text-gray-600 dark:text-gray-300 border-slate-200 dark:border-[#282839]'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                            Keterangan / Keperluan
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#282839] bg-gray-50 dark:bg-background-dark text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                            placeholder="Contoh: Beli kantong plastik, beli air galon, dll."
                        />
                    </div>

                    <div className="pt-2 flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#282839] text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading || amount <= 0}
                            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-md shadow-red-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                            {loading ? (
                                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">save</span>
                                    Simpan Kas Keluar
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface CloseShiftModalProps {
    isOpen: boolean;
    shift: ShiftData | null;
    onClose: () => void;
    onSuccess: (summary: any) => void;
}

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({ isOpen, shift, onClose, onSuccess }) => {
    const [actualCash, setActualCash] = useState<number>(0);
    const [showBreakdown, setShowBreakdown] = useState<boolean>(false);
    const [counts, setCounts] = useState<{ [key: number]: number }>({
        100000: 0,
        50000: 0,
        20000: 0,
        10000: 0,
        5000: 0,
        2000: 0,
        1000: 0,
        500: 0
    });
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (shift) {
            setActualCash(shift.expected_cash || 0);
        }
    }, [shift]);

    if (!isOpen || !shift) return null;

    const handleCountChange = (denom: number, count: number) => {
        const next = { ...counts, [denom]: Math.max(0, count) };
        setCounts(next);
        const total = Object.entries(next).reduce((sum, [d, c]) => sum + Number(d) * c, 0);
        setActualCash(total);
    };

    const expectedCash = shift.expected_cash || 0;
    const diff = actualCash - expectedCash;
    const isBalanced = diff === 0;

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await api.post('/shifts/close', {
                shift_id: shift.id,
                closing_cash: actualCash
            });
            toast.success('Shift kasir berhasil ditutup!');
            onSuccess(res.data.data);
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal menutup shift');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl my-auto">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="size-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[26px]">lock_clock</span>
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Tutup Kasir / Tutup Toko</h2>
                            <p className="text-xs text-gray-500 dark:text-text-secondary">Hitung fisik uang di laci dan cocokkan dengan sistem</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Ringkasan Data Perhitungan Sistem */}
                <div className="bg-gray-50 dark:bg-background-dark p-3.5 rounded-xl border border-slate-200 dark:border-[#282839] space-y-2 mb-4 text-xs">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Modal Kas Awal:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{formatRupiah(shift.opening_cash)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Penjualan Tunai (+):</span>
                        <span className="font-semibold text-green-600">{formatRupiah(shift.cash_sales)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Pengeluaran / Kas Keluar (-):</span>
                        <span className="font-semibold text-red-600">-{formatRupiah(shift.total_expenses)}</span>
                    </div>
                    <div className="border-t border-slate-200 dark:border-[#282839] pt-2 flex justify-between font-bold text-sm">
                        <span className="text-gray-900 dark:text-white">Uang Seharusnya di Laci:</span>
                        <span className="text-primary dark:text-indigo-400">{formatRupiah(expectedCash)}</span>
                    </div>
                </div>

                {/* Input Fisik Uang di Laci */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-gray-900 dark:text-white">
                            Uang Fisik Aktual di Laci Kasir:
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowBreakdown(!showBreakdown)}
                            className="text-[11px] font-semibold text-primary dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-[14px]">calculate</span>
                            {showBreakdown ? 'Tutup Kalkulator Lembar' : 'Kalkulator Lembaran'}
                        </button>
                    </div>
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">Rp</span>
                        <input
                            type="number"
                            min={0}
                            step="any"
                            value={actualCash || ''}
                            onChange={(e) => setActualCash(Number(e.target.value))}
                            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#282839] bg-white dark:bg-surface-dark text-gray-900 dark:text-white font-bold text-lg focus:outline-none focus:border-primary shadow-sm"
                            placeholder="0"
                        />
                    </div>
                </div>

                {/* Kalkulator Pecahan Lembaran Uang (Opsional) */}
                {showBreakdown && (
                    <div className="p-3 bg-gray-50 dark:bg-background-dark rounded-xl border border-slate-200 dark:border-[#282839] mb-4 space-y-2">
                        <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Hitung Jumlah Lembar Uang:</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.keys(counts).map((denomStr) => {
                                const denom = Number(denomStr);
                                return (
                                    <div key={denom} className="flex items-center justify-between bg-white dark:bg-surface-dark p-2 rounded-lg border border-slate-200 dark:border-[#282839]">
                                        <span className="font-semibold text-gray-600 dark:text-gray-300">{formatRupiah(denom)}</span>
                                        <input
                                            type="number"
                                            min={0}
                                            value={counts[denom] || ''}
                                            onChange={(e) => handleCountChange(denom, Number(e.target.value))}
                                            placeholder="0"
                                            className="w-14 text-right py-1 px-1.5 rounded border border-slate-200 dark:border-[#282839] bg-gray-50 dark:bg-background-dark font-bold text-xs"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Status Selisih */}
                <div className={`p-3 rounded-xl border mb-5 flex items-center justify-between ${
                    isBalanced
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : diff < 0
                        ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                        : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
                }`}>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[22px]">
                            {isBalanced ? 'check_circle' : diff < 0 ? 'warning' : 'info'}
                        </span>
                        <div>
                            <p className="font-bold text-xs">
                                {isBalanced ? 'Uang Pas! Data Sistem & Laci Cocok' : diff < 0 ? 'Uang di Laci Kurang (Selisih Kurang)' : 'Uang di Laci Lebih (Selisih Lebih)'}
                            </p>
                            <p className="text-[11px] opacity-80">
                                {isBalanced ? 'Tidak ada selisih uang di laci.' : diff < 0 ? 'Periksa kemungkinan salah kembalian atau nota terlewat.' : 'Uang fisik lebih banyak dari catatan sistem.'}
                            </p>
                        </div>
                    </div>
                    <span className="font-bold text-sm whitespace-nowrap">
                        {isBalanced ? 'Rp 0' : `${diff > 0 ? '+' : ''}${formatRupiah(diff)}`}
                    </span>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#282839] text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-md shadow-primary/25 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                        {loading ? (
                            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[18px]">lock</span>
                                Selesaikan Tutup Kasir
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
