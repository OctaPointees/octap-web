'use client';

import { useEffect, useRef, useState } from 'react';
import { loadGoogleIdentity } from '../services/google-identity';
import {
  prepareZkLogin,
  assertLoginNonce,
  completeZkLogin,
  type CustomerSigningSession,
} from '../services/zklogin';
import CustomerPoints from './CustomerPoints';
import CustomerRewards from './CustomerRewards';

interface Identity {
  endUserId: string;
  suiAddress: string;
}

async function identityRequest<T>(action: string, body: object): Promise<T> {
  const response = await fetch(`/api/identity/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(35_000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Please try again.');
  return data as T;
}

export default function CustomerJoin({
  storeName,
  showPoints = false,
}: {
  storeName: string;
  showPoints?: boolean;
}) {
  const button = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const signingSession = useRef<CustomerSigningSession | null>(null);
  const [loginAttempt, setLoginAttempt] = useState(0);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [memberId, setMemberId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [pointsVersion, setPointsVersion] = useState(0);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    let active = true;
    if (!clientId) return;
    void Promise.all([loadGoogleIdentity(), prepareZkLogin()])
      .then(([google, session]) => {
        if (!active || !button.current) return;
        google.initialize({
          client_id: clientId,
          auto_select: false,
          nonce: session.nonce,
          callback: ({ credential }) => {
            if (!active || inFlight.current) return;
            try {
              assertLoginNonce(credential, session.nonce, session.estimatedExpiration);
            } catch (reason) {
              setError(
                reason instanceof Error
                  ? reason.message
                  : 'Sign-in expired. Refresh and try again.',
              );
              return;
            }
            inFlight.current = true;
            setBusy(true);
            setError('');
            void identityRequest<Identity>('login', { idToken: credential })
              .then(async (customer) => {
                const signer = showPoints
                  ? await completeZkLogin(session, credential, customer.suiAddress)
                  : null;
                if (active) {
                  signingSession.current = signer;
                  setIdentity(customer);
                  setMemberId('');
                  setCopied(false);
                }
              })
              .catch((reason: unknown) => {
                signingSession.current = null;
                if (active)
                  setError(
                    reason instanceof Error ? reason.message : 'Sign-in failed. Please try again.',
                  );
              })
              .finally(() => {
                inFlight.current = false;
                if (active) setBusy(false);
              });
          },
        });
        google.renderButton(button.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
        });
      })
      .catch((reason: unknown) => {
        if (active)
          setError(reason instanceof Error ? reason.message : 'Google sign-in is unavailable.');
      });
    return () => {
      active = false;
      signingSession.current = null;
    };
  }, [clientId, showPoints, loginAttempt]);

  async function enroll() {
    if (!identity || busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await identityRequest<{ organizationEndUserId: string }>('enroll', {
        endUserId: identity.endUserId,
      });
      setMemberId(result.organizationEndUserId);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not join the store. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(memberId);
      setCopied(true);
    } catch {
      setError('Select and copy the member ID below; clipboard access is unavailable.');
    }
  }

  return (
    <section
      id="membership"
      className="rounded-3xl border border-line bg-surface p-7 sm:p-9 shadow-sm w-full max-w-lg justify-self-center scroll-mt-6"
      aria-labelledby="join-title"
    >
      <p className="text-partner text-xs font-bold tracking-widest uppercase">
        Your coffee. Your rewards.
      </p>
      <h2 id="join-title" className="font-head font-bold tracking-tight text-3xl mt-3">
        {memberId ? 'Welcome to your coffee break.' : 'More perks in every cup.'}
      </h2>
      <p className="text-muted mt-4 leading-relaxed">
        {memberId
          ? `Your membership at ${storeName} is ready. Show your member ID at checkout.`
          : `Join the ${storeName} rewards demo. Sign in, collect points, and treat yourself to something good.`}
      </p>
      {!clientId && (
        <p role="alert" className="mt-6 text-danger">
          Google sign-in is not configured for this portal.
        </p>
      )}
      <div ref={button} className={identity || busy ? 'hidden' : 'mt-8'} />
      <div aria-live="polite" className="mt-6 space-y-5">
        {busy && (
          <p className="text-muted">
            {identity ? 'Creating your membership…' : 'Connecting your account…'}
          </p>
        )}
        {error && (
          <p role="alert" className="text-danger break-words">
            {error}
          </p>
        )}
        {identity && (
          <>
            <p className="text-success text-sm font-semibold">✓ Google account connected</p>
            {!memberId && (
              <button
                className="rounded-full bg-partner text-white w-full px-6 py-4 font-semibold"
                disabled={busy}
                onClick={() => void enroll()}
              >
                Join coffee rewards
              </button>
            )}
            {memberId && (
              <div className="rounded-2xl bg-partner-soft p-5 space-y-3">
                <p className="text-sm font-semibold">Your member ID</p>
                <p className="font-mono text-sm break-all select-all">{memberId}</p>
                <button className="text-partner font-semibold text-sm" onClick={() => void copy()}>
                  {copied ? 'Copied' : 'Copy member ID'}
                </button>
              </div>
            )}
            {memberId && showPoints && (
              <>
                <CustomerPoints key={pointsVersion} />
                <CustomerRewards onClaim={() => setPointsVersion((value) => value + 1)} />
              </>
            )}
            <details className="text-sm">
              <summary className="cursor-pointer text-muted">
                Your connected rewards address
              </summary>
              <p className="font-mono break-all mt-3">{identity.suiAddress}</p>
            </details>
            <button
              className="text-partner text-sm font-semibold"
              disabled={busy}
              onClick={async () => {
                if (showPoints) {
                  try {
                    const response = await fetch('/api/customer/balance', { method: 'DELETE' });
                    if (!response.ok) throw new Error('Could not sign out. Please try again.');
                  } catch {
                    setError('Could not sign out. Please try again.');
                    return;
                  }
                }
                signingSession.current = null;
                window.google?.accounts.id.disableAutoSelect();
                setLoginAttempt((value) => value + 1);
                setIdentity(null);
                setMemberId('');
                setError('');
                setCopied(false);
              }}
            >
              Use another account
            </button>
          </>
        )}
      </div>
      <p className="mt-8 pt-6 border-t border-line text-xs text-muted leading-relaxed">
        Your membership belongs to {storeName}. This preview uses Sui testnet; no purchase or
        payment is made here. This is an unofficial brand concept.
      </p>
    </section>
  );
}
