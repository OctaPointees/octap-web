import { Navigate, Outlet } from 'react-router-dom';
import { canAccess, getSession, routeForRole } from '../auth';

export function RequireRole({ area }: { area: 'business' | 'developer' | 'admin' }) {
  const role = getSession();
  if (!role) return <Navigate to="/login" replace />;
  if (!canAccess(role, area)) return <Navigate to={routeForRole(role)} replace />;
  return <Outlet />;
}
