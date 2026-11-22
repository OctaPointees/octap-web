import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@octap/shared/authentication';

/** Prefix of the platform organization-requests query key. */
export const platformRequestsKey = ['platform', 'organization-requests'] as const;

/** Every organization request on the platform (Core returns the latest 100). System Admins only. */
export function usePlatformOrganizationRequests() {
  const { identity, client } = useAuth();
  const admin = identity?.user.systemRole === 'SYSTEM_ADMIN';
  return useQuery({
    queryKey: [...platformRequestsKey, identity?.user.id],
    queryFn: ({ signal }) => client().listPlatformOrganizationRequests(signal),
    enabled: admin,
  });
}

/** Approves or rejects a request, then reloads the list. */
export function useDecideOrganizationRequest() {
  const { client } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      decision,
      reason,
    }: {
      id: string;
      decision: 'approve' | 'reject';
      reason?: string;
    }) => client().decidePlatformOrganizationRequest(id, decision, reason),
    onSettled: () => queryClient.invalidateQueries({ queryKey: platformRequestsKey }),
  });
}
