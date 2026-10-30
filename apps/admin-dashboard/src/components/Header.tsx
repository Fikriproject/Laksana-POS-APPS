import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

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
        <header className="flex flex-col md:flex-row justify-between md:items-end gap-4">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 text-gray-500 dark:text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 shrink-0" title="Buka Menu"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>

                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {getGreeting()}, {user?.full_name || 'Pengguna'}
                    </h2>
                    <p className="text-gray-500 dark:text-text-secondary mt-1 text-sm">
                        {user?.role === 'admin' || user?.role === 'manager'
                            ? "Ringkasan operasional dan performa toko Anda hari ini."
                            : "Ringkasan transaksi dan status persediaan stok toko hari ini."}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <ThemeToggle />
                <div className="flex items-center gap-2 text-text-secondary bg-surface-light dark:bg-surface-dark px-4 py-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>calendar_today</span>
                    <span className="text-sm font-medium">{todayDate}</span>
                </div>
            </div>
        </header>
    );
};

export default Header;
