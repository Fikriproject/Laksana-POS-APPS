import ThemeToggle from './ThemeToggle';

interface HeaderProps {
    onMenuClick?: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
    return (
        <header className="flex flex-col md:flex-row justify-between md:items-end gap-4">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 -ml-2 text-text-secondary hover:text-primary transition-colors"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>

                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Good Morning, Admin</h2>
                    <p className="text-text-secondary mt-1">Here's what's happening with your store today.</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <ThemeToggle />
                <div className="flex items-center gap-2 text-text-secondary bg-surface-light dark:bg-surface-dark px-4 py-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>calendar_today</span>
                    <span className="text-sm font-medium">Oct 24, 2023</span>
                </div>
            </div>
        </header>
    );
};

export default Header;
