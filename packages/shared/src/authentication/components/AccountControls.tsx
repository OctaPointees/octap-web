import { useState } from 'react';
import { notify } from '../../components/toast';
import { useAuth } from '../hooks/useAuth';

/** Refresh access and sign out, for screens that block the signed-in user (no access, errors). */
export function AccountControls() {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  if (!auth.identity) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs hidden xl:block">
        {auth.identity.user.systemRole === 'SYSTEM_ADMIN' ? 'System Admin' : 'System User'}
      </span>
      <button
        type="button"
        className="btn btn-outline btn-sm"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          auth
            .refresh()
            .then(() => notify.success('Access refreshed'))
            .catch((cause) => notify.error(cause, 'That did not work'))
            .finally(() => setBusy(false));
        }}
      >
        Refresh access
      </button>
      <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={auth.signOut}>
        Sign out
      </button>
    </div>
  );
}
