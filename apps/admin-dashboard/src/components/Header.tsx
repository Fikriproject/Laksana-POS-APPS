import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';

interface HeaderProps {
    onMenuClick?: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
    const { user } = useAuth();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 11) return 'Selamat Pagi';
        if (hour < 15) return 'Selamat Siang';
        if (hour < 18) return 'Selamat Sore';
        return 'Selamat Malam';
    };

    const todayDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    return (
        <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-2 border-b border-slate-200/80 dark:border-[#282839]">
            <div className="flex items-center gap-3 sm:gap-4">
                {/* Mobile Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 text-gray-500 dark:text-text-secondary hover:text-primary transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 shrink-0"
                    title="Buka Menu"
                >
                    <span className="material-symbols-outlined text-[24px]">menu</span>
                </button>

                <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {getGreeting()}, {user?.full_name || 'Pengguna'}
                    </h2>
                    <p className="text-gray-500 dark:text-text-secondary mt-0.5 text-xs sm:text-sm">
                        {user?.role === 'admin' || user?.role === 'manager'
                            ? "Ringkasan operasional dan performa toko Anda hari ini."
                            : "Ringkasan transaksi dan status persediaan stok toko hari ini."}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto md:ml-0">
                <div className="flex items-center gap-2 text-gray-600 dark:text-text-secondary bg-white dark:bg-surface-dark px-3 py-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-[#282839]">
                    <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
                    <span className="text-xs font-semibold">{todayDate}</span>
                </div>
                <ThemeToggle />
                <UserMenu />
            </div>
        </header>
    );
};

export default Header;
