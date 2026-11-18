import { useQuery } from '@tanstack/react-query';
import { useConsoleAuth } from './console-session';

/** Prefix of the organization-requests query key: invalidate it after submitting a request. */
export const organizationRequestsKey = ['console', 'organization-requests'] as const;

/**
 * The signed-in user's own organization requests, cached by TanStack Query and shared by the
 * organization list and the create page. Keyed per user; signing out clears the cache.
 */
export function useOrganizationRequests() {
  const auth = useConsoleAuth();
  const userId = auth?.identity?.user.id;
  return useQuery({
    queryKey: [...organizationRequestsKey, userId],
    queryFn: ({ signal }) => auth!.client().listConsoleOrganizationRequests(signal),
    enabled: !!userId,
  });
}
