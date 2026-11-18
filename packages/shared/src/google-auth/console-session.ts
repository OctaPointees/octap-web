import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  createConsoleClient,
  type ConsoleIdentity,
  type ConsoleOrganization,
  type ConsoleInvitation,
  type ConsoleStaff,
  type OrganizationApplication,
} from './portal-api';
import { disableGoogleAutoSelect, silentGoogleSignIn } from './client';

/**
 * Reload survival without storing credentials: a non-secret "signed in here before" flag
 * (localStorage, so new tabs try too) and the tab's selected organization (sessionStorage).
 * The Google ID token itself stays in memory; a reload asks Google for a fresh one.
 */
const resumeKeys = (portal: string) => ({
  flag: `octap.console.${portal}.signedIn`,
  organization: `octap.console.${portal}.organization`,
});
const stored = {
  get: (area: 'local' | 'session', key: string) => {
    try {
      return (area === 'local' ? localStorage : sessionStorage).getItem(key) ?? '';
    } catch {
      return '';
    }
  },
  set: (area: 'local' | 'session', key: string, value: string) => {
    try {
      (area === 'local' ? localStorage : sessionStorage).setItem(key, value);
    } catch {
      /* Storage can be unavailable (private mode, blocked site data): resume just won't happen. */
    }
  },
  remove: (area: 'local' | 'session', key: string) => {
    try {
      (area === 'local' ? localStorage : sessionStorage).removeItem(key);
    } catch {
      /* As above. */
    }
  },
};

interface Data {
  organization?: ConsoleOrganization;
  staff?: ConsoleStaff[];
  invitations?: ConsoleInvitation[];
  applications?: OrganizationApplication[];
}
const destination = (org: ConsoleIdentity['organizations'][number]) =>
  org.persona === 'BUSINESS_OWNER' ? '/merchant' : '/developer';
const message = (error: unknown) =>
  error instanceof Error ? error.message : 'The request could not be completed.';

