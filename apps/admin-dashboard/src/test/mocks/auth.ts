
import { vi } from 'vitest';

export const mockLogin = vi.fn();
export const mockLogout = vi.fn();
export const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin'
};

export const useAuth = vi.fn(() => ({
    user: mockUser,
    login: mockLogin,
    logout: mockLogout,
    isAuthenticated: true,
    loading: false
}));
