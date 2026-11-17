import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const UserMenu: React.FC = () => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Tutup saat klik di luar popover
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const roleName = user?.role === 'admin'
        ? 'Administrator'
        : user?.role === 'manager'
            ? 'Manajer Toko'
            : 'Kasir';

    const roleBadgeColor = user?.role === 'admin'
        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
        : user?.role === 'manager'
            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';

    const initials = (user?.full_name || user?.username || 'U')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <div className="relative shrink-0" ref={menuRef}>
            {/* User Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all text-left ${
                    isOpen
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-slate-200 dark:border-[#282839] bg-white dark:bg-surface-dark hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
                title={`Login sebagai: ${user?.full_name || 'Pengguna'}`}
            >
                <div className="size-8 rounded-lg bg-primary/10 text-primary dark:text-indigo-400 flex items-center justify-center font-black text-xs shrink-0 border border-primary/20">
                    {initials}
                </div>
                <div className="hidden md:flex flex-col text-left pr-1">
                    <span className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[120px]">
                        {user?.full_name || 'Pengguna'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                        {roleName}
                    </span>
                </div>
                <span className="material-symbols-outlined text-gray-400 text-[18px] hidden sm:inline">
                    {isOpen ? 'expand_less' : 'expand_more'}
                </span>
            </button>

            {/* Popover Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl shadow-2xl py-2 z-50 animate-fade-in divide-y divide-slate-100 dark:divide-[#282839]">
                    {/* Header Profil */}
                    <div className="p-4 flex items-center gap-3">
                        <div className="size-12 rounded-xl bg-gradient-to-br from-primary to-indigo-600 text-white flex items-center justify-center font-black text-base shadow-md shadow-primary/25 shrink-0">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {user?.full_name || 'Pengguna Toko'}
                            </h4>
                            <p className="text-xs text-gray-400 truncate">
                                @{user?.username || 'user'}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleBadgeColor}`}>
                                    {roleName}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Aktif
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Informasi Akun */}
                    <div className="p-3 text-xs space-y-1.5 text-gray-600 dark:text-gray-300">
                        {user?.employee_id && (
                            <div className="flex items-center justify-between text-[11px] px-1">
                                <span className="text-gray-400">ID Karyawan:</span>
                                <span className="font-semibold text-gray-700 dark:text-gray-200">{user.employee_id}</span>
                            </div>
                        )}
                        {user?.email && (
                            <div className="flex items-center justify-between text-[11px] px-1">
                                <span className="text-gray-400">Email:</span>
                                <span className="font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[170px]">{user.email}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between text-[11px] px-1">
                            <span className="text-gray-400">Sistem Aplikasi:</span>
                            <span className="font-semibold text-gray-700 dark:text-gray-200">Laksana POS</span>
                        </div>
                    </div>

                    {/* Menu Aksi */}
                    <div className="p-2 space-y-1">
                        <button
                            type="button"
                            onClick={() => {
                                setIsOpen(false);
                                navigate('/profile');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px] text-primary">account_circle</span>
                            <span>Profil Pengguna</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setIsOpen(false);
                                navigate('/settings/printer');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px] text-gray-400">print</span>
                            <span>Pengaturan Printer</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setIsOpen(false);
                                logout();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px] text-red-500">logout</span>
                            <span>Keluar Akun</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