export interface ConsoleSessionOptions {
  portal: 'business' | 'admin';
  clientId: string;
  apiBaseUrl?: string;
  onReset?: () => void;
}
export function useConsoleController({
  portal,
  clientId,
  apiBaseUrl = '',
  onReset,
}: ConsoleSessionOptions) {
  const location = useLocation();
  const navigate = useNavigate();
  const platformView = portal === 'admin' || location.pathname.startsWith('/admin');
  const [identity, setIdentity] = useState<ConsoleIdentity>();
  const credential = useRef('');
  const [organizationId, setOrganizationId] = useState('');
  const [data, setData] = useState<Data>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  const [invitation, setInvitation] = useState(
    () => new URLSearchParams(location.search).get('invitation') ?? '',
  );
  const [inviteLink, setInviteLink] = useState('');
  const keys = resumeKeys(portal);
  const [resuming, setResuming] = useState(
    () => !!clientId && stored.get('local', keys.flag) === '1',
  );
  const resumeAttempt = useRef<ReturnType<typeof silentGoogleSignIn>>(undefined);
  const forgetResume = useCallback(() => {
    stored.remove('local', keys.flag);
    stored.remove('session', keys.organization);
  }, [keys.flag, keys.organization]);
  const selected = identity?.organizations.find((org) => org.organizationId === organizationId);
  const owner =
    (data.organization?.id === selected?.organizationId
      ? data.organization?.persona
      : selected?.persona) === 'BUSINESS_OWNER';
  const api = useCallback(
    () => createConsoleClient({ apiBaseUrl, getAuthToken: () => credential.current }),
    [apiBaseUrl],
  );

  useEffect(() => {
    if (new URLSearchParams(location.search).has('invitation'))
      navigate(location.pathname, { replace: true });
  }, [location.pathname, location.search, navigate]);

  const signedIn = useCallback(
    (result: ConsoleIdentity, token: string) => {
      credential.current = token;
      stored.set('local', keys.flag, '1');
      setIdentity(result);
      setError('');
      const only = result.organizations.length === 1 ? result.organizations[0] : undefined;
      setOrganizationId(only?.organizationId ?? '');
      navigate(
        portal === 'admin'
          ? '/admin'
          : invitation
            ? '/onboarding'
            : only
              ? destination(only)
              : result.organizations.length
                ? '/organizations'
                : '/onboarding',
        { replace: true },
      );
    },
    [invitation, navigate, portal, keys.flag],
  );

  // On load after an earlier sign-in, ask Google for a fresh token instead of the login page.
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
        const saved = stored.get('session', keys.organization);
        const orgs = result.identity.organizations;
        // The reloaded URL stays: route guards send the user on if this organization is gone.
        setOrganizationId(
          orgs.some((org) => org.organizationId === saved)
            ? saved
            : orgs.length === 1
              ? orgs[0].organizationId
              : '',
        );
      } else forgetResume();
      setResuming(false);
    });
    return () => {
      active = false;
    };
  }, [resuming, clientId, apiBaseUrl, keys.organization, forgetResume]);

  useEffect(() => {
    if (identity && organizationId) stored.set('session', keys.organization, organizationId);
  }, [identity, organizationId, keys.organization]);

  function cancelResume() {
    resumeAttempt.current?.cancel();
  }

  function signOut() {
    forgetResume();
    disableGoogleAutoSelect();
    credential.current = '';
    setIdentity(undefined);
    setData({});
    setOrganizationId('');
    setError('');
    setNotice('');
    setInviteLink('');
    onReset?.();
    navigate('/login', { replace: true });
  }

  useEffect(() => {
    if (!identity) return;
    const timer = window.setTimeout(
      () => {
        credential.current = '';
        setIdentity(undefined);
        setData({});
        setOrganizationId('');
        setError('Your Google sign-in has expired. Sign in again.');
        onReset?.();
      },
      Math.max(0, Date.parse(identity.expiresAt) - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [identity, onReset]);

  useEffect(() => {
    if (!identity) return;
    const abort = new AbortController();
    const signal = AbortSignal.any([abort.signal, AbortSignal.timeout(30_000)]);
    let active = true;
    // Retain the authorized organization during same-tenant navigation.
    void (async () => {
      setData((current) =>
        current.organization?.id === selected?.organizationId
          ? { organization: current.organization }
          : {},
      );
      setLoading(true);
      setError('');
      try {
        const client = api();
        const next: Data = {};
        if (platformView) {
          if (identity.user.systemRole === 'SYSTEM_ADMIN')
            next.applications = await client.listPlatformOrganizationRequests(signal);
        } else if (location.pathname === '/organizations') {
          // Nothing to load: the list reads your requests through useOrganizationRequests().
        } else if (selected && location.pathname !== '/onboarding') {
          next.organization = await client.getConsoleOrganization(selected.organizationId, signal);
          if (
            location.pathname === '/merchant/team' &&
            next.organization.persona === 'BUSINESS_OWNER'
          ) {
            [next.staff, next.invitations] = await Promise.all([
              client.listConsoleStaff(selected.organizationId, signal),
              client.listConsoleInvitations(selected.organizationId, signal),
            ]);
          }
          if (
            next.organization.persona === 'BUSINESS_DEVELOPER' &&
            location.pathname.startsWith('/merchant')
          )
            navigate('/developer', { replace: true });
        }
        if (active) setData(next);
      } catch (cause) {
        if (active) {
          setData({});
          setError(message(cause));
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      abort.abort();
    };
  }, [identity, selected, location.pathname, platformView, revision, api, navigate]);

  async function perform(
    action: (client: ReturnType<typeof createConsoleClient>) => Promise<void>,
    success: string,
    after?: (current: ConsoleIdentity) => void,
  ) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action(api());
      const current = await api().getConsoleIdentity({ signal: AbortSignal.timeout(30_000) });
      setIdentity(current);
      setRevision((value) => value + 1);
      setNotice(success);
      if (after) after(current);
      else if (
        organizationId &&
        !current.organizations.some((org) => org.organizationId === organizationId)
      ) {
        setOrganizationId('');
        navigate('/organizations');
      }
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }
  function fields(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    return new FormData(event.currentTarget);
  }
  function choose(id: string) {
    const org = identity?.organizations.find((value) => value.organizationId === id);
    if (!org) return;
    onReset?.();
    setData({});
    setOrganizationId(id);
    setInviteLink('');
    navigate(destination(org));
  }
  async function skipSetup() {
    await perform(
      async () => {},
      '',
      (current) => {
        onReset?.();
        setData({});
        setInviteLink('');
        const only = current.organizations.length === 1 ? current.organizations[0] : undefined;
        setOrganizationId(only?.organizationId ?? '');
        navigate(
          only
            ? destination(only)
            : current.organizations.length
              ? '/organizations'
              : '/onboarding',
        );
      },
    );
  }

  return {
    client: api,
    identity,
    portal,
    clientId,
    apiBaseUrl,
    selected,
    owner,
    organizationId,
    setOrganizationId: (id: string) => {
      onReset?.();
      setData({});
      setOrganizationId(id);
    },
    data,
    error,
    notice,
    busy,
    loading,
    revision,
    invitation,
    setInvitation,
    inviteLink,
    setInviteLink,
    signedIn,
    signOut,
    resuming,
    cancelResume,
    perform,
    fields,
    choose,
    skipSetup,
    platformView,
  };
}
export const ConsoleSessionContext = createContext<ReturnType<typeof useConsoleController> | null>(
  null,
);
export function useConsoleAuth() {
  return useContext(ConsoleSessionContext);
}
