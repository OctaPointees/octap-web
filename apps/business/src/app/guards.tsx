import { Navigate, Outlet, useLocation } from 'react-router';
import { useSession } from '../queries/useSession';
import { homeFor } from '../utils/constants';
import type { MerchantRole } from '@/types/domain';

export function RequireRoles({ merchantRoles = [] }: { merchantRoles?: MerchantRole[] }) {
  const session = useSession();
  const location = useLocation();

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
