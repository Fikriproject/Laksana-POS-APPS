import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface SidebarLinkProps {
    icon: string;
    label: string;
    to: string;
    danger?: boolean;
    badge?: number;
    onClick?: () => void;
}

const SidebarLink = ({ icon, label, to, danger, badge, onClick }: SidebarLinkProps) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    const baseClasses = "flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all";

    let colorClasses = "text-slate-600 dark:text-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary";

    if (isActive) {
        colorClasses = "bg-primary text-white shadow-md shadow-primary/25 font-semibold";
    } else if (danger) {
        colorClasses = "text-slate-600 dark:text-text-secondary hover:bg-red-500/10 hover:text-red-500";
    }

    return (
        <Link to={to} onClick={onClick} className={`${baseClasses} ${colorClasses}`}>
            <span className="material-symbols-outlined text-[22px]">{icon}</span>
            <span className="text-sm font-medium flex-1">{label}</span>
            {badge !== undefined && badge > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-orange-500 text-white animate-pulse'
                }`} title={`${badge} produk baru menunggu konfirmasi & input harga modal`}>
                    {badge}
                </span>
            )}
        </Link>
    );
};

interface SidebarProps {
    className?: string;
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar = ({ className = '', isOpen = false, onClose }: SidebarProps) => {
    const { logout, user, hasPermission } = useAuth();
    const location = useLocation();
    const { isInstallable, isInstalled, installApp } = usePWAInstall();
    const [pendingProductsCount, setPendingProductsCount] = useState(0);

    const canReviewPendingProducts = user?.role === 'admin' || (hasPermission('products.edit') && hasPermission('products.view_cost'));

    useEffect(() => {
        if (!user || !canReviewPendingProducts) return;
        const loadPendingCount = async () => {
            try {
                const res = await api.get('/products/filter-counts');
                setPendingProductsCount(Number(res.data?.data?.pending || 0));
            } catch {
                // Abaikan jika gagal memuat badge
            }
        };
        loadPendingCount();
        window.addEventListener('products-pending-updated', loadPendingCount);
        return () => window.removeEventListener('products-pending-updated', loadPendingCount);
    }, [user, canReviewPendingProducts, location.pathname]);

    const handleInstallClick = async () => {
        if (isInstallable) {
            const success = await installApp();
            if (success) {
                toast.success('Aplikasi Kasir Laksana berhasil dipasang!');
                onClose?.();
            }
        } else {
            toast('Untuk menginstal di HP/Tablet:\nKetuk Menu browser (titik 3 di Chrome atau tombol Bagikan di Safari) lalu pilih "Tambahkan ke Layar Utama" / "Install Aplikasi".', {
                icon: '📲',
                duration: 6000
            });
        }
    };

    // Close sidebar on route change
    useEffect(() => {
        onClose?.();
    }, [location.pathname]);

    // Close sidebar on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose?.();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Define all links with permissions
    const allLinks = [
        { icon: "dashboard", label: "Dashboard", to: "/", roles: ['admin', 'manager', 'cashier'] },
        { icon: "point_of_sale", label: "Kasir", to: "/pos", permission: 'pos.access', roles: ['admin', 'manager', 'cashier'] },
        { icon: "receipt_long", label: "Rekap Harian", to: "/daily-settlement", permission: 'settlement.view', roles: ['admin', 'manager', 'cashier'] },
        { icon: "shopping_bag", label: "Produk", to: "/products", permission: 'products.view', roles: ['admin', 'manager'] },
        { icon: "barcode_scanner", label: "Cetak Barcode", to: "/barcodes", permission: 'barcode.print', roles: ['admin', 'manager'] },
        { icon: "inventory_2", label: "Inventaris", to: "/inventory", permission: 'inventory.view', roles: ['admin', 'manager'] },
        { icon: "bar_chart", label: "Laporan", to: "/reports", permission: 'reports.view', roles: ['admin', 'manager'] },
        { icon: "print", label: "Pengaturan Printer", to: "/settings/printer", permission: 'settings.printer', roles: ['admin', 'manager', 'cashier'] },
        { icon: "person", label: "Profil & Akun", to: "/profile", roles: ['admin', 'manager', 'cashier'] },
    ];

    // Filter links based on user role and granular permissions
    const filteredLinks = allLinks.filter(link => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        if (link.permission) {
            return hasPermission(link.permission);
        }
        return link.roles.includes(user.role);
    });

    return (
        <>
            {/* Backdrop for all devices */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50 transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container: Universal Drawer untuk Segala Device */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 sm:w-72 h-full flex flex-col 
                bg-white dark:bg-[#151520] border-r border-slate-200 dark:border-[#282839] shadow-2xl
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                ${className}
            `}>
                {/* Logo & Close Button */}
                <div className="p-5 sm:p-6 flex items-center justify-between border-b border-slate-100 dark:border-[#282839]/60">
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm shadow-primary/30 shrink-0">
                            <span className="material-symbols-outlined text-[20px]">point_of_sale</span>
                        </div>
                        <div>
                            <h1 className="text-base font-bold leading-none text-gray-900 dark:text-white">Kasir Laksana</h1>
                            <p className="text-gray-500 dark:text-text-secondary text-xs mt-1">Manajemen v1.0</p>
                        </div>
                    </div>
                    {/* Close Button on all devices */}
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        title="Tutup Menu"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 sm:px-4 py-4 flex flex-col gap-1.5 overflow-y-auto">
                    {filteredLinks.map(link => (
                        <SidebarLink
                            key={link.to}
                            icon={link.icon}
                            label={link.label}
                            to={link.to}
                            badge={link.to === '/products' ? pendingProductsCount : undefined}
                            onClick={() => onClose?.()}
                        />
                    ))}
                </nav>

                {/* Install PWA Button / Status */}
                <div className="px-3 sm:px-4 py-2 border-t border-slate-100 dark:border-[#282839]/60">
                    {!isInstalled ? (
                        <button
                            onClick={handleInstallClick}
                            className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all"
                            title="Pasang aplikasi Kasir Laksana ke layar utama HP / Tablet / Desktop"
                        >
                            <span className="material-symbols-outlined text-[19px]">install_mobile</span>
                            <span>Install Aplikasi</span>
                        </button>
                    ) : (
                        <div className="flex items-center justify-center gap-1.5 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            <span className="material-symbols-outlined text-[16px]">verified</span>
                            <span>Aplikasi Terpasang (PWA)</span>
                        </div>
                    )}
                </div>

                {/* Logout */}
                <div className="p-4 border-t border-slate-200 dark:border-[#282839]">
                    <button
                        onClick={logout}
                        className="w-full text-left"
                    >
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-slate-500 dark:text-text-secondary hover:bg-red-500/10 hover:text-red-500">
                            <span className="material-symbols-outlined">logout</span>
                            <span className="text-sm font-medium">Keluar Akun</span>
                        </div>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
