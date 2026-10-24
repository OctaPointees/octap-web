import { Navigate, Outlet, useLocation } from 'react-router';
import { useSession } from '../queries/useSession';

export function RequireAdmin() {
  const session = useSession();
  const location = useLocation();
  if (!session || session.user.role !== 'admin') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
