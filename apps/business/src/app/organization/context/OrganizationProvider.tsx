import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '@octap/shared/authentication';
import { notify } from '@octap/shared/components';
import {
  OrganizationContext,
  dashboardPath,
  type OrganizationData,
  type OrganizationSession,
} from './OrganizationContext';

/** The tab's selected organization survives a reload; a new tab starts without one. */
const savedKey = 'octap.console.business.organization';
const saved = {
  get: () => {
    try {
      return sessionStorage.getItem(savedKey) ?? '';
    } catch {
      return '';
    }
  },
  set: (id: string) => {
    try {
      if (id) sessionStorage.setItem(savedKey, id);
      else sessionStorage.removeItem(savedKey);
    } catch {
      /* Storage can be unavailable (private mode, blocked site data). */
    }
  },
};

const message = (error: unknown) =>
  error instanceof Error ? error.message : 'The request could not be completed.';

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { identity, resuming, client, refresh } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [chosenId, setChosenId] = useState(saved.get);
  const [data, setData] = useState<OrganizationData>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  const [invitation, setInvitation] = useState(
    () => new URLSearchParams(location.search).get('invitation') ?? '',
  );
  const [inviteLink, setInviteLink] = useState('');

  // The chosen organization while it is still in the identity, otherwise the only one.
  const organizations = identity?.organizations;
  const selected =
    organizations?.find((org) => org.organizationId === chosenId) ??
    (organizations?.length === 1 ? organizations[0] : undefined);
  const organizationId = selected?.organizationId ?? '';
  const owner =
    (data.organization?.id === organizationId ? data.organization?.persona : selected?.persona) ===
    'BUSINESS_OWNER';

  useEffect(() => {
    if (new URLSearchParams(location.search).has('invitation'))
      navigate(location.pathname, { replace: true });
  }, [location.pathname, location.search, navigate]);

  // Forget the selection once nobody is signed in.
  const signedOut = !identity && !resuming;
  const [wasSignedOut, setWasSignedOut] = useState(signedOut);
  if (signedOut !== wasSignedOut) {
    setWasSignedOut(signedOut);
    if (signedOut) {
      setChosenId('');
      setData({});
      setInviteLink('');
    }
  }

  // Remember the selection for reloads.
  useEffect(() => {
    if (identity) saved.set(organizationId);
    else if (!resuming) saved.set('');
  }, [identity, resuming, organizationId]);

  // Load what the current page needs for the selected organization.
  useEffect(() => {
    if (!identity) return;
    const abort = new AbortController();
    const signal = AbortSignal.any([abort.signal, AbortSignal.timeout(30_000)]);
    let active = true;
    void (async () => {
      // Keep the organization during same-tenant navigation.
      setData((current) =>
        current.organization?.id === organizationId ? { organization: current.organization } : {},
      );
      setLoading(true);
      setError('');
      try {
        const next: OrganizationData = {};
        // The organization list reads requests through useOrganizationRequests().
        if (
          organizationId &&
          location.pathname !== '/organizations' &&
          location.pathname !== '/onboarding'
        ) {
          next.organization = await client().getConsoleOrganization(organizationId, signal);
          if (
            location.pathname === '/merchant/team' &&
            next.organization.persona === 'BUSINESS_OWNER'
          ) {
            [next.staff, next.invitations] = await Promise.all([
              client().listConsoleStaff(organizationId, signal),
              client().listConsoleInvitations(organizationId, signal),
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
  }, [identity, organizationId, location.pathname, revision, client, navigate]);

  const reset = useCallback(
    (id: string) => {
      queryClient.clear();
      setData({});
      setChosenId(id);
      setInviteLink('');
    },
    [queryClient],
  );

  const choose = useCallback(
    (id: string) => {
      const org = identity?.organizations.find((value) => value.organizationId === id);
      if (!org) return;
      reset(id);
      navigate(dashboardPath(org));
    },
    [identity, reset, navigate],
  );

  const perform = useCallback<OrganizationSession['perform']>(
    async (action, success, after) => {
      setBusy(true);
      try {
        await action(client());
        const current = await refresh();
        setRevision((value) => value + 1);
        if (success) notify.success(success);
        if (after) after(current);
        else if (
          organizationId &&
          !current.organizations.some((org) => org.organizationId === organizationId)
        ) {
          setChosenId('');
          navigate('/organizations');
        }
      } catch (cause) {
        notify.error(cause, 'That did not work');
      } finally {
        setBusy(false);
      }
    },
    [client, refresh, organizationId, navigate],
  );

  const value = useMemo<OrganizationSession>(
    () => ({
      selected,
      organizationId,
      owner,
      data,
      error,
      busy,
      loading,
      revision,
      invitation,
      setInvitation,
      inviteLink,
      setInviteLink,
      choose,
      setOrganizationId: reset,
      perform,
      fields: (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        return new FormData(event.currentTarget);
      },
    }),
    [
      selected,
      organizationId,
      owner,
      data,
      error,
      busy,
      loading,
      revision,
      invitation,
      inviteLink,
      choose,
      reset,
      perform,
    ],
  );
  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}
