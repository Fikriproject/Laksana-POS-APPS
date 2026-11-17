import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

export interface User {
    id: string;
    username: string;
    full_name: string;
    role: 'admin' | 'cashier' | 'manager';
    email?: string;
    employee_id?: string;
    permissions?: Record<string, boolean>;
    created_at?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateCurrentUser: (updatedData: Partial<User>) => void;
    hasPermission: (permissionKey: string) => boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for stored token on mount
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        api.post('/auth/logout').catch(() => { }); // Attempt API logout but ignore errors
    };

    const updateCurrentUser = (updatedData: Partial<User>) => {
        if (!user) return;
        const merged = { ...user, ...updatedData };
        localStorage.setItem('user', JSON.stringify(merged));
        setUser(merged);
    };

    const hasPermission = (permissionKey: string): boolean => {
        if (!user) return false;
        // Admin selalu punya hak akses penuh untuk seluruh fitur
        if (user.role === 'admin') return true;

        // Jika user memiliki permissions object, periksa key tersebut
        if (user.permissions && typeof user.permissions === 'object') {
            if (permissionKey in user.permissions) {
                return !!user.permissions[permissionKey];
            }
        }

        // Fallback default berdasarkan peran jika permission belum pernah diatur
        if (user.role === 'manager') {
            return permissionKey !== 'users.manage';
        }

        if (user.role === 'cashier') {
            // Default kasir jika belum disetel toggle: akses kasir & printer
            return ['pos.access', 'settings.printer'].includes(permissionKey);
        }

        return false;
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!token,
            login,
            logout,
            updateCurrentUser,
            hasPermission,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
