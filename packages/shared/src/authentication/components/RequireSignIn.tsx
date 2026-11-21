import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth';

/**
 * Route guard: renders the child routes when signed in, otherwise goes to the login page.
 * `keepState` carries the router state along, so a flow like an invitation survives switching
 * Google accounts.
 */
export function RequireSignIn({
  loginPath = '/login',
  keepState = false,
}: {
  loginPath?: string;
  keepState?: boolean;
}) {
  const { identity } = useAuth();
  const { state } = useLocation();
  return identity ? (
    <Outlet />
  ) : (
    <Navigate to={loginPath} replace state={keepState ? state : undefined} />
  );
}
