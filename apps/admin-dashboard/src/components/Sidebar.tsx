import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

interface SidebarLinkProps {
    icon: string;
    label: string;
    to: string;
    danger?: boolean;
    onClick?: () => void;
}

const SidebarLink = ({ icon, label, to, danger, onClick }: SidebarLinkProps) => {
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
            <span className="text-sm font-medium">{label}</span>
        </Link>
    );
};

interface SidebarProps {
    className?: string;
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar = ({ className = '', isOpen = false, onClose }: SidebarProps) => {
    const { logout, user } = useAuth();
    const location = useLocation();

    const handleShutdown = async () => {
        const isConfirmed = window.confirm('Apakah Anda yakin ingin MENUTUP APLIKASI SEPENUHNYA?\nServer akan dimatikan.');
        if (!isConfirmed) return;

        try {
            toast.loading('Mematikan aplikasi...');
            await api.post('/system/shutdown');
            toast.dismiss();
            toast.success('Aplikasi ditutup.');
            setTimeout(() => {
                window.close();
                document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#000;color:#fff;flex-direction:column;gap:20px;"><h1>Aplikasi Telah Ditutup</h1><p>Silakan tutup browser ini.</p></div>';
            }, 1000);
        } catch (error) {
            console.error(error);
            toast.error('Gagal mematikan server via API.');
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

    // Define all links
    const allLinks = [
        { icon: "dashboard", label: "Dashboard", to: "/", roles: ['admin', 'manager', 'cashier'] },
        { icon: "point_of_sale", label: "Kasir", to: "/pos", roles: ['admin', 'manager', 'cashier'] },
        { icon: "shopping_bag", label: "Produk", to: "/products", roles: ['admin', 'manager'] },
        { icon: "inventory_2", label: "Inventaris", to: "/inventory", roles: ['admin', 'manager'] },
        { icon: "bar_chart", label: "Laporan", to: "/reports", roles: ['admin', 'manager'] },
        { icon: "person", label: "Profil", to: "/profile", roles: ['admin', 'manager', 'cashier'] },
    ];

    // Filter links based on user role
    const filteredLinks = allLinks.filter(link =>
        user && link.roles.includes(user.role)
    );

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
                            onClick={() => onClose?.()}
                        />
                    ))}
                </nav>

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

                    <button
                        onClick={handleShutdown}
                        className="w-full text-left mt-1"
                        title="Matikan Server & Aplikasi"
                    >
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-slate-500 dark:text-text-secondary hover:bg-red-500/10 hover:text-red-500">
                            <span className="material-symbols-outlined">power_settings_new</span>
                            <span className="text-sm font-medium">Tutup Aplikasi</span>
                        </div>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
