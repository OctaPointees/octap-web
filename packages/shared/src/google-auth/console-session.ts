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
  type ConsoleCredential,
  type OrganizationApplication,
} from './portal-api';

interface Data {
  organization?: ConsoleOrganization;
  staff?: ConsoleStaff[];
  invitations?: ConsoleInvitation[];
  credentials?: ConsoleCredential[];
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
  const [entrySlug] = useState(() =>
    import.meta.env.VITE_ENABLE_ORG_SLUG_ENTRY === 'true'
      ? (/^\/orgs\/([a-z0-9-]+)$/.exec(location.pathname)?.[1] ?? '')
      : '',
  );
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
      setIdentity(result);
      setError('');
      const only = result.organizations.length === 1 ? result.organizations[0] : undefined;
      setOrganizationId(only?.organizationId ?? '');
      navigate(
        portal === 'admin'
          ? '/admin'
          : entrySlug
            ? `/orgs/${entrySlug}`
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
    [invitation, entrySlug, navigate, portal],
  );

  function signOut() {
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
        } else if (location.pathname === '/onboarding') {
          next.applications = await client.listConsoleOrganizationRequests(signal);
        } else if (selected) {
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
          if (location.pathname === '/developer/api-keys')
            next.credentials = await client.listConsoleCredentials(selected.organizationId, signal);
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
    entrySlug,
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
