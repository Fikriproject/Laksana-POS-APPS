import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-200 dark:bg-surface-dark-alt text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle Theme"
        >
            {theme === 'light' ? (
                <span className="material-symbols-outlined text-xl">dark_mode</span>
            ) : (
                <span className="material-symbols-outlined text-xl">light_mode</span>
            )}
        </button>
    );
};

export default ThemeToggle;
