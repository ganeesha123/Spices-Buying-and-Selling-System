import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import BuyerDashboard from './components/BuyerDashboard';
import SellerDashboard from './components/SellerDashboard';
import SupportDashboard from './components/SupportDashboard';
import LoadingSpinner from './components/LoadingSpinner';
import OrderFunction from './components/OrderFunction';
import CustomerSupportFunction from './components/CustomerSupportFunction';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          user ? (
            user.role === 'buyer' ? <Navigate to="/buyer" replace /> :
            user.role === 'seller' ? <Navigate to="/seller" replace /> :
            user.role === 'support' ? <Navigate to="/support" replace /> :
            <Navigate to="/about" replace />
          ) : (
            <Navigate to="/about" replace />
          )
        } 
      />
      
      { /* Login page removed */ }
      
      { /* Register page removed */ }

      { /* About and Contact pages removed */ }

      <Route 
        path="/buyer/*" 
        element={
          <ProtectedRoute allowedRoles={['buyer']}>
            <BuyerDashboard />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/buyer/orders" 
        element={
          <ProtectedRoute allowedRoles={['buyer']}>
            <OrderFunction />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/buyer/support" 
        element={
          <ProtectedRoute allowedRoles={['buyer']}>
            <CustomerSupportFunction />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/seller/*" 
        element={
          <ProtectedRoute allowedRoles={['seller']}>
            <SellerDashboard />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/support/*" 
        element={
          <ProtectedRoute allowedRoles={['support']}>
            <SupportDashboard />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/unauthorized" 
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized</h1>
              <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
              <button 
                onClick={() => window.history.back()}
                className="btn-primary"
              >
                Go Back
              </button>
            </div>
          </div>
        } 
      />

      <Route 
        path="*" 
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
              <p className="text-gray-600 mb-4">The page you're looking for doesn't exist.</p>
              <button 
                onClick={() => window.history.back()}
                className="btn-primary"
              >
                Go Back
              </button>
            </div>
          </div>
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
