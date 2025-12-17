
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import LoginPage from '../LoginPage';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Mock dependencies
vi.mock('../context/AuthContext');
vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
    useLocation: vi.fn().mockReturnValue({ state: {} }),
    Link: ({ children, to }: any) => <a href={to}>{children}</a>
}));
vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn() }
}));
vi.mock('../../context/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() })
}));

describe('LoginPage', () => {
    const mockLogin = vi.fn();
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({ login: mockLogin });
        (useNavigate as any).mockReturnValue(mockNavigate);
    });

    it('renders login form', () => {
        render(<LoginPage />);
        expect(screen.getByRole('heading', { name: /selamat datang/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText('admin')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /masuk/i })).toBeInTheDocument();
    });

    it('handles successful login', async () => {
        mockLogin.mockResolvedValue({ success: true, user: { name: 'Test' } });

        render(<LoginPage />);

        fireEvent.change(screen.getByPlaceholderText('admin'), { target: { value: 'admin' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /masuk/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('admin', 'password123');
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('handles login failure', async () => {
        mockLogin.mockRejectedValue(new Error('Invalid credentials'));

        render(<LoginPage />);

        fireEvent.change(screen.getByPlaceholderText('admin'), { target: { value: 'wrongUser' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpass' } });

        fireEvent.click(screen.getByRole('button', { name: /masuk/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalled();
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });
});
