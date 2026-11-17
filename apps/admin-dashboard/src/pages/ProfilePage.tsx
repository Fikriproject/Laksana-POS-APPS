import { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { DashboardContextType } from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import UserFormModal from '../components/UserFormModal';
import UserPermissionsModal from '../components/UserPermissionsModal';
import ThemeToggle from '../components/ThemeToggle';
import UserMenu from '../components/UserMenu';
import toast from 'react-hot-toast';

const ProfilePage = () => {
    const { user, logout, updateCurrentUser, hasPermission } = useAuth();
    const { toggleSidebar } = useOutletContext<DashboardContextType>();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<'profile' | 'management'>(
        searchParams.get('tab') === 'management' ? 'management' : 'profile'
    );

    // Management State
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);

    // Permissions Modal State
    const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
    const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<any>(null);

    const canManageUsers = user?.role === 'admin' || hasPermission('users.manage');

    useEffect(() => {
        if (activeTab === 'management' && canManageUsers) {
            fetchUsers();
        }
    }, [activeTab, canManageUsers]);

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
            toast.success('Pengguna baru berhasil dibuat!');
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal membuat pengguna');
            throw error;
        }
    };

    const handleUpdateUser = async (data: any) => {
        if (!editingUser) return;
        try {
            await api.patch(`/users/${editingUser.id}`, data);
            toast.success('Data pengguna berhasil diperbarui!');
            fetchUsers();
            if (user && user.id === editingUser.id) {
                updateCurrentUser(data);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal memperbarui pengguna');
            throw error;
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menonaktifkan pengguna ini?')) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
            toast.success('Pengguna berhasil dinonaktifkan');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal menghapus pengguna');
        }
    };

    const openPermissionsModal = (userToManage: any) => {
        setSelectedUserForPermissions(userToManage);
        setIsPermissionsOpen(true);
    };

    const handleSavePermissions = async (userId: string, permissions: Record<string, boolean>) => {
        try {
            await api.patch(`/users/${userId}`, { permissions });
            toast.success('Hak akses pengguna berhasil disimpan!');
            fetchUsers();
            if (user && user.id === userId) {
                updateCurrentUser({ permissions });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal menyimpan hak akses');
            throw error;
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
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm">
                            <button
                                onClick={toggleSidebar}
                                className="p-1.5 mr-2 text-gray-500 dark:text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 shrink-0" title="Buka Menu"
                            >
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                            <span className="text-gray-400 dark:text-[#9d9db9]">Beranda</span>
                            <span className="text-gray-300 dark:text-[#585870]">/</span>
                            <span className="text-gray-900 dark:text-white font-medium">Profil</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <UserMenu />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Profil Pengguna</h1>
                        <p className="text-gray-500 dark:text-[#9d9db9] text-xs sm:text-sm mt-0.5">Kelola informasi akun dan pengguna sistem.</p>
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
                                    {canManageUsers && (
                                        <button
                                            onClick={() => setActiveTab('management')}
                                            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2
                                                ${activeTab === 'management' ? 'border-primary text-primary bg-primary/5 dark:bg-[#1f1f2e]' : 'border-transparent text-gray-500 dark:text-[#9d9db9] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1f1f2e]'}`}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                                            Manajemen Karyawan & Hak Akses
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
                                                            <th className="px-6 py-3">Karyawan</th>
                                                            <th className="px-6 py-3">Peran (Role)</th>
                                                            <th className="px-6 py-3">Hak Akses Fitur (Toggle)</th>
                                                            <th className="px-6 py-3">Bergabung</th>
                                                            <th className="px-6 py-3 text-right">Total Transaksi</th>
                                                            <th className="px-6 py-3 text-right">Aksi</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200 dark:divide-[#3b3c54]">
                                                        {loadingUsers ? (
                                                            <tr><td colSpan={6} className="p-6 text-center">Memuat data karyawan...</td></tr>
                                                        ) : users.map(u => {
                                                            const activeCount = u.permissions && typeof u.permissions === 'object'
                                                                ? Object.values(u.permissions).filter(Boolean).length
                                                                : (u.role === 'admin' ? 30 : u.role === 'manager' ? 29 : 4);

                                                            return (
                                                                <tr key={u.id} className={`hover:bg-gray-50 dark:hover:bg-[#1c1c27] transition-colors ${!u.is_active ? 'opacity-50 grayscale' : ''}`}>
                                                                    <td className="px-6 py-4">
                                                                        <div className="font-bold text-gray-900 dark:text-white">{u.full_name}</div>
                                                                        <div className="text-xs text-slate-400">@{u.username}</div>
                                                                    </td>
                                                                    <td className="px-6 py-4 capitalize font-medium">{u.role}</td>
                                                                    <td className="px-6 py-4">
                                                                        {u.role === 'admin' ? (
                                                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                                                                <span className="material-symbols-outlined text-[15px]">admin_panel_settings</span>
                                                                                Akses Penuh (30/30)
                                                                            </span>
                                                                        ) : (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => openPermissionsModal(u)}
                                                                                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 hover:scale-105 transition-all shadow-sm group"
                                                                                title="Klik untuk membuka 30 toggle izin akun ini"
                                                                            >
                                                                                <span className="material-symbols-outlined text-[15px]">tune</span>
                                                                                <span>{activeCount} Fitur Aktif</span>
                                                                                <span className="text-[10px] text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 ml-1">Atur Toggle →</span>
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-6 py-4">{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                                                                    <td className="px-6 py-4 text-right font-mono text-gray-900 dark:text-white">
                                                                        {u.total_transactions || 0}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right">
                                                                        <div className="flex justify-end items-center gap-1">
                                                                            {u.role !== 'admin' && (
                                                                                <button
                                                                                    onClick={() => openPermissionsModal(u)}
                                                                                    className="p-1.5 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                                                    title="Atur Hak Akses Fitur (Toggle)"
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[20px]">tune</span>
                                                                                </button>
                                                                            )}
                                                                            <button
                                                                                onClick={() => openEditModal(u)}
                                                                                className="p-1.5 text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg transition-colors"
                                                                                title="Edit Profil / Password"
                                                                            >
                                                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                                                            </button>
                                                                            {u.id !== user?.id && u.is_active && (
                                                                                <button
                                                                                    onClick={() => handleDeleteUser(u.id)}
                                                                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                                                    title="Nonaktifkan Karyawan"
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
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

                <UserPermissionsModal
                    isOpen={isPermissionsOpen}
                    onClose={() => setIsPermissionsOpen(false)}
                    user={selectedUserForPermissions}
                    onSave={handleSavePermissions}
                />
            </main>
        </div>
    );
};

export default ProfilePage;
