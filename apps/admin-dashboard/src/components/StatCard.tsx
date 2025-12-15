interface StatCardProps {
    icon: string;
    iconBgColor: string;
    iconColor: string;
    label: string;
    value: string;
    change: string;
    changePositive: boolean;
    onClick?: () => void;
    actionable?: boolean;
}

const StatCard = ({ icon, iconBgColor, iconColor, label, value, change, changePositive, onClick, actionable }: StatCardProps) => {
    return (
        <div
            onClick={onClick}
            className={`bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4 ${actionable ? 'cursor-pointer hover:border-primary transition-colors' : ''}`}
        >
            <div className="flex justify-between items-start">
                <div className={`p-2 ${iconBgColor} rounded-lg ${iconColor}`}>
                    <span className="material-symbols-outlined">{icon}</span>
                </div>
                <span className={`${changePositive ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'} text-xs font-bold px-2 py-1 rounded-full`}>
                    {change}
                </span>
            </div>
            <div>
                <p className="text-gray-500 dark:text-text-secondary text-sm font-medium">{label}</p>
                <h3 className="text-2xl font-bold mt-1">{value}</h3>
            </div>
        </div>
    );
};

export default StatCard;
