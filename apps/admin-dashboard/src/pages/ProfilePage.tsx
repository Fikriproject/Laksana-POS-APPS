import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { DashboardContextType } from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import UserFormModal from '../components/UserFormModal';

const ProfilePage = () => {
    const { user, logout } = useAuth();
    const { toggleSidebar } = useOutletContext<DashboardContextType>();
    const [activeTab, setActiveTab] = useState<'profile' | 'management'>('profile');

    // Management State
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);

    useEffect(() => {
        if (activeTab === 'management' && user?.role === 'admin') {
            fetchUsers();
        }
    }, [activeTab, user]);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await api.get('/users');
            setUsers(response.data.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleCreateUser = async (data: any) => {
        try {
            await api.post('/users', data);
            alert('User berhasil dibuat');
            fetchUsers();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Gagal membuat user');
            throw error;
        }
    };

    const handleUpdateUser = async (data: any) => {
        if (!editingUser) return;
        try {
            await api.patch(`/users/${editingUser.id}`, data);
            alert('User berhasil diperbarui');
            fetchUsers();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Gagal memperbarui user');
            throw error;
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menonaktifkan pengguna ini?')) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
            alert('User berhasil dinonaktifkan');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Gagal menghapus user');
        }
    };

    const openEditModal = (userToEdit: any) => {
        setEditingUser(userToEdit);
        setIsFormOpen(true);
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setIsFormOpen(true);
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white">

            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header */}
                <header className="flex-shrink-0 px-4 md:px-8 py-4 md:py-6 flex flex-col gap-4 border-b border-slate-200 dark:border-[#282839] bg-white dark:bg-background-dark transition-colors">
                    <div className="flex items-center gap-2 text-sm">
                        <button
                            onClick={toggleSidebar}
                            className="lg:hidden p-1 mr-2 text-text-secondary hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <span className="text-gray-400 dark:text-[#9d9db9]">Beranda</span>
                        <span className="text-gray-300 dark:text-[#585870]">/</span>
                        <span className="text-gray-900 dark:text-white font-medium">Profil</span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Profil Pengguna</h1>
                        <p className="text-gray-500 dark:text-[#9d9db9] text-sm">Kelola informasi akun dan pengguna sistem.</p>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-8 pb-8 pt-6">
                    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
                        {/* Left: User Card */}
                        <div className="w-full lg:w-1/3 flex flex-col gap-6">
                            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b3c54] rounded-xl p-8 flex flex-col items-center text-center shadow-lg relative overflow-hidden transition-colors">
                                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary/20 to-purple-500/20" />
                                <div className="size-24 rounded-full bg-white dark:bg-[#282839] border-4 border-slate-100 dark:border-[#16161f] flex items-center justify-center relative z-10 mb-4 shadow-xl">
                                    <span className="material-symbols-outlined text-4xl text-gray-900 dark:text-white">person</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.full_name}</h2>
                                <p className="text-gray-500 dark:text-[#9d9db9] text-sm mb-4">@{user?.username}</p>

                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase mb-6
                                    ${user?.role === 'admin' ? 'bg-purple-500/10 text-purple-400' :
                                        user?.role === 'manager' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                    {user?.role}
                                </span>

                                <div className="w-full grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-[#3b3c54] pt-6">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-gray-400 dark:text-[#585870] uppercase">ID Karyawan</span>
                                        <span className="font-mono font-bold text-gray-900 dark:text-white">{user?.employee_id || '-'}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-gray-400 dark:text-[#585870] uppercase">Bergabung</span>
                                        <span className="font-mono font-bold text-gray-900 dark:text-white">
                                            {user?.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '-'}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={logout}
                                    className="w-full mt-8 py-2.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold text-sm flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">logout</span>
                                    Keluar
                                </button>
                            </div>
                        </div>

                        {/* Right: Tabs & Content */}
                        <div className="w-full lg:w-2/3">
                            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b3c54] rounded-xl overflow-hidden min-h-[500px] flex flex-col transition-colors">
                                <div className="flex border-b border-slate-200 dark:border-[#3b3c54]">
                                    <button
                                        onClick={() => setActiveTab('profile')}
                                        className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2
                                            ${activeTab === 'profile' ? 'border-primary text-primary bg-primary/5 dark:bg-[#1f1f2e]' : 'border-transparent text-gray-500 dark:text-[#9d9db9] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1f1f2e]'}`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">badge</span>
                                        Detail Profil
                                    </button>
                                    {user?.role === 'admin' && (
                                        <button
                                            onClick={() => setActiveTab('management')}
                                            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2
                                                ${activeTab === 'management' ? 'border-primary text-primary bg-primary/5 dark:bg-[#1f1f2e]' : 'border-transparent text-gray-500 dark:text-[#9d9db9] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1f1f2e]'}`}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                                            Manajemen Pengguna
                                        </button>
                                    )}
                                </div>

                                <div className="p-6 flex-1">
                                    {activeTab === 'profile' ? (
                                        <div className="flex flex-col gap-6">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Informasi Akun</h3>
                                            <p className="text-gray-500 dark:text-[#9d9db9]">Informasi detail mengenai akun Anda saat ini.</p>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#16161f] border border-slate-200 dark:border-[#282839] transition-colors">
                                                    <span className="block text-xs font-bold text-gray-400 dark:text-[#585870] uppercase mb-1">Nama Lengkap</span>
                                                    <span className="text-gray-900 dark:text-white font-medium">{user?.full_name}</span>
                                                </div>
                                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#16161f] border border-slate-200 dark:border-[#282839] transition-colors">
                                                    <span className="block text-xs font-bold text-gray-400 dark:text-[#585870] uppercase mb-1">Email</span>
                                                    <span className="text-gray-900 dark:text-white font-medium">{user?.email || '-'}</span>
                                                </div>
                                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#16161f] border border-slate-200 dark:border-[#282839] transition-colors">
                                                    <span className="block text-xs font-bold text-gray-400 dark:text-[#585870] uppercase mb-1">Username</span>
                                                    <span className="text-gray-900 dark:text-white font-medium">@{user?.username}</span>
                                                </div>
                                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#16161f] border border-slate-200 dark:border-[#282839] transition-colors">
                                                    <span className="block text-xs font-bold text-gray-400 dark:text-[#585870] uppercase mb-1">Hak Akses</span>
                                                    <span className="text-gray-900 dark:text-white font-medium capitalize">{user?.role}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col h-full">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Daftar Pengguna</h3>
                                                <button
                                                    onClick={openCreateModal}
                                                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                                                    Tambah User
                                                </button>
                                            </div>

                                            <div className="flex-1 overflow-x-auto rounded-lg border border-slate-200 dark:border-[#3b3c54]">
                                                <table className="w-full text-left text-sm text-gray-500 dark:text-[#9d9db9]">
                                                    <thead className="bg-gray-100 dark:bg-[#1c1c27] text-gray-900 dark:text-white uppercase text-xs font-semibold">
                                                        <tr>
                                                            <th className="px-6 py-3">User</th>
                                                            <th className="px-6 py-3">Role</th>
                                                            <th className="px-6 py-3">Bergabung</th>
                                                            <th className="px-6 py-3 text-right">Total Transaksi</th>
                                                            <th className="px-6 py-3 text-right">Aksi</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200 dark:divide-[#3b3c54]">
                                                        {loadingUsers ? (
                                                            <tr><td colSpan={5} className="p-6 text-center">Memuat...</td></tr>
                                                        ) : users.map(u => (
                                                            <tr key={u.id} className={`hover:bg-gray-50 dark:hover:bg-[#1c1c27] transition-colors ${!u.is_active ? 'opacity-50 grayscale' : ''}`}>
                                                                <td className="px-6 py-4">
                                                                    <div className="font-bold text-gray-900 dark:text-white">{u.full_name}</div>
                                                                    <div className="text-xs">@{u.username}</div>
                                                                </td>
                                                                <td className="px-6 py-4 capitalize">{u.role}</td>
                                                                <td className="px-6 py-4">{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                                                                <td className="px-6 py-4 text-right font-mono text-gray-900 dark:text-white">
                                                                    {u.total_transactions || 0}
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="flex justify-end gap-2">
                                                                        <button
                                                                            onClick={() => openEditModal(u)}
                                                                            className="p-1 text-primary hover:text-white transition-colors"
                                                                            title="Edit"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                                                        </button>
                                                                        {u.id !== user?.id && u.is_active && (
                                                                            <button
                                                                                onClick={() => handleDeleteUser(u.id)}
                                                                                className="p-1 text-red-500 hover:text-red-400 transition-colors"
                                                                                title="Nonaktifkan"
                                                                            >
                                                                                <span className="material-symbols-outlined text-[20px]">block</span>
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <UserFormModal
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
                    initialData={editingUser}
                    isEditing={!!editingUser}
                />
            </main>
        </div>
    );
};

export default ProfilePage;
