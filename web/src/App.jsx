import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';

// Components
import Loading from './components/Loading';
import PrivateRoute from './components/PrivateRoute';

function App() {
  const { isLoading, isAuthenticated, verifyAuth, initTheme } = useStore();

  useEffect(() => {
    initTheme();
    verifyAuth();
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={isAuthenticated ? <Navigate to="/" /> : <Register />} 
      />

      {/* Private routes */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        }
      />

      {/* Redirect unknown routes */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
