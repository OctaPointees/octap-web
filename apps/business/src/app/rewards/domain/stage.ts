import type { Reward } from './draft';

/**
 * Where a reward is in its life, from Core's `status` and `publishStatus`. A live reward is also
 * `scheduled` before claims open and `claims_closed` after they close, so the merchant can tell
 * why nobody is claiming it.
 */
export type Stage =
  | 'draft'
  | 'failed'
  | 'pending_approval'
  | 'publishing'
  | 'scheduled'
  | 'live'
  | 'paused'
  | 'claims_closed'
  | 'sold_out'
  | 'expired';

export const STAGES: Record<Stage, { label: string; tone: string }> = {
  draft: { label: 'Draft', tone: 'badge-ghost' },
  failed: { label: 'Publish failed', tone: 'badge-error' },
  pending_approval: { label: 'Awaiting approval', tone: 'badge-warning' },
  publishing: { label: 'Publishing', tone: 'badge-info' },
  scheduled: { label: 'Scheduled', tone: 'badge-info' },
  live: { label: 'Live', tone: 'badge-success' },
  paused: { label: 'Paused', tone: 'badge-warning' },
  claims_closed: { label: 'Claims closed', tone: 'badge-neutral' },
  sold_out: { label: 'Sold out', tone: 'badge-neutral' },
  expired: { label: 'Expired', tone: 'badge-neutral' },
};

export function stageOf(reward: Reward, now = Date.now()): Stage {
  if (reward.status === 'DEPLETED') return 'sold_out';
  if (reward.status === 'EXPIRED') return 'expired';
  if (reward.publishStatus === 'PUBLISHING') return 'publishing';
  if (reward.status === 'PENDING_APPROVAL') return 'pending_approval';
  if (reward.status === 'DRAFT') return reward.publishStatus === 'FAILED' ? 'failed' : 'draft';
  if (reward.status === 'PAUSED') return 'paused';
  if (reward.expiresAt && Date.parse(reward.expiresAt) <= now) return 'claims_closed';
  if (reward.startsAt && Date.parse(reward.startsAt) > now) return 'scheduled';
  return 'live';
}

/** The tabs above the list, and which stages each one shows. */
export type Filter = 'all' | 'drafts' | 'live' | 'paused' | 'ended';
export const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'drafts', label: 'Drafts' },
  { value: 'live', label: 'Live' },
  { value: 'paused', label: 'Paused' },
  { value: 'ended', label: 'Ended' },
];
export const FILTER_OF: Record<Stage, Exclude<Filter, 'all'>> = {
  draft: 'drafts',
  failed: 'drafts',
  pending_approval: 'drafts',
  publishing: 'live',
  scheduled: 'live',
  live: 'live',
  paused: 'paused',
  claims_closed: 'ended',
  sold_out: 'ended',
  expired: 'ended',
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
  const draft = stage === 'draft' || stage === 'failed';
  const published = isLocked(reward) && stage !== 'publishing';
  return {
    edit: draft,
    activate: draft && (owner || !approvalRequired),
    submit: draft && !owner && approvalRequired,
    approve: stage === 'pending_approval' && owner,
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
