import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';

/** Router state that carries the invitation token from the login page to onboarding. */
export type InvitationState = { invitation: string };

/**
 * The one-time invitation token from an invitation link (`/?invitation=…`).
 *
 * The token is a credential, so it must not stay in the address bar, the browser history or a
 * later redirect. It is read from the URL on the first render, then the URL is replaced with one
 * without it, and the token moves into router state. That state survives the Google sign-in and
 * goes on to `/onboarding` with the redirect.
 *
 * Pass `redirecting: true` while the page is about to render a `<Navigate replace>` itself: that
 * already drops the URL, and a second navigation from here would race it.
 */
export function useInvitationToken({ redirecting = false }: { redirecting?: boolean } = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const fromUrl = new URLSearchParams(location.search).get('invitation');
  const state = location.state as Partial<InvitationState> | null;
  const fromState = typeof state?.invitation === 'string' ? state.invitation : '';

  useEffect(() => {
    if (fromUrl === null || redirecting) return;
    const search = new URLSearchParams(location.search);
    search.delete('invitation');
    const query = search.toString();
    navigate(
      { pathname: location.pathname, search: query ? `?${query}` : '', hash: location.hash },
      { replace: true, state: { ...state, invitation: fromUrl } satisfies InvitationState },
    );
  }, [fromUrl, redirecting, location.pathname, location.search, location.hash, state, navigate]);

  return fromUrl ?? fromState;
}
