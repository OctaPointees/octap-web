import { useEffect, useRef, useState } from 'react';
import {
  assertLoginNonce,
  loadGoogleIdentity,
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
  onAuthenticated: (identity: ConsoleIdentity, credential: string) => void;
  embedded?: boolean;
}) {
  const button = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!clientId) return;
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
                onAuthenticated(result, response.credential);
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
  }, [clientId, apiBaseUrl, retry, onAuthenticated]);

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
        <h1 className="text-3xl font-bold mt-3">Sign in with Google</h1>
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
        {error && (
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
