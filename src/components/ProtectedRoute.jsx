import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps any route that requires authentication.
 * Optionally restrict to a specific role: <ProtectedRoute role="owner" />
 */
export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) {
    // Not logged in — send to home (auth modal can open from there)
    return <Navigate to="/" replace />;
  }

  if (role && user.role !== role) {
    // Wrong role — send to their correct dashboard
    return <Navigate to={user.role === 'owner' ? '/owner' : '/dashboard'} replace />;
  }

  return children;
}
