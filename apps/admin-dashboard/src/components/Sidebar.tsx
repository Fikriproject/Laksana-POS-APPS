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

    const baseClasses = "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors";

    let colorClasses = "text-slate-500 dark:text-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary";

    if (isActive) {
        colorClasses = "bg-primary text-white";
    } else if (danger) {
        colorClasses = "text-slate-500 dark:text-text-secondary hover:bg-red-500/10 hover:text-red-500";
    }

    return (
        <Link to={to} onClick={onClick} className={`${baseClasses} ${colorClasses}`}>
            <span className="material-symbols-outlined">{icon}</span>
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

    // Helper to determine if link is active
    const isActive = (path: string) => location.pathname === path;

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

    // Close sidebar on route change (mobile)
    useEffect(() => {
        onClose?.();
    }, [location.pathname]);

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
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 h-full flex flex-col 
                bg-surface-light dark:bg-[#151520] border-r border-slate-200 dark:border-[#282839]
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:static lg:flex-shrink-0
                ${className}
            `}>
                {/* Logo */}
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white">
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>point_of_sale</span>
                        </div>
                        <div>
                            <h1 className="text-base font-bold leading-none">Kasir Laksana</h1>
                            <p className="text-text-secondary text-xs mt-1">Manajemen v1.0</p>
                        </div>
                    </div>
                    {/* Close Button Mobile */}
                    <button
                        onClick={onClose}
                        className="lg:hidden text-slate-500 hover:text-white"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 flex flex-col gap-2 overflow-y-auto">
                    {filteredLinks.map(link => (
                        <SidebarLink
                            key={link.to}
                            icon={link.icon}
                            label={link.label}
                            to={link.to}
                            onClick={() => window.innerWidth < 1024 && onClose?.()}
                        />
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-slate-200 dark:border-[#282839]">
                    <button
                        onClick={logout}
                        className="w-full text-left"
                    >
                        <div className="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-slate-500 dark:text-text-secondary hover:bg-red-500/10 hover:text-red-500">
                            <span className="material-symbols-outlined">logout</span>
                            <span className="text-sm font-medium">Keluar Akun</span>
                        </div>
                    </button>

                    <button
                        onClick={handleShutdown}
                        className="w-full text-left mt-1"
                        title="Matikan Server & Aplikasi"
                    >
                        <div className="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-slate-500 dark:text-text-secondary hover:bg-red-500/10 hover:text-red-500">
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
