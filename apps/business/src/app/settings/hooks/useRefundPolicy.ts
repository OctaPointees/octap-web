import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unwrap, useAuth } from '@octap/shared/authentication';
import { notify } from '@octap/shared/components';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import type { RefundRules } from '../domain/refundPolicy';

const HISTORY_PAGE_SIZE = 10;

export const refundPolicyKeys = {
  all: (organizationId: string) =>
    ['console', 'organization', organizationId, 'refund-policy'] as const,
  current: (organizationId: string) =>
    [...refundPolicyKeys.all(organizationId), 'current'] as const,
  history: (organizationId: string) =>
    [...refundPolicyKeys.all(organizationId), 'history'] as const,
};

/** Another Owner published first. The form reloads their version instead of replacing it. */
class StaleRefundPolicyError extends Error {}

/** The current policy. Core lets only the Owner read it, so nobody else asks. */
export function useRefundPolicy() {
  const { api } = useAuth();
  const { organizationId, owner } = useOrganization();
  return useQuery({
    queryKey: refundPolicyKeys.current(organizationId),
    queryFn: () => unwrap(api.console.current({ organizationId })),
    enabled: owner,
  });
}

/** Published versions, newest first, a page at a time. Loads once `enabled`. */
export function useRefundPolicyHistory(enabled: boolean) {
  const { api } = useAuth();
  const { organizationId, owner } = useOrganization();
  return useInfiniteQuery({
    queryKey: refundPolicyKeys.history(organizationId),
    queryFn: ({ pageParam }) =>
      unwrap(
        api.console.history({
          organizationId,
          limit: HISTORY_PAGE_SIZE,
          beforeVersion: pageParam,
        }),
      ),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page) =>
      page.length < HISTORY_PAGE_SIZE ? undefined : page[page.length - 1].version,
    enabled: enabled && owner,
  });
}

/**
 * Publishes the next version. Core's PUT has no version check, so this reads the current version
 * first and stops if it moved since the form loaded, rather than overwrite another Owner's change.
 */
export function usePublishRefundPolicy() {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  const cache = useQueryClient();
  return useMutation({
    meta: { invalidates: [] },
    mutationFn: async ({
      baseVersion,
      rules,
      reason,
    }: {
      baseVersion: number;
      rules: RefundRules;
      reason: string;
    }) => {
      const latest = await unwrap(api.console.current({ organizationId }));
      if (latest.version !== baseVersion) {
        cache.setQueryData(refundPolicyKeys.current(organizationId), latest);
        void cache.invalidateQueries({ queryKey: refundPolicyKeys.history(organizationId) });
        throw new StaleRefundPolicyError();
      }
      return unwrap(api.console.publish({ organizationId, body: { ...rules, reason } }));
    },
    onSuccess: (published) => {
      cache.setQueryData(refundPolicyKeys.current(organizationId), published);
      void cache.invalidateQueries({ queryKey: refundPolicyKeys.history(organizationId) });
      notify.success(
        'Refund policy published',
        `Version ${published.version} applies to vouchers activated from now on.`,
      );
    },
    onError: (cause) => {
      if (!(cause instanceof StaleRefundPolicyError))
        notify.error(cause, 'Could not publish the refund policy');
    },
  });
}
