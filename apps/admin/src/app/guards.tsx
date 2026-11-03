import { Navigate, Outlet, useLocation } from 'react-router';
import { useSession } from '../queries/useSession';
import { ConsoleAccountControls, useConsoleAuth } from '@octap/shared/google-auth';

export function RequireAdmin() {
  const auth = useConsoleAuth();
  const session = useSession();
  const location = useLocation();
  if (auth) {
    if (!auth.identity) return <Navigate to="/login" replace />;
    if (auth.identity.user.systemRole !== 'SYSTEM_ADMIN')
      return (
        <>
          <p role="alert">
            This account is not a System Admin. Platform access must be assigned by an authorized
            administrator.
          </p>
          <ConsoleAccountControls />
        </>
      );
    if (auth.error && !auth.data.applications)
      return (
        <>
          <p role="alert">{auth.error}</p>
          <ConsoleAccountControls />
        </>
      );
    return <Outlet />;
  }
  if (!session || session.user.role !== 'admin') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
