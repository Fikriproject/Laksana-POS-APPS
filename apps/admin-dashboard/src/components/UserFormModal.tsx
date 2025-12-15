import { useState, useEffect } from 'react';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: any;
    isEditing: boolean;
}

const UserFormModal = ({ isOpen, onClose, onSubmit, initialData, isEditing }: UserFormModalProps) => {
    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        role: 'cashier',
        employee_id: '',
        password: '',
        pin_code: '', // For cashier pin login
        email: ''     // Optional
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (initialData && isEditing) {
            setFormData({
                full_name: initialData.full_name || '',
                username: initialData.username || '',
                role: initialData.role || 'cashier',
                employee_id: initialData.employee_id || '',
                password: '', // Don't fill password
                pin_code: initialData.pin_code || '',
                email: initialData.email || ''
            });
        } else {
            setFormData({
                full_name: '',
                username: '',
                role: 'cashier',
                employee_id: '',
                password: '',
                pin_code: '',
                email: ''
            });
        }
    }, [initialData, isEditing, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Filter out empty fields if editing (e.g. password)
            const dataToSend: any = { ...formData };
            if (isEditing && !dataToSend.password) {
                delete dataToSend.password;
            }
            if (dataToSend.role !== 'cashier') {
                delete dataToSend.pin_code;
            }

            await onSubmit(dataToSend);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1c1c27] border border-slate-200 dark:border-[#282839] rounded-xl w-full max-w-lg shadow-2xl transition-colors">
                <div className="p-6 border-b border-slate-200 dark:border-[#282839] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {isEditing ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-[#9d9db9] hover:text-gray-900 dark:hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 dark:text-[#9d9db9] uppercase mb-1">Nama Lengkap</label>
                            <input
                                type="text"
                                required
                                value={formData.full_name}
                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-[#9d9db9] uppercase mb-1">Username</label>
                            <input
                                type="text"
                                required
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-[#9d9db9] uppercase mb-1">Peran (Role)</label>
                            <select
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                            >
                                <option value="cashier">Kasir</option>
                                <option value="manager">Manajer</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-[#9d9db9] uppercase mb-1">ID Karyawan</label>
                            <input
                                type="text"
                                value={formData.employee_id}
                                onChange={e => setFormData({ ...formData, employee_id: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                                placeholder="Cth: EMP001"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-[#9d9db9] uppercase mb-1">Email (Opsional)</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>

                        <div className="col-span-2">
                            <div className="h-px bg-slate-200 dark:bg-[#282839] my-2" />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 dark:text-[#9d9db9] uppercase mb-1">
                                {isEditing ? 'Password Baru (Kosongkan jika tidak ubah)' : 'Password'}
                            </label>
                            <input
                                type="password"
                                required={!isEditing}
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>

                        {formData.role === 'cashier' && (
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-500 dark:text-[#9d9db9] uppercase mb-1">PIN Akses (4 Digit)</label>
                                <input
                                    type="text"
                                    maxLength={4}
                                    pattern="\d{4}"
                                    value={formData.pin_code}
                                    onChange={e => setFormData({ ...formData, pin_code: e.target.value.replace(/\D/g, '') })}
                                    className="w-full bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-primary tracking-[0.5em] font-mono text-center transition-colors"
                                    placeholder="----"
                                />
                                <p className="text-xs text-gray-500 dark:text-[#585870] mt-1">Digunakan untuk login cepat di POS Terminal.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-500 dark:text-[#9d9db9] hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {submitting ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserFormModal;
