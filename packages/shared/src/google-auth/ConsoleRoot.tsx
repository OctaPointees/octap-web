import { Navigate, Outlet } from 'react-router';
import {
  ConsoleSessionContext,
  useConsoleController,
  useConsoleAuth,
  type ConsoleSessionOptions,
} from './console-session';
import { GooglePortalLogin } from './GooglePortalLogin';

export function ConsoleRoot(props: ConsoleSessionOptions) {
  const auth = useConsoleController(props);
  return (
    <ConsoleSessionContext.Provider value={auth}>
      <Outlet />
    </ConsoleSessionContext.Provider>
  );
}
export function ConsoleLogin() {
  const auth = useConsoleAuth();
  if (!auth) return null;
  if (auth.identity)
    return (
      <Navigate
        to={
          auth.portal === 'admin'
            ? '/admin'
            : auth.entrySlug
              ? `/orgs/${auth.entrySlug}`
              : auth.invitation
                ? '/onboarding'
                : auth.selected
                  ? auth.owner
                    ? '/merchant'
                    : '/developer'
                  : auth.identity.organizations.length
                    ? '/organizations'
                    : '/onboarding'
        }
        replace
      />
    );
  return (
    <>
      {auth.error && (
        <p role="alert" className="alert alert-warning">
          {auth.error}
        </p>
      )}
      <GooglePortalLogin
        clientId={auth.clientId}
        apiBaseUrl={auth.apiBaseUrl}
        portal={auth.portal}
        onAuthenticated={auth.signedIn}
        embedded
      />
    </>
  );
}
export function ConsoleSignedIn() {
  const auth = useConsoleAuth();
  return auth?.identity ? <Outlet /> : <Navigate to="/login" replace />;
}
export function ConsoleAccountControls() {
  const auth = useConsoleAuth();
  if (!auth?.identity) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs hidden xl:block">
        {auth.identity.user.systemRole === 'SYSTEM_ADMIN' ? 'System Admin' : 'System User'}
      </span>
      <button
        className="btn btn-outline btn-sm"
        disabled={auth.busy}
        onClick={() => void auth.perform(async () => {}, 'Access refreshed')}
      >
        Refresh access
      </button>
      <button className="btn btn-ghost btn-sm" disabled={auth.busy} onClick={auth.signOut}>
        Sign out
      </button>
    </div>
  );
}
