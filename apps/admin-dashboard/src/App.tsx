import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Login from './pages/LoginPage';
import POSTerminal from './pages/POSTerminal';
import ReportsPage from './pages/ReportsPage';
import ProductsPage from './pages/ProductsPage';
import ProfilePage from './pages/ProfilePage';
import InventoryPage from './pages/InventoryPage';
import DashboardLayout from './layouts/DashboardLayout';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ConfirmProvider>
          <Router>
            <div className="min-h-screen bg-background-light dark:bg-background-dark text-gray-900 dark:text-white overflow-hidden font-sans transition-colors duration-200">
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#333',
                    color: '#fff',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10B981',
                      secondary: 'white',
                    },
                    style: {
                      background: '#F0FDF4',
                      color: '#065F46',
                      border: '1px solid #BBF7D0',
                      fontWeight: 600
                    }
                  },
                  error: {
                    iconTheme: {
                      primary: '#EF4444',
                      secondary: 'white',
                    },
                    style: {
                      background: '#FEF2F2',
                      color: '#991B1B',
                      border: '1px solid #FECACA',
                      fontWeight: 600
                    }
                  }
                }}
              />
              <Routes>
                <Route path="/login" element={<Login />} />

                {/* Admin Dashboard Layout Routes */}
                <Route element={<DashboardLayout />}>
                  <Route path="/" element={
                    <ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']}>
                      <Dashboard />
                    </ProtectedRoute>
                  } />

                  <Route path="/reports" element={
                    <ProtectedRoute allowedRoles={['admin', 'manager', 'owner']}>
                      <ReportsPage />
                    </ProtectedRoute>
                  } />

                  <Route path="/products" element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']}>
                      <ProductsPage />
                    </ProtectedRoute>
                  } />

                  <Route path="/inventory" element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']}>
                      <InventoryPage />
                    </ProtectedRoute>
                  } />

                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } />
                </Route>

                {/* POS has its own layout */}
                <Route path="/pos" element={
                  <ProtectedRoute allowedRoles={['admin', 'cashier', 'manager']}>
                    <POSTerminal />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </ConfirmProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

