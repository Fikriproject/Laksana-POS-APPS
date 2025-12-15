import { useEffect, useRef } from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info' | 'success';
}

const ConfirmationModal = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'info'
}: ConfirmationModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onCancel();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger': return 'warning';
            case 'success': return 'check_circle';
            default: return 'info';
        }
    };

    const getColorClass = () => {
        switch (type) {
            case 'danger': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
            case 'success': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
            default: return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
        }
    };

    const getButtonClass = () => {
        switch (type) {
            case 'danger': return 'bg-red-600 hover:bg-red-700 focus:ring-red-200';
            case 'success': return 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-200';
            default: return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-200';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                onClick={onCancel}
            />

            {/* Modal Panel */}
            <div
                ref={modalRef}
                className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-[#1c1c27] text-left shadow-2xl transition-all w-full max-w-md border border-slate-200 dark:border-[#282839] animate-in fade-in zoom-in-95 duration-200"
            >
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full shrink-0 ${getColorClass()}`}>
                            <span className="material-symbols-outlined text-2xl">{getIcon()}</span>
                        </div>
                        <div className="flex-1 pt-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-6 mb-2">
                                {title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-[#9d9db9] leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-[#151520] px-6 py-4 flex flex-col sm:flex-row-reverse gap-3 border-t border-slate-200 dark:border-[#282839]">
                    <button
                        type="button"
                        className={`inline-flex w-full sm:w-auto justify-center rounded-xl border border-transparent px-4 py-2.5 text-sm font-bold text-white shadow-sm focus:outline-none focus:ring-4 transition-all ${getButtonClass()}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                    <button
                        type="button"
                        className="inline-flex w-full sm:w-auto justify-center rounded-xl border border-slate-200 dark:border-[#3b3c54] bg-white dark:bg-[#1c1c27] px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-white shadow-sm hover:bg-gray-50 dark:hover:bg-[#282839] focus:outline-none focus:ring-4 focus:ring-slate-200 dark:focus:ring-slate-800 transition-all"
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
