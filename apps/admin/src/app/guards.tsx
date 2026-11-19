import { Navigate, Outlet } from 'react-router';
import { AccountControls, useAuth } from '@octap/shared/authentication';

/** Signed in as a System Admin. */
export function RequireAdmin() {
  const { identity } = useAuth();
  if (!identity) return <Navigate to="/login" replace />;
  if (identity.user.systemRole !== 'SYSTEM_ADMIN')
    return (
      <>
        <p role="alert">
          This account is not a System Admin. Platform access must be assigned by an authorized
          administrator.
        </p>
        <AccountControls />
      </>
    );
  return <Outlet />;
}
