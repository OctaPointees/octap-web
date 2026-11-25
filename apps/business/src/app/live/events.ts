import type { QueryKey } from '@tanstack/react-query';
import { dashboardKeys } from '@/app/dashboard/hooks/useDashboardData';
import { memberKeys } from '@/app/members/hooks/useMembers';
import { batchKeys } from '@/app/rewards/hooks/useBatches';
import { rewardKeys } from '@/app/rewards/hooks/useRewards';
import { webhookKeys } from '@/app/webhooks/hooks/useWebhooks';

/**
 * What changed, as Core's console event stream reports it (`@octap/contracts`,
 * `OrganizationEventSubject`, OCT-326). Only IDs: the data itself is read again through the normal
 * routes and their access checks.
 */
export type EventSubject =
  | { kind: 'voucher'; id: string; batchId: string | null }
  | { kind: 'voucherOwnership'; id: string; voucherId: string; memberId: string }
  | { kind: 'loyaltyTransaction'; id: string; memberId: string }
  | { kind: 'issuanceBudget' };

/** One message of the stream: SSE `event` is `type`, SSE `id` is `sequence`, `data` is this. */
export interface OrganizationStreamEvent {
  id: string;
  sequence: number;
  type: string;
  subject: EventSubject;
  occurredAt: string;
}

/** Messages about the stream itself, sent as the SSE `event` with no `id`. */
export const STREAM_CONTROL = {
  /** Events since `Last-Event-ID` are gone (kept 30 days, at most 1000 back): reload everything. */
  reset: 'stream.reset',
  /** The Google ID token expired; the stream closes. The app signs out at that point anyway. */
  tokenExpired: 'stream.token_expired',
  /** No longer an active member of an active organization; the stream closes. Don't reconnect. */
  accessRevoked: 'stream.access_revoked',
} as const;

/** Reads a stream message's data, or `null` if it isn't one this app understands. */
export function readStreamEvent(data: string): OrganizationStreamEvent | null {
  try {
    const event = JSON.parse(data) as Partial<OrganizationStreamEvent>;
    const kind = event.subject?.kind;
    if (typeof event.id !== 'string' || typeof event.type !== 'string' || !kind) return null;
    if (!['voucher', 'voucherOwnership', 'loyaltyTransaction', 'issuanceBudget'].includes(kind))
      return null;
    return event as OrganizationStreamEvent;
  } catch {
    return null;
  }
}

/**
 * The cached data an event makes stale. Only queries on screen are fetched again; the rest are
 * marked stale and reload when next shown. Every event may also have queued a webhook delivery,
 * so the delivery list goes stale too.
 */
export function staleKeys(organizationId: string, subject: EventSubject): QueryKey[] {
  const deliveries = webhookKeys.deliveries(organizationId);
  switch (subject.kind) {
    case 'voucher':
      // The list feeds the Vouchers page, the dashboards and the sidebar badge.
      return [
        rewardKeys.list(organizationId),
        subject.batchId
          ? batchKeys.detail(organizationId, subject.batchId)
          : batchKeys.all(organizationId),
        // Batch lists count their vouchers by status.
        [...batchKeys.all(organizationId), 'list'],
        deliveries,
      ];
    case 'voucherOwnership':
      return [
        rewardKeys.list(organizationId),
        memberKeys.vouchers(organizationId, subject.memberId),
        memberKeys.detail(organizationId, subject.memberId),
        deliveries,
      ];
    case 'loyaltyTransaction':
      return [
        memberKeys.transactions(organizationId, subject.memberId),
        memberKeys.detail(organizationId, subject.memberId),
        [...memberKeys.all(organizationId), 'list'],
        memberKeys.stats(organizationId),
        dashboardKeys.budget(organizationId),
        deliveries,
      ];
    case 'issuanceBudget':
      return [dashboardKeys.budget(organizationId), deliveries];
  }
}
