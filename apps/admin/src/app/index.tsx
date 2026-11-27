import { Warning } from 'phosphor-react';
import { useAuth } from '@octap/shared/authentication';
import { Button } from '@octap/shared/components';

import AdminAuthentication from './features/authentication';
import AdminDashboard from './features/dashboard';

/** Shown while a reload signs the returning admin in again. */
function CheckingSession() {
  const { cancelResume } = useAuth();
  return (
    <div
      className="screen-wrapper flex place-center bg-contain bg-no-repeat flex-col"
      style={{ backgroundImage: 'url(/illustrations/server.png)' }}
      role="status"
      aria-label="Checking session"
    >
      <div className="flex flex-col place-center w-1/3 h-1/3 gap-8 bg-base-300/58 backdrop-blur-2xl rounded-box">
        <img src="/favicon.svg" className="size-30" alt="" />
        <span className="loading loading-spinner loading-lg" />
        Fetching the latest data for you! Hang tight!
        <button type="button" className="btn btn-ghost btn-sm" onClick={cancelResume}>
          Sign in with Google instead
        </button>
      </div>

      <div className="text-base-content/67 text-center py-8">
        <div className="font-bold">
          Version 1.0.0 | <span>ENV_{import.meta.env['VITE_ENVIRONMENT'] ?? 'UNKNOWN'}</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminApp() {
  const { identity, resuming, signOut } = useAuth();

  if (resuming) return <CheckingSession />;
  if (!identity) return <AdminAuthentication />;

  if (identity.user.systemRole !== 'SYSTEM_ADMIN') {
    return (
      <div className="screen-wrapper flex flex-col place-center gap-5 p-6 text-center">
        <Warning size={56} className="text-error" />
        <div>
          <h1 className="text-2xl font-bold">Access denied</h1>
          <p className="mt-2 text-base-content/70">
            This account does not have system administrator access.
          </p>
        </div>
        <Button className="btn-primary" onClick={signOut}>
          Sign out
        </Button>
      </div>
    );
  }

  return <AdminDashboard />;
}
