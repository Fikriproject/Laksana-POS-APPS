import React, { useState, useEffect } from 'react';
import {
    PERMISSION_CATEGORIES,
    ALL_PERMISSION_KEYS,
    PRESET_CASHIER_STANDARD,
    PRESET_CASHIER_STOCK_HELPER,
    PRESET_MANAGER,
    PermissionCategory
} from '../utils/permissions';

interface UserPermissionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    onSave: (userId: string, permissions: Record<string, boolean>) => Promise<void>;
}

export const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({
    isOpen,
    onClose,
    user,
    onSave
}) => {
    const [permissions, setPermissions] = useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user && isOpen) {
            let initialPerms: Record<string, boolean> = {};
            if (user.permissions && typeof user.permissions === 'object') {
                initialPerms = { ...user.permissions };
            } else if (user.role === 'manager') {
                initialPerms = { ...PRESET_MANAGER };
            } else if (user.role === 'cashier') {
                initialPerms = { ...PRESET_CASHIER_STANDARD };
            }
            setPermissions(initialPerms);
            setSearchQuery('');
        }
    }, [user, isOpen]);

    if (!isOpen || !user) return null;

    const isAdmin = user.role === 'admin';

    const handleToggle = (key: string) => {
        if (isAdmin) return;
        setPermissions(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSelectAll = () => {
        const next: Record<string, boolean> = {};
        ALL_PERMISSION_KEYS.forEach(key => {
            next[key] = true;
        });
        setPermissions(next);
    };

    const handleDeselectAll = () => {
        const next: Record<string, boolean> = {};
        ALL_PERMISSION_KEYS.forEach(key => {
            next[key] = false;
        });
        setPermissions(next);
    };

    const handleCategoryToggle = (cat: PermissionCategory, enableAll: boolean) => {
        setPermissions(prev => {
            const next = { ...prev };
            cat.permissions.forEach(p => {
                next[p.key] = enableAll;
            });
            return next;
        });
    };

    const handleApplyPreset = (preset: Record<string, boolean>) => {
        const next: Record<string, boolean> = {};
        ALL_PERMISSION_KEYS.forEach(key => {
            next[key] = !!preset[key];
        });
        setPermissions(next);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(user.id, permissions);
            onClose();
        } catch (error) {
            console.error('Failed to save permissions:', error);
        } finally {
            setSaving(false);
        }
    };

    const activeCount = ALL_PERMISSION_KEYS.filter(k => !!permissions[k]).length;

    // Filter categories based on search
    const filteredCategories = PERMISSION_CATEGORIES.map(cat => {
        if (!searchQuery.trim()) return cat;
        const q = searchQuery.toLowerCase();
        const matchesCat = cat.title.toLowerCase().includes(q) || cat.description.toLowerCase().includes(q);
        const filteredPermissions = cat.permissions.filter(p =>
            matchesCat ||
            p.label.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.key.toLowerCase().includes(q)
        );
        return {
            ...cat,
            permissions: filteredPermissions
        };
    }).filter(cat => cat.permissions.length > 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-[#151520] border border-slate-200 dark:border-[#282839] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-all">
                
                {/* Modal Header */}
                <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-[#282839] flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-[#1a1a26]">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0 border border-primary/20 shadow-sm">
                            <span className="material-symbols-outlined text-[24px]">tune</span>
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                                    Atur Hak Akses: {user.full_name}
                                </h2>
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                    user.role === 'admin'
                                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                                        : user.role === 'manager'
                                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                }`}>
                                    @{user.username} ({user.role === 'admin' ? 'Admin' : user.role === 'manager' ? 'Manajer' : 'Kasir'})
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-text-secondary mt-0.5">
                                Aktifkan atau nonaktifkan fitur spesifik untuk akun ini secara leluasa.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                        title="Tutup"
                    >
                        <span className="material-symbols-outlined text-[22px]">close</span>
                    </button>
                </div>

                {/* Notice jika Akun adalah Admin */}
                {isAdmin && (
                    <div className="px-6 py-3.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
                        <span className="material-symbols-outlined text-base shrink-0">admin_panel_settings</span>
                        <span>Akun ini bertindak sebagai <strong>Administrator Utama</strong>. Seluruh 30 fitur otomatis aktif dan terbuka penuh tanpa batasan.</span>
                    </div>
                )}

                {/* Sub-header: Preset Buttons & Quick Filters */}
                {!isAdmin && (
                    <div className="px-5 sm:px-6 py-3.5 border-b border-slate-200 dark:border-[#282839] flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#151520]">
                        {/* Preset Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-500 dark:text-text-secondary mr-1">Preset Cepat:</span>
                            
                            <button
                                type="button"
                                onClick={() => handleApplyPreset(PRESET_CASHIER_STOCK_HELPER)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 shadow-sm"
                                title="Kasir bisa melayani pembeli dan update stok fisik barang, tetapi modal kulakan tertutup rapat"
                            >
                                <span className="material-symbols-outlined text-[15px]">inventory</span>
                                Kasir + Input Stok (Modal Rahasia) ⭐
                            </button>

                            <button
                                type="button"
                                onClick={() => handleApplyPreset(PRESET_CASHIER_STANDARD)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                            >
                                Kasir Standar
                            </button>

                            <button
                                type="button"
                                onClick={() => handleApplyPreset(PRESET_MANAGER)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                            >
                                Manajer Toko
                            </button>
                        </div>

                        {/* Global Actions: Nyalakan/Matikan Semua */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                className="text-xs text-primary hover:underline font-semibold"
                            >
                                Centang Semua
                            </button>
                            <span className="text-slate-300 dark:text-slate-700">|</span>
                            <button
                                type="button"
                                onClick={handleDeselectAll}
                                className="text-xs text-red-500 hover:underline font-semibold"
                            >
                                Matikan Semua
                            </button>
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                <div className="px-5 sm:px-6 py-2.5 border-b border-slate-100 dark:border-[#282839]/60 bg-slate-50/50 dark:bg-[#13131c]">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                            search
                        </span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Cari fitur izin (misal: stok, harga beli, diskon, cetak barcode)..."
                            className="w-full bg-white dark:bg-[#1a1a26] border border-slate-200 dark:border-[#282839] rounded-xl pl-9 pr-4 py-2 text-xs text-gray-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary transition-colors"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gray-900 dark:hover:text-white text-xs"
                            >
                                Hapus
                            </button>
                        )}
                    </div>
                </div>

                {/* Permissions Categories List (Scrollable Area) */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                    {filteredCategories.map(cat => {
                        const totalInCat = cat.permissions.length;
                        const activeInCat = cat.permissions.filter(p => !!permissions[p.key]).length;
                        const isAllActiveInCat = totalInCat > 0 && activeInCat === totalInCat;

                        return (
                            <div
                                key={cat.id}
                                className="border border-slate-200 dark:border-[#282839] rounded-2xl overflow-hidden bg-white dark:bg-[#161622] transition-colors shadow-sm"
                            >
                                {/* Category Header */}
                                <div className="p-3.5 sm:p-4 bg-slate-50/80 dark:bg-[#1c1c2a] border-b border-slate-200/80 dark:border-[#282839] flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                {cat.title}
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                                    {isAdmin ? `${totalInCat}/${totalInCat} Aktif` : `${activeInCat}/${totalInCat} Aktif`}
                                                </span>
                                            </h3>
                                            <p className="text-[11px] text-slate-500 dark:text-text-secondary hidden sm:block">
                                                {cat.description}
                                            </p>
                                        </div>
                                    </div>

                                    {!isAdmin && (
                                        <button
                                            type="button"
                                            onClick={() => handleCategoryToggle(cat, !isAllActiveInCat)}
                                            className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors shrink-0"
                                        >
                                            {isAllActiveInCat ? 'Matikan Semua' : 'Nyalakan Semua'}
                                        </button>
                                    )}
                                </div>

                                {/* Permissions Toggles Grid */}
                                <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-3 divide-y sm:divide-y-0 divide-slate-100 dark:divide-white/5">
                                    {cat.permissions.map(perm => {
                                        const isEnabled = isAdmin || !!permissions[perm.key];
                                        return (
                                            <div
                                                key={perm.key}
                                                onClick={() => !isAdmin && handleToggle(perm.key)}
                                                className={`p-3 rounded-xl border transition-all flex items-start gap-3 select-none ${
                                                    isAdmin
                                                        ? 'border-emerald-500/20 bg-emerald-500/5 opacity-80 cursor-default'
                                                        : isEnabled
                                                            ? 'border-primary/30 bg-primary/5 dark:bg-primary/10 shadow-sm cursor-pointer'
                                                            : 'border-slate-200/70 dark:border-[#282839] hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer'
                                                }`}
                                            >
                                                {/* Toggle Switch Visual */}
                                                <div className="pt-0.5 shrink-0">
                                                    <div
                                                        className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                                                            isEnabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                                                        }`}
                                                    >
                                                        <div
                                                            className={`bg-white size-4 rounded-full shadow-md transform transition-transform ${
                                                                isEnabled ? 'translate-x-5' : 'translate-x-0'
                                                            }`}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Permission Detail */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="material-symbols-outlined text-[16px] text-slate-400">
                                                            {perm.icon}
                                                        </span>
                                                        <h4 className={`text-xs font-bold ${
                                                            isEnabled ? 'text-gray-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                                                        }`}>
                                                            {perm.label}
                                                        </h4>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 dark:text-text-secondary mt-1 leading-relaxed">
                                                        {perm.description}
                                                    </p>
                                                    {perm.warning && (
                                                        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                                            <span className="material-symbols-outlined text-[12px]">security</span>
                                                            <span>{perm.warning}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {filteredCategories.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                            <span className="material-symbols-outlined text-4xl block mb-2">search_off</span>
                            <p className="text-sm">Tidak ada fitur izin yang sesuai dengan pencarian "{searchQuery}".</p>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-[#282839] flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#1a1a26]">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-text-secondary">
                        <span className="size-2 rounded-full bg-emerald-500"></span>
                        <span>
                            {isAdmin
                                ? 'Status: Akses Administrator Penuh (30 Fitur)'
                                : `Total: ${activeCount} dari ${ALL_PERMISSION_KEYS.length} Fitur Diizinkan`}
                        </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-[#282839] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                        >
                            Tutup
                        </button>
                        {!isAdmin && (
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/25 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[16px]">save</span>
                                        <span>Simpan Hak Akses</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
export default UserPermissionsModal;
