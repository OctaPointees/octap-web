import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createConsoleClient, type ConsoleIdentity } from '../../console-api/client';
import { disableGoogleAutoSelect, silentGoogleSignIn } from '../lib/google';
import { fetchIdentity } from '../lib/identity';
import { resumeFlag } from '../lib/resume';
import { AuthContext, type AuthSession, type Portal } from './AuthContext';

export interface AuthProviderProps {
  portal: Portal;
  clientId: string;
  apiBaseUrl?: string;
  /**
   * Runs when the session ends: an explicit sign-out or an expired credential. Clear anything
   * cached for the previous user here, such as the query cache.
   */
  onSessionEnd?: (reason: 'sign-out' | 'expired') => void;
  children: ReactNode;
}

/** Holds the signed-in identity and its Google ID token for everything below it. */
export function AuthProvider({
  portal,
  clientId,
  apiBaseUrl = '',
  onSessionEnd,
  children,
}: AuthProviderProps) {
  const credential = useRef('');
  const [identity, setIdentity] = useState<ConsoleIdentity>();
  const [error, setError] = useState('');
  const [resuming, setResuming] = useState(() => !!clientId && resumeFlag.get(portal));
  const resumeAttempt = useRef<ReturnType<typeof silentGoogleSignIn>>(undefined);
  const sessionEnd = useRef(onSessionEnd);
  useEffect(() => {
    sessionEnd.current = onSessionEnd;
  });

  const client = useCallback(
    () => createConsoleClient({ apiBaseUrl, getAuthToken: () => credential.current }),
    [apiBaseUrl],
  );

  const signIn = useCallback(
    (next: ConsoleIdentity, token: string) => {
      credential.current = token;
      resumeFlag.set(portal);
      setIdentity(next);
      setError('');
    },
    [portal],
  );

  const signOut = useCallback(() => {
    resumeFlag.clear(portal);
    disableGoogleAutoSelect();
    credential.current = '';
    setIdentity(undefined);
    setError('');
    sessionEnd.current?.('sign-out');
  }, [portal]);

  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      const next = await fetchIdentity(client(), signal);
      setIdentity(next);
      return next;
    },
    [client],
  );

  // On load after an earlier sign-in, ask Google for a fresh token instead of the login form.
  // The attempt lives in a ref so StrictMode's double effect does not prompt Google twice.
  useEffect(() => {
    if (!resuming) return;
    let active = true;
    resumeAttempt.current ??= silentGoogleSignIn({ clientId, apiBaseUrl });
    void resumeAttempt.current.result.then((result) => {
      if (!active) return;
      resumeAttempt.current = undefined;
      if (result) {
        credential.current = result.credential;
        setIdentity(result.identity);
      } else resumeFlag.clear(portal);
      setResuming(false);
    });
    return () => {
      active = false;
    };
  }, [resuming, clientId, apiBaseUrl, portal]);

  const cancelResume = useCallback(() => resumeAttempt.current?.cancel(), []);

  // Google ID tokens are short-lived: sign out when Core says this one expires.
  useEffect(() => {
    if (!identity) return;
    const timer = window.setTimeout(
      () => {
        credential.current = '';
        setIdentity(undefined);
        setError('Your Google sign-in has expired. Sign in again.');
        sessionEnd.current?.('expired');
      },
      Math.max(0, Date.parse(identity.expiresAt) - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [identity]);

  const value = useMemo<AuthSession>(
    () => ({
      portal,
      clientId,
      apiBaseUrl,
      identity,
      resuming,
      error,
      signIn,
      signOut,
      cancelResume,
      refresh,
      client,
    }),
    [
      portal,
      clientId,
      apiBaseUrl,
      identity,
      resuming,
      error,
      signIn,
      signOut,
      cancelResume,
      refresh,
      client,
    ],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
