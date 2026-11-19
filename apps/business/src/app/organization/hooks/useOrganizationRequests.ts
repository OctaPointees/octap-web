import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@octap/shared/authentication';

/** Prefix of the organization-requests query key: invalidate it after submitting a request. */
export const organizationRequestsKey = ['console', 'organization-requests'] as const;

/**
 * The signed-in user's own organization requests, cached by TanStack Query and shared by the
 * organization list and the create page. Keyed per user; signing out clears the cache.
 */
export function useOrganizationRequests() {
  const { identity, client } = useAuth();
  const userId = identity?.user.id;
  return useQuery({
    queryKey: [...organizationRequestsKey, userId],
    queryFn: ({ signal }) => client().listConsoleOrganizationRequests(signal),
    enabled: !!userId,
  });
}
