import { differenceInCalendarDays, format, subDays } from 'date-fns';
import type { ConsoleIssuanceBudgetReadResponse } from '@octap/internal-sdk';
import type { ConsoleCredential } from '@octap/services';
import { fmtNumber } from '@/utils/format';
import { isActiveKey } from '@/app/api-keys/domain/keys';
import type { MemberRow } from '@/app/members/hooks/useMembers';
import type { Reward } from '@/app/rewards/domain/draft';
import { STAGES, stageOf, type Stage } from '@/app/rewards/domain/stage';

const DAY_MS = 86_400_000;
/** How close a reward's closing date is before the dashboard mentions it. */
export const CLOSING_SOON_DAYS = 7;

/** One thing someone should look at, most urgent first. */
export interface AttentionItem {
  id: string;
  tone: 'error' | 'warning' | 'info';
  title: string;
  detail: string;
  /** Opens the Rewards page. Items without it have nowhere to go yet. */
  rewards?: boolean;
}

const rewardCount = (n: number) => `${fmtNumber(n)} reward${n === 1 ? '' : 's'}`;

/** The catalog at a glance. */
export function summarizeRewards(rewards: Reward[], now = Date.now()) {
  const stages = Object.fromEntries(Object.keys(STAGES).map((stage) => [stage, 0])) as Record<
    Stage,
    number
  >;
  for (const reward of rewards) stages[stageOf(reward, now)] += 1;

  const pipeline = [
    { label: 'Drafts', count: stages.draft + stages.failed, tone: 'bg-base-content/25' },
    { label: 'Awaiting approval', count: stages.pending_approval, tone: 'bg-warning' },
    { label: 'Publishing', count: stages.publishing, tone: 'bg-info/60' },
    { label: 'Scheduled', count: stages.scheduled, tone: 'bg-info' },
    { label: 'Live', count: stages.live, tone: 'bg-success' },
    { label: 'Paused', count: stages.paused, tone: 'bg-warning/50' },
    {
      label: 'Ended',
      count: stages.claims_closed + stages.sold_out + stages.expired,
      tone: 'bg-neutral/50',
    },
  ];

  return {
    stages,
    pipeline,
    drafts: stages.draft + stages.failed,
    claimed: rewards.reduce((total, reward) => total + reward.claimedCount, 0),
    top: rewards
      .filter((reward) => reward.claimedCount > 0)
      .sort((a, b) => b.claimedCount - a.claimedCount)
      .slice(0, 5),
    closingSoon: rewards
      .filter((reward) => {
        if (stageOf(reward, now) !== 'live' || !reward.expiresAt) return false;
        return Date.parse(reward.expiresAt) - now <= CLOSING_SOON_DAYS * DAY_MS;
      })
      .sort((a, b) => Date.parse(a.expiresAt!) - Date.parse(b.expiresAt!)),
  };
}

/** What in the catalog needs someone, and who can act on it. */
export function rewardAttention(
  { stages, closingSoon }: ReturnType<typeof summarizeRewards>,
  owner: boolean,
): AttentionItem[] {
  const items: AttentionItem[] = [];
  if (stages.failed)
    items.push({
      id: 'failed',
      tone: 'error',
      title: `${rewardCount(stages.failed)} failed to publish`,
      detail: 'Open Rewards and try activating again.',
      rewards: true,
    });
  if (stages.pending_approval)
    items.push({
      id: 'approval',
      tone: 'warning',
      title: `${rewardCount(stages.pending_approval)} awaiting ${owner ? 'your' : 'the Owner’s'} approval`,
      detail: 'Members can’t claim a reward until it’s approved.',
      rewards: true,
    });
  if (stages.sold_out)
    items.push({
      id: 'sold-out',
      tone: 'warning',
      title: `${rewardCount(stages.sold_out)} sold out`,
      detail: owner
        ? 'Raise the number available to reopen claims.'
        : 'The Owner can raise the number available to reopen claims.',
      rewards: true,
    });
  if (closingSoon.length)
    items.push({
      id: 'closing',
      tone: 'info',
      title: `${rewardCount(closingSoon.length)} closing within ${CLOSING_SOON_DAYS} days`,
      detail: 'Claims end on the closing date and it can’t be extended once published.',
      rewards: true,
    });
  return items;
}

