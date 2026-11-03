import { Navigate, Outlet, useLocation } from 'react-router';
import { useSession } from '../queries/useSession';
import { homeFor } from '../utils/constants';
import type { MerchantRole } from '@/types/domain';
import { ConsoleAccountControls, useConsoleAuth } from '@octap/shared/google-auth';

export function RequireRoles({ merchantRoles = [] }: { merchantRoles?: MerchantRole[] }) {
  const auth = useConsoleAuth();
  const session = useSession();
  const location = useLocation();

  if (auth) {
    if (!auth.identity) return <Navigate to="/login" replace />;
    if (!auth.selected)
      return (
        <Navigate
          to={auth.identity.organizations.length ? '/organizations' : '/onboarding'}
          replace
        />
      );
    if (
      !merchantRoles.includes(auth.owner ? 'owner' : 'developer') ||
      (!auth.owner && location.pathname.startsWith('/merchant'))
    )
      return <Navigate to={auth.owner ? '/merchant' : '/developer'} replace />;
    if (!auth.data.organization)
      return (
        <>
          <p role={auth.error ? 'alert' : 'status'}>
            {auth.error || 'Loading current organization access…'}
          </p>
          {auth.error && <ConsoleAccountControls />}
        </>
      );
    return <Outlet />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const userMerchantRole = session.user.merchantRole ?? 'viewer';

  if (merchantRoles.includes(userMerchantRole)) {
    return <Outlet />;
  }

  return <Navigate to={homeFor(session.user)} replace state={{ from: location.pathname }} />;
}

export function RequireBusinessMode() {
  const session = useSession();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function RootRedirect() {
  const session = useSession();
  return <Navigate to={session ? homeFor(session.user) : '/login'} replace />;
}
