import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createCoreClient, type ConsoleIdentity } from '../lib/core';
import { createTokenHolder } from '../lib/token';
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
  // The Google ID token, in memory only. Created once; the SDK client reads it per request.
  const [token] = useState(createTokenHolder);
  const [identity, setIdentity] = useState<ConsoleIdentity>();
  const [error, setError] = useState('');
  const [resuming, setResuming] = useState(() => !!clientId && resumeFlag.get(portal));
  const resumeAttempt = useRef<ReturnType<typeof silentGoogleSignIn>>(undefined);
  const sessionEnd = useRef(onSessionEnd);
  useEffect(() => {
    sessionEnd.current = onSessionEnd;
  });

  // Ends the session without asking: the token expired, or Core stopped accepting it.
  const expire = useCallback(() => {
    if (!token.get()) return;
    token.clear();
    setIdentity(undefined);
    setError('Your Google sign-in has expired. Sign in again.');
    sessionEnd.current?.('expired');
  }, [token]);

  // One client for the whole session. It reads the token for every request, so it never needs
  // rebuilding when the user signs in or out.
  const api = useMemo(
    () =>
      createCoreClient({
        apiBaseUrl,
        getAccessToken: token.get,
        onUnauthorized: token.unauthorized,
      }),
    [apiBaseUrl, token],
  );
  useEffect(() => token.onUnauthorized(expire), [token, expire]);

  const signIn = useCallback(
    (next: ConsoleIdentity, credential: string) => {
      token.set(credential);
      resumeFlag.set(portal);
      setIdentity(next);
      setError('');
    },
    [portal, token],
  );

  const signOut = useCallback(() => {
    resumeFlag.clear(portal);
    disableGoogleAutoSelect();
    token.clear();
    setIdentity(undefined);
    setError('');
    sessionEnd.current?.('sign-out');
  }, [portal, token]);

  const refresh = useCallback(async () => {
    const next = await fetchIdentity(api);
    setIdentity(next);
    return next;
  }, [api]);

  // On load after an earlier sign-in, ask Google for a fresh token instead of the login form.
  // The attempt lives in a ref so StrictMode's double effect does not prompt Google twice.
  useEffect(() => {
    if (!resuming) return;
    let active = true;
    resumeAttempt.current ??= silentGoogleSignIn({ clientId, api });
    void resumeAttempt.current.result.then((result) => {
      if (!active) return;
      resumeAttempt.current = undefined;
      if (result) {
        token.set(result.credential);
        setIdentity(result.identity);
      } else resumeFlag.clear(portal);
      setResuming(false);
    });
    return () => {
      active = false;
    };
  }, [resuming, clientId, api, portal, token]);

  const cancelResume = useCallback(() => resumeAttempt.current?.cancel(), []);

  // Google ID tokens are short-lived: sign out when Core says this one expires.
  useEffect(() => {
    if (!identity) return;
    const timer = window.setTimeout(
      expire,
      Math.max(0, Date.parse(identity.expiresAt) - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [identity, expire]);

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
      api,
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
      api,
    ],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
