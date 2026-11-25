import { useQuery } from '@tanstack/react-query';
import { OctapError } from '@octap/internal-sdk';
import { unwrap, useAuth } from '@octap/shared/authentication';
import { memberKeys } from '@/app/members/hooks/useMembers';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { webhookKeys } from '@/app/webhooks/hooks/useWebhooks';
import { countMember, emptyMemberStats, type WebhookDelivery } from '../domain/insights';

/** Core returns at most 100 members a page, so this reads up to 1,000. */
const MEMBER_PAGE_SIZE = 100;
const MEMBER_PAGES = 10;
export const MEMBER_SAMPLE = MEMBER_PAGE_SIZE * MEMBER_PAGES;

const dashboardKeys = {
  budget: (organizationId: string) =>
    ['console', 'organization', organizationId, 'budget'] as const,
};

/** The points budget. Core reads it from the chain, so it is kept for a minute between reads. */
export function useIssuanceBudget() {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  return useQuery({
    queryKey: dashboardKeys.budget(organizationId),
    queryFn: () => unwrap(api.console.readIssuanceBudget({ organizationId })),
    staleTime: 60_000,
  });
}

/** Core answers 404 until a System Admin has provisioned the organization's program. */
export const isNoProgram = (error: unknown) => error instanceof OctapError && error.status === 404;

/**
 * Member statistics. Core has no count or statistics route, so this walks the member list one page
 * at a time, up to a limit, and keeps only the totals. Core orders the list by random ID, so when
 * the limit is reached the members read are a fair sample rather than the oldest or newest.
 */
export function useMemberStats() {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  return useQuery({
    queryKey: memberKeys.stats(organizationId),
    queryFn: async ({ signal }) => {
      const now = new Date();
      const stats = emptyMemberStats(now);
      let cursor: string | undefined;
      for (let page = 0; page < MEMBER_PAGES; page += 1) {
        signal.throwIfAborted();
        const { items, nextCursor } = await unwrap(
          api.console.listMembers({ organizationId, limit: MEMBER_PAGE_SIZE, cursor }),
        );
        for (const member of items) countMember(stats, member, now);
        cursor = nextCursor ?? undefined;
        if (!cursor) return stats;
      }
      return { ...stats, capped: true };
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Webhook endpoints and the latest deliveries. Core lets only the Owner read them, so nothing is
 * requested for anyone else. A delivery carries its event's payload, which the dashboard doesn't
 * need, so it is dropped before it reaches the cache.
 */
export function useWebhookHealth() {
  const { api } = useAuth();
  const { organizationId, owner } = useOrganization();
  const endpoints = useQuery({
    queryKey: webhookKeys.endpoints(organizationId),
    queryFn: () => unwrap(api.console.listEndpoints({ organizationId })),
    enabled: owner,
  });
  const deliveries = useQuery({
    queryKey: webhookKeys.deliveries(organizationId),
    queryFn: async (): Promise<WebhookDelivery[]> =>
      (await unwrap(api.console.listDeliveries({ organizationId }))).map((delivery) => ({
        id: delivery.id,
        status: delivery.status,
        eventType: delivery.eventType,
        attemptCount: delivery.attemptCount,
        lastResponseStatus: delivery.lastResponseStatus,
        lastError: delivery.lastError,
        updatedAt: delivery.updatedAt,
      })),
    enabled: owner,
  });
  return { endpoints, deliveries };
}
