import { useMutation } from '@tanstack/react-query';
import { unwrap, useAuth } from '@octap/shared/authentication';

/**
 * Accepts an invitation, then reads the identity again so the new organization is available. The
 * invitation is already used by then, so a failed re-read still counts as accepted. The token is
 * a credential, so the mutation isn't kept in the cache afterwards.
 */
export function useAcceptInvitation() {
  const { api, refresh } = useAuth();
  return useMutation({
    meta: { invalidates: [] },
    gcTime: 0,
    mutationFn: async (token: string) => {
      const { organizationId } = await unwrap(api.console.accept({ token }));
      const identity = await refresh().catch(() => null);
      return (
        identity?.organizations.find((value) => value.organizationId === organizationId) ?? null
      );
    },
  });
}
