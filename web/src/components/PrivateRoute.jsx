import { Navigate } from 'react-router-dom';
import useStore from '../store/useStore';

export default function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useStore();

  if (isLoading) {
    return null;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}
