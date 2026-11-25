import type { Reward } from './draft';

/**
 * Where a reward is in its life, from Core's `status` and `publishStatus`. A live reward is also
 * `scheduled` before claims open and `claims_closed` after they close, so the merchant can tell
 * why nobody is claiming it.
 */
export type Stage =
  | 'draft'
  | 'rejected'
  | 'failed'
  | 'pending_approval'
  | 'publishing'
  | 'scheduled'
  | 'live'
  | 'paused'
  | 'claims_closed'
  | 'sold_out'
  | 'expired'
  | 'archived';

export const STAGES: Record<Stage, { label: string; tone: string }> = {
  draft: { label: 'Draft', tone: 'badge-ghost' },
  rejected: { label: 'Rejected', tone: 'badge-error' },
  failed: { label: 'Publish failed', tone: 'badge-error' },
  pending_approval: { label: 'Awaiting approval', tone: 'badge-warning' },
  publishing: { label: 'Publishing', tone: 'badge-info' },
  scheduled: { label: 'Scheduled', tone: 'badge-info' },
  live: { label: 'Live', tone: 'badge-success' },
  paused: { label: 'Paused', tone: 'badge-warning' },
  claims_closed: { label: 'Claims closed', tone: 'badge-neutral' },
  sold_out: { label: 'Sold out', tone: 'badge-neutral' },
  expired: { label: 'Expired', tone: 'badge-neutral' },
  archived: { label: 'Archived', tone: 'badge-neutral' },
};

export function stageOf(reward: Reward, now = Date.now()): Stage {
  // A draft of an import that was archived (OCT-303): it never went live and can't any more.
  if (reward.status === 'ARCHIVED') return 'archived';
  if (reward.status === 'DEPLETED') return 'sold_out';
  if (reward.status === 'EXPIRED') return 'expired';
  if (reward.publishStatus === 'PUBLISHING') return 'publishing';
  if (reward.status === 'PENDING_APPROVAL') return 'pending_approval';
  if (reward.status === 'DRAFT') {
    if (reward.publishStatus === 'FAILED') return 'failed';
    // Back in draft because the Owner said no. Submitting again replaces the rejection.
    return reward.approval?.status === 'REJECTED' ? 'rejected' : 'draft';
  }
  // Paused while it was publishing, then the publish failed: it never went live, so it is a draft
  // whose publish failed, activated again like one.
  if (reward.status === 'PAUSED' && reward.publishStatus === 'FAILED') return 'failed';
  if (reward.status === 'PAUSED') return 'paused';
  if (reward.expiresAt && Date.parse(reward.expiresAt) <= now) return 'claims_closed';
  if (reward.startsAt && Date.parse(reward.startsAt) > now) return 'scheduled';
  return 'live';
}

/** Whether this person, not another member or an API key, submitted the reward for approval. */
export function submittedBy(reward: Reward, userId: string | undefined) {
  const by = reward.approval?.submittedBy;
  return !!userId && by?.type === 'USER' && by.id === userId;
}

/** The person's own rewards the Owner rejected, most recently rejected first. */
export function rejectedFor(rewards: Reward[], userId: string | undefined) {
  const reviewedAt = (reward: Reward) => Date.parse(reward.approval?.reviewedAt ?? '') || 0;
  return rewards
    .filter((reward) => stageOf(reward) === 'rejected' && submittedBy(reward, userId))
    .sort((a, b) => reviewedAt(b) - reviewedAt(a));
}

/** The tabs above the list, and which stages each one shows. */
export type Filter = 'all' | 'drafts' | 'awaiting' | 'live' | 'paused' | 'ended';
/** `empty` titles the list when the tab has nothing in it. */
export const FILTERS: { value: Filter; label: string; empty: string }[] = [
  { value: 'all', label: 'All', empty: 'No vouchers yet' },
  { value: 'drafts', label: 'Drafts', empty: 'No draft vouchers' },
  { value: 'awaiting', label: 'Awaiting approval', empty: 'No vouchers awaiting approval' },
  { value: 'live', label: 'Live', empty: 'No live vouchers' },
  { value: 'paused', label: 'Paused', empty: 'No paused vouchers' },
  { value: 'ended', label: 'Ended', empty: 'No ended vouchers' },
];
export const FILTER_OF: Record<Stage, Exclude<Filter, 'all'>> = {
  draft: 'drafts',
  rejected: 'drafts',
  failed: 'drafts',
  pending_approval: 'awaiting',
  publishing: 'live',
  scheduled: 'live',
  live: 'live',
  paused: 'paused',
  claims_closed: 'ended',
  sold_out: 'ended',
  expired: 'ended',
  archived: 'ended',
};

/** Once publishing starts, the offer is frozen on-chain; only availability can change. */
export const isLocked = (reward: Pick<Reward, 'publishStatus'>) =>
  reward.publishStatus === 'PUBLISHING' || reward.publishStatus === 'PUBLISHED';

/**
 * What the signed-in user may do with a reward, as Core decides it (OCT-236, OCT-59): Owners and
 * Developers write drafts; only the Owner pauses, resumes or changes a published reward. When the
 * organization requires approval, a Developer submits a draft instead of activating it, and the
 * Owner approves or rejects it.
 */
export function rewardPermissions(
  reward: Reward,
  { owner, approvalRequired }: { owner: boolean; approvalRequired: boolean },
) {
  const stage = stageOf(reward);
  const draft = stage === 'draft' || stage === 'rejected' || stage === 'failed';
  const published = isLocked(reward) && stage !== 'publishing';
  return {
    edit: draft,
    activate: draft && (owner || !approvalRequired),
    submit: draft && !owner && approvalRequired,
    approve: stage === 'pending_approval' && owner,
    reject: stage === 'pending_approval' && owner,
    withdraw: stage === 'pending_approval',
    pause: owner && ['scheduled', 'live'].includes(stage),
    resume: owner && stage === 'paused',
    availability: owner && published,
    duplicate: true,
  };
}
export type RewardPermissions = ReturnType<typeof rewardPermissions>;

/**
 * The PATCH that sets a published reward's availability. Core keeps a sold-out reward DEPLETED
 * after a supply-only change, so one that has room again is reactivated in the same request.
 */
export function availabilityPatch(
  reward: Pick<Reward, 'status' | 'claimedCount'>,
  totalSupply: number | null,
  perMemberLimit: number | null,
): { totalSupply: number | null; perMemberLimit: number | null; status?: 'ACTIVE' } {
  const reopens =
    reward.status === 'DEPLETED' && (totalSupply === null || totalSupply > reward.claimedCount);
  return { totalSupply, perMemberLimit, ...(reopens && { status: 'ACTIVE' as const }) };
}
