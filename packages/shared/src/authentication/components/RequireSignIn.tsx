import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../hooks/useAuth';

/** Route guard: renders the child routes when signed in, otherwise goes to the login page. */
export function RequireSignIn({ loginPath = '/login' }: { loginPath?: string }) {
  return useAuth().identity ? <Outlet /> : <Navigate to={loginPath} replace />;
}
