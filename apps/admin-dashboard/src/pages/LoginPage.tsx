import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const LoginPage = () => {
    const [loginMode, setLoginMode] = useState<'admin' | 'cashier'>('admin');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [pin, setPin] = useState<string>('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // @ts-ignore
    const from = location.state?.from?.pathname || '/';

    const handlePinInput = (digit: string) => {
        if (pin.length < 4) {
            setPin(pin + digit);
        }
    };

    const handlePinBackspace = () => {
        setPin(pin.slice(0, -1));
    };

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/auth/login', { username, password });
            const { token, user } = response.data.data;
            login(token, user);

            // Redirect based on role
            if (user.role === 'cashier') {
                navigate('/pos', { replace: true });
            } else {
                navigate(from === '/login' ? '/' : from, { replace: true });
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login gagal');
        } finally {
            setLoading(false);
        }
    };

    const handlePinSubmit = async () => {
        if (pin.length !== 4) return;
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/auth/login/pin', { pin });
            const { token, user } = response.data.data;
            login(token, user);

            // Redirect based on role
            if (user.role === 'cashier') {
                navigate('/pos', { replace: true });
            } else {
                navigate(from === '/login' ? '/' : from, { replace: true });
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'PIN tidak valid');
            setPin('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display min-h-screen flex flex-col overflow-x-hidden selection:bg-primary selection:text-white">
            {/* Background Pattern/Gradient */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/10 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            {/* Main Content Layout */}
            <main className="relative z-10 flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8">
                {/* Login Card Container */}
                <div className="w-full max-w-[1000px] bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] transition-colors">

                    {/* Left Side: Admin Login */}
                    <div className="flex-1 p-8 sm:p-10 md:p-12 flex flex-col justify-center relative border-b md:border-b-0 md:border-r border-slate-200 dark:border-[#282839]">
                        {/* Logo & Header */}
                        <div className="mb-10">
                            <div className="flex items-center gap-3 mb-6 text-gray-900 dark:text-white">
                                <div className="size-10 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                                    <span className="material-symbols-outlined text-[24px] text-white">point_of_sale</span>
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight">Kasir Laksana</h2>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Selamat Datang</h1>
                            <p className="text-gray-500 dark:text-text-secondary text-sm">Silakan masukkan detail Anda untuk masuk.</p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">error</span>
                                {error}
                            </div>
                        )}

                        {/* Tab Switcher */}
                        <div className="mb-8">
                            <div className="flex h-12 w-full items-center rounded-xl bg-gray-100 dark:bg-[#16161e] border border-slate-200 dark:border-[#282839] p-1 transition-colors">
                                <button
                                    onClick={() => { setLoginMode('admin'); setError(null); }}
                                    className={`flex-1 flex items-center justify-center gap-2 h-full rounded-lg transition-all ${loginMode === 'admin' ? 'bg-white dark:bg-[#282839] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-text-secondary hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                                    <span className="text-sm font-semibold">Admin</span>
                                </button>
                                <button
                                    onClick={() => { setLoginMode('cashier'); setError(null); }}
                                    className={`flex-1 flex items-center justify-center gap-2 h-full rounded-lg transition-colors ${loginMode === 'cashier' ? 'bg-white dark:bg-[#282839] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-text-secondary hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">dialpad</span>
                                    <span className="text-sm font-medium">Kasir</span>
                                </button>
                            </div>
                        </div>

                        {/* Form Fields */}
                        {loginMode === 'admin' && (
                            <form className="flex flex-col gap-5" onSubmit={handleAdminLogin}>
                                <div className="space-y-2">
                                    <label className="text-gray-900 dark:text-white text-sm font-medium leading-normal ml-1">Nama Pengguna</label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-text-secondary group-focus-within:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-[20px]">person</span>
                                        </span>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full h-12 pl-12 pr-4 bg-gray-50 dark:bg-background-dark border border-slate-200 dark:border-[#282839] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                                            placeholder="admin"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-gray-900 dark:text-white text-sm font-medium leading-normal">Kata Sandi</label>
                                    </div>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-text-secondary group-focus-within:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-[20px]">lock</span>
                                        </span>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full h-12 pl-12 pr-12 bg-gray-50 dark:bg-background-dark border border-slate-200 dark:border-[#282839] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                                            placeholder="••••••••"
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-text-secondary hover:text-gray-900 dark:hover:text-white transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                {showPassword ? 'visibility' : 'visibility_off'}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-4 w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Sedang Masuk...' : 'Masuk'}
                                    {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
                                </button>
                            </form>
                        )}

                        {loginMode === 'cashier' && (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                                    <span className="material-symbols-outlined text-3xl">dialpad</span>
                                </div>
                                <h3 className="text-gray-900 dark:text-white text-lg font-bold">Login Kasir</h3>
                                <p className="text-gray-500 dark:text-text-secondary text-sm max-w-[200px]">Gunakan tombol angka di sebelah kanan untuk memasukkan PIN 4 digit Anda.</p>
                            </div>
                        )}

                        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-text-secondary">
                            <span className="material-symbols-outlined text-[14px]">verified_user</span>
                            <span>Diamankan oleh Nexus Security</span>
                        </div>
                    </div>

                    {/* Right Side: Quick Access (PIN Pad) */}
                    <div className="flex-1 bg-gray-50 dark:bg-[#16161e] p-8 sm:p-10 md:p-12 flex flex-col relative overflow-hidden transition-colors">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        <div className="relative z-10 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-gray-900 dark:text-white text-lg font-bold">Akses Cepat</h3>
                                    <p className="text-gray-500 dark:text-text-secondary text-xs">Masukkan 4 digit PIN Anda</p>
                                </div>
                                <div className="px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-500 dark:text-green-400 text-xs font-medium flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">wifi</span>
                                    Online
                                </div>
                            </div>

                            {/* PIN Display */}
                            <div className="mb-8 flex justify-center gap-4">
                                {[0, 1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className={`size-4 rounded-full ${i < pin.length ? 'bg-primary animate-pulse' : 'bg-slate-200 dark:bg-[#282839]'
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* Virtual NumPad */}
                            <div className="flex-1 grid grid-cols-3 gap-3 max-w-[320px] mx-auto w-full">
                                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => handlePinInput(num)}
                                        className="h-16 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] hover:bg-gray-50 dark:hover:bg-[#282839] hover:border-primary/50 text-gray-900 dark:text-white text-xl font-bold transition-all active:scale-95 shadow-sm"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    onClick={handlePinBackspace}
                                    className="h-16 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500 dark:hover:text-red-400 text-gray-500 dark:text-text-secondary text-lg font-medium transition-all active:scale-95 flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined">backspace</span>
                                </button>
                                <button
                                    onClick={() => handlePinInput('0')}
                                    className="h-16 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] hover:bg-gray-50 dark:hover:bg-[#282839] hover:border-primary/50 text-gray-900 dark:text-white text-xl font-bold transition-all active:scale-95 shadow-sm"
                                >
                                    0
                                </button>
                                <button
                                    onClick={handlePinSubmit}
                                    disabled={loading || pin.length !== 4}
                                    className="h-16 rounded-xl bg-primary text-white border border-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 text-lg font-medium transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">check</span>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Links */}
                <div className="fixed bottom-4 left-0 w-full text-center px-4">
                    <div className="inline-flex items-center gap-6 text-gray-500 dark:text-text-secondary text-sm bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md px-6 py-2 rounded-full border border-slate-200 dark:border-[#282839]">
                        <span>v2.4.0</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-[#282839]" />
                        <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Pusat Bantuan</a>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-[#282839]" />
                        <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Status Sistem</a>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LoginPage;
