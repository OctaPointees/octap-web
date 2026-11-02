import { useEffect, useRef, useState } from 'react';
import {
  assertLoginNonce,
  loadGoogleIdentity,
  refreshConsoleIdentity,
  verifyConsoleGoogleCredential,
  type ConsoleIdentity,
} from './client';

export function GooglePortalLogin({
  clientId,
  apiBaseUrl = '',
  portal,
  onAuthenticated,
  embedded = false,
}: {
  clientId: string;
  apiBaseUrl?: string;
  portal: 'business' | 'admin';
  onAuthenticated?: (identity: ConsoleIdentity, credential: string) => void;
  embedded?: boolean;
}) {
  const button = useRef<HTMLDivElement>(null);
  const token = useRef('');
  const [identity, setIdentity] = useState<ConsoleIdentity>();
  const [organizationId, setOrganizationId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!identity) return;
    const timer = window.setTimeout(
      () => {
        token.current = '';
        setIdentity(undefined);
        setOrganizationId('');
        setError('Your Google sign-in has expired. Sign in again.');
      },
      Math.max(0, Date.parse(identity.expiresAt) - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [identity]);

  useEffect(() => {
    if (identity || !clientId) return;
    let active = true;
    let submitting = false;
    const abort = new AbortController();
    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(32)), (value) =>
      value.toString(16).padStart(2, '0'),
    ).join('');
    void loadGoogleIdentity()
      .then((sdk) => {
        if (!active || !button.current) return;
        sdk.initialize({
          client_id: clientId,
          nonce,
          auto_select: false,
          callback: (response) => {
            if (!active || submitting) return;
            submitting = true;
            setBusy(true);
            setError('');
            void (async () => {
              try {
                assertLoginNonce(response.credential, nonce);
                const result = await verifyConsoleGoogleCredential(
                  apiBaseUrl,
                  response.credential,
                  AbortSignal.any([abort.signal, AbortSignal.timeout(30_000)]),
                );
                if (!active) return;
                if (onAuthenticated) {
                  onAuthenticated(result, response.credential);
                  return;
                }
                token.current = response.credential;
                setIdentity(result);
                setOrganizationId(
                  result.organizations.length === 1 ? result.organizations[0].organizationId : '',
                );
              } catch (cause) {
                if (active)
                  setError(cause instanceof Error ? cause.message : 'Sign-in failed. Try again.');
              } finally {
                if (active) {
                  submitting = false;
                  setBusy(false);
                }
              }
            })();
          },
        });
        button.current.replaceChildren();
        sdk.renderButton(button.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: Math.max(200, Math.min(300, button.current.clientWidth)),
        });
      })
      .catch((cause) => {
        if (active)
          setError(cause instanceof Error ? cause.message : 'Google sign-in could not load.');
      });
    return () => {
      active = false;
      abort.abort();
    };
  }, [clientId, apiBaseUrl, identity, retry, onAuthenticated]);

  const selected = identity?.organizations.find((org) => org.organizationId === organizationId);
  const adminDenied = portal === 'admin' && identity?.user.systemRole !== 'SYSTEM_ADMIN';
  async function refresh() {
    setBusy(true);
    setError('');
    try {
      const result = await refreshConsoleIdentity(
        apiBaseUrl,
        token.current,
        AbortSignal.timeout(30_000),
      );
      setIdentity(result);
      setOrganizationId((current) =>
        result.organizations.some((org) => org.organizationId === current) ? current : '',
      );
    } catch (cause) {
      token.current = '';
      setIdentity(undefined);
      setError(cause instanceof Error ? cause.message : 'Sign in again.');
    } finally {
      setBusy(false);
    }
  }
  function clear() {
    token.current = '';
    setIdentity(undefined);
    setOrganizationId('');
    setError('');
    void loadGoogleIdentity()
      .then((sdk) => sdk.disableAutoSelect())
      .catch(() => {});
  }

  return (
    <div
      className={
        embedded ? 'w-full' : 'min-h-screen bg-base-200 flex items-center justify-center p-4 sm:p-6'
      }
    >
      <section
        className={
          embedded
            ? 'w-full'
            : 'w-full max-w-xl rounded-box bg-base-100 border border-base-300 p-6 sm:p-8 shadow-sm'
        }
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          OctaP · {portal === 'admin' ? 'Platform administration' : 'Business portal'}
        </p>
        <h1 className="text-3xl font-bold mt-3">
          {identity ? 'Your OctaP account' : 'Sign in with Google'}
        </h1>
        {!identity ? (
          <>
            <p className="text-sm opacity-70 mt-4 mb-6">
              Use your Google account. Your organization and permissions are provided by OctaP Core.
            </p>
            {!clientId ? (
              <p role="alert" className="alert alert-warning">
                Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID for this portal.
              </p>
            ) : (
              <div
                ref={button}
                aria-label="Sign in with Google"
                className={busy ? 'pointer-events-none opacity-50' : ''}
              />
            )}
          </>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            <div>
              <p className="font-semibold">{identity.user.fullName}</p>
              <p className="text-sm opacity-70">{identity.user.email}</p>
            </div>
            <p className="text-sm">
              Platform role:{' '}
              <strong>
                {identity.user.systemRole === 'SYSTEM_ADMIN' ? 'System Admin' : 'System User'}
              </strong>
            </p>
            {adminDenied ? (
              <p role="alert" className="alert alert-warning">
                This account is not a System Admin. Platform access must be assigned by an
                authorized administrator.
              </p>
            ) : portal === 'admin' ? (
              <p role="status" className="alert alert-success">
                Your System Admin access is verified.
              </p>
            ) : (
              <>
                {identity.organizations.length === 0 ? (
                  <p role="status" className="alert alert-info">
                    Your account is verified but has no active organization access. Ask a Business
                    Owner for an invitation.
                  </p>
                ) : (
                  <>
                    <label className="flex flex-col gap-2 text-sm font-medium">
                      Organization
                      <select
                        className="select select-bordered w-full"
                        value={organizationId}
                        onChange={(event) => setOrganizationId(event.target.value)}
                        disabled={busy}
                      >
                        <option value="">Select an organization</option>
                        {identity.organizations.map((org) => (
                          <option key={org.organizationId} value={org.organizationId}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    {selected && (
                      <p role="status" className="alert alert-success">
                        {selected.name}:{' '}
                        {selected.persona === 'BUSINESS_OWNER'
                          ? 'Business Owner'
                          : 'Business Developer'}
                      </p>
                    )}
                  </>
                )}
              </>
            )}
            <div className="flex gap-3 flex-wrap">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => void refresh()}
                disabled={busy}
              >
                Refresh access
              </button>
              <button className="btn btn-ghost btn-sm" onClick={clear} disabled={busy}>
                Use another account
              </button>
            </div>
          </div>
        )}
        {busy && (
          <p role="status" className="mt-5 text-sm">
            Verifying with Core…
          </p>
        )}
        {error && (
          <div className="alert alert-error mt-5" role="alert">
            {error}
          </div>
        )}
        {!identity && error && (
          <button
            className="btn btn-ghost btn-sm mt-3"
            disabled={busy}
            onClick={() => {
              setError('');
              setRetry((value) => value + 1);
            }}
          >
            Retry Google sign-in
          </button>
        )}
      </section>
    </div>
  );
}