/**
 * Core raises this at 80% and 95%, judged on the fullest budget shard: one dry shard refuses earns
 * even while the others have points left, so the warning can come before the total looks low.
 */
export function budgetAttention(
  budget: ConsoleIssuanceBudgetReadResponse | undefined,
): AttentionItem | null {
  if (!budget?.warningThreshold) return null;
  const critical = budget.warningThreshold === 95;
  return {
    id: 'budget',
    tone: critical ? 'error' : 'warning',
    title: `Points budget is over ${budget.warningThreshold}% used`,
    detail: critical
      ? 'Some points may soon be refused. An Owner can ask OctaP for a top-up.'
      : 'Part of the budget is running low. An Owner can ask OctaP for a top-up.',
  };
}

/** The active keys, most recently used first, and the latest use of any key, even a revoked one. */
export function summarizeKeys(keys: ConsoleCredential[]) {
  const usedAt = (key: ConsoleCredential) => (key.lastUsedAt ? Date.parse(key.lastUsedAt) : 0);
  const byUse = [...keys].sort((a, b) => usedAt(b) - usedAt(a));
  const active = byUse.filter(isActiveKey);
  return {
    active,
    latest: byUse[0]?.lastUsedAt ? byUse[0] : undefined,
    write: active.filter((key) => key.scopes.includes('write')).length,
  };
}

/** How many seven-day periods the joins chart covers. */
export const JOIN_WEEKS = 12;

/** Totals only, so no customer's name or contact details are kept for the dashboard. */
export interface MemberStats {
  counted: number;
  /** There are more members than were read, so the figures describe a sample. */
  capped: boolean;
  active: number;
  blocked: number;
  linked: number;
  withEmail: number;
  withPhone: number;
  newLast7Days: number;
  newLast30Days: number;
  /** Oldest first. The last period ends today, so it is always a full seven days. */
  weeks: { from: string; to: string; count: number }[];
}

export function emptyMemberStats(now = new Date()): MemberStats {
  return {
    counted: 0,
    capped: false,
    active: 0,
    blocked: 0,
    linked: 0,
    withEmail: 0,
    withPhone: 0,
    newLast7Days: 0,
    newLast30Days: 0,
    weeks: Array.from({ length: JOIN_WEEKS }, (_, index) => {
      const to = subDays(now, (JOIN_WEEKS - 1 - index) * 7);
      return { from: format(subDays(to, 6), 'MMM d'), to: format(to, 'MMM d'), count: 0 };
    }),
  };
}

/** Adds one member to the running totals. */
export function countMember(stats: MemberStats, member: MemberRow, now = new Date()) {
  stats.counted += 1;
  if (member.status === 'BLOCKED') stats.blocked += 1;
  else stats.active += 1;
  if (member.externalMemberId) stats.linked += 1;
  if (member.email) stats.withEmail += 1;
  if (member.phoneNumber) stats.withPhone += 1;

  // A join time slightly ahead of this device's clock still counts as today.
  const days = Math.max(0, differenceInCalendarDays(now, new Date(member.joinedAt)));
  if (days < 7) stats.newLast7Days += 1;
  if (days < 30) stats.newLast30Days += 1;
  const week = stats.weeks[JOIN_WEEKS - 1 - Math.floor(days / 7)];
  if (week) week.count += 1;
}

/** A webhook delivery without its event payload. */
export interface WebhookDelivery {
  id: string;
  status: 'DEAD_LETTER' | 'DELIVERED' | 'PENDING';
  eventType: string;
  attemptCount: number;
  lastResponseStatus: number | null;
  lastError: string | null;
  updatedAt: string;
}

/** How the latest deliveries went. Ones still being retried don't count either way yet. */
export function summarizeDeliveries(deliveries: WebhookDelivery[]) {
  const delivered = deliveries.filter((delivery) => delivery.status === 'DELIVERED').length;
  const failed = deliveries.filter((delivery) => delivery.status === 'DEAD_LETTER');
  const settled = delivered + failed.length;
  return {
    delivered,
    failed,
    settled,
    retrying: deliveries.length - settled,
    rate: settled ? Math.round((delivered / settled) * 100) : null,
  };
}
