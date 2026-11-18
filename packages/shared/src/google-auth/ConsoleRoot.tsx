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
      {/* Hold the routes while restoring, so guards don't bounce the reloaded URL to /login. */}
      {auth.resuming ? <ResumingSignIn /> : <Outlet />}
    </ConsoleSessionContext.Provider>
  );
}
function ResumingSignIn() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-base-200 p-4">
      <section
        role="status"
        className="flex w-full max-w-sm flex-col items-center gap-6 rounded-box border border-base-300 bg-base-100 p-8 text-center"
      >
        <span className="loading loading-spinner loading-lg text-primary" />
        <div>
          <h1 className="text-lg font-semibold">Signing you back in!</h1>
          <p className="mt-1 text-sm opacity-70">
            Please hold while we authorize your access request.
          </p>
        </div>
      </section>
    </div>
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
