import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: string[];
    requiredPermission?: string;
}

const ProtectedRoute = ({ children, allowedRoles, requiredPermission }: ProtectedRouteProps) => {
    const { isAuthenticated, user, loading, hasPermission } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-[#111118] text-white">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (user) {
        // Admin selalu diizinkan mengakses semua halaman
        if (user.role === 'admin') {
            return <>{children}</>;
        }

        // Jika rute membutuhkan permission tertentu
        if (requiredPermission && hasPermission(requiredPermission)) {
            return <>{children}</>;
        }

        // Jika rute mengizinkan berdasarkan role
        if (allowedRoles && allowedRoles.includes(user.role)) {
            return <>{children}</>;
        }

        // Jika ada permission spesifik yang ditolak
        if (requiredPermission && !hasPermission(requiredPermission)) {
            if (hasPermission('pos.access')) {
                return <Navigate to="/pos" replace />;
            }
            if (hasPermission('products.view')) {
                return <Navigate to="/products" replace />;
            }
            return <Navigate to="/profile" replace />;
        }

        // Default role redirect jika tidak diizinkan
        if (allowedRoles && !allowedRoles.includes(user.role)) {
            if (user.role === 'cashier') {
                return <Navigate to="/pos" replace />;
            }
            return <Navigate to="/login" replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
