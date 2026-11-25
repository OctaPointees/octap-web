import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { OctapError } from '@octap/internal-sdk';
import { unwrap, useAuth } from '@octap/shared/authentication';
import { notify } from '@octap/shared/components';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { useLiveStatus } from '@/app/live/liveStatus';
import { toRewardPatch, type Reward, type RewardInput } from '../domain/draft';
import { coreMessage } from '../domain/errors';
import {
  availabilityPatch,
  rejectedFor,
  rewardPermissions,
  stageOf,
  STAGES,
} from '../domain/stage';

/** How often the list is read again while a reward publishes on-chain. */
const PUBLISH_POLL_MS = 3000;
/** The same, while live updates are on: Core says when publishing ends, so this is only a backup. */
const PUBLISH_POLL_LIVE_MS = 30_000;

export const rewardKeys = {
  list: (organizationId: string) => ['console', 'organization', organizationId, 'rewards'] as const,
};

/**
 * Every reward route answers with the reward as it now is, so a write only replaces that reward in
 * the cached list: one request, nothing fetched again.
 */
const cacheOnly = { invalidates: [] };

function useRewardCache() {
  const { organizationId } = useOrganization();
  const cache = useQueryClient();
  return (saved: Reward) =>
    cache.setQueryData<Reward[]>(rewardKeys.list(organizationId), (list = []) =>
      list.some((reward) => reward.id === saved.id)
        ? list.map((reward) => (reward.id === saved.id ? saved : reward))
        : [saved, ...list],
    );
}

/** Tells the page which reward just changed, so it can point at it. */
export type RewardReport = (saved: Reward, message: string) => void;

/**
 * Says how a publish ended. It can finish long after the click, and this is the moment Core
 * confirms it, so success is never announced earlier.
 */
function announcePublished(before: Reward[] | undefined, after: Reward[]) {
  for (const reward of after) {
    const previous = before?.find((candidate) => candidate.id === reward.id);
    if (previous?.publishStatus !== 'PUBLISHING' || reward.publishStatus === 'PUBLISHING') continue;
    const stage = stageOf(reward);
    if (stage === 'failed')
      notify.error(
        new Error('Open the voucher and activate it again.'),
        `Could not publish ${reward.title}`,
      );
    else notify.success('Published on-chain', `${reward.title}: ${STAGES[stage].label}`);
  }
}

/** The catalog, read again every few seconds while any reward is publishing. */
export function useRewards() {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  const cache = useQueryClient();
  const queryKey = rewardKeys.list(organizationId);
  const live = useLiveStatus() === 'live';
  return useQuery({
    queryKey,
    queryFn: async () => {
      const before = cache.getQueryData<Reward[]>(queryKey);
      const after = await unwrap(api.console.listRewards({ organizationId }));
      announcePublished(before, after);
      return after;
    },
    refetchInterval: (query) =>
      query.state.data?.some((reward) => reward.publishStatus === 'PUBLISHING')
        ? live
          ? PUBLISH_POLL_LIVE_MS
          : PUBLISH_POLL_MS
        : false,
  });
}

/**
 * How many rewards are waiting on the signed-in user, for the badge beside Vouchers in the
 * sidebar: for the Owner, those awaiting their approval; for anyone else, their own rewards the
 * Owner rejected. 0 until the list loads.
 */
export function useRewardsNeedingMe() {
  const { owner } = useOrganization();
  const { identity } = useAuth();
  const { data } = useRewards();
  if (!data) return 0;
  return owner
    ? data.filter((reward) => stageOf(reward) === 'pending_approval').length
    : rejectedFor(data, identity?.user.id).length;
}

/** What the signed-in user may do with a reward. */
export function useRewardPermissions() {
  const { owner, organization } = useOrganization();
  const approvalRequired = organization.voucherApprovalRequired;
  return (reward: Reward) => rewardPermissions(reward, { owner, approvalRequired });
}

/** Creates a draft, or saves an edited one. Errors stay with the form, which shows them by field. */
export function useSaveReward(editing: Reward | undefined, report: RewardReport) {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  const store = useRewardCache();
  return useMutation({
    meta: cacheOnly,
    mutationFn: (input: RewardInput) =>
      unwrap(
        editing
          ? api.console.updateRewards({
              organizationId,
              id: editing.id,
              body: toRewardPatch(input),
            })
          : api.console.createRewards({ organizationId, body: input }),
      ),
    onSuccess: (saved) => {
      store(saved);
      report(saved, editing ? 'Draft saved' : 'Draft created');
    },
  });
}

export type RewardAction =
  'activate' | 'pause' | 'resume' | 'submit' | 'withdraw' | 'approve' | 'reject';

const DONE: Record<RewardAction, string> = {
  activate: 'Activating',
  pause: 'Voucher paused',
  resume: 'Voucher resumed',
  submit: 'Sent for approval',
  withdraw: 'Taken back to draft',
  approve: 'Approved',
  reject: 'Sent back to draft',
};

/** Moves a reward through its life: activate, pause and resume, and the approval steps. */
export function useRewardAction(report: RewardReport) {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  const store = useRewardCache();
  const cache = useQueryClient();
  return useMutation({
    meta: cacheOnly,
    mutationFn: ({
      reward,
      action,
      reason = '',
    }: {
      reward: Reward;
      action: RewardAction;
      reason?: string;
    }) => {
      const id = reward.id;
      // Core decides only on what the user saw (OCT-324): the voucher as shown, and the submission
      // the Owner reviewed. One changed since is a 409, and the list is read again.
      const approvalRequestId = reward.approval?.id ?? '';
      if (action === 'activate')
        return unwrap(
          api.console.updateRewards({
            organizationId,
            id,
            body: { status: 'ACTIVE', expectedUpdatedAt: reward.updatedAt },
          }),
        );
      if (action === 'resume' || action === 'pause')
        return unwrap(
          api.console.updateRewards({
            organizationId,
            id,
            body: { status: action === 'pause' ? 'PAUSED' : 'ACTIVE' },
          }),
        );
      if (action === 'approve')
        return unwrap(api.console.approve({ organizationId, id, body: { approvalRequestId } }));
      if (action === 'reject')
        return unwrap(
          api.console.reject({ organizationId, id, body: { approvalRequestId, reason } }),
        );
      return unwrap(api.console[action]({ organizationId, id }));
    },
    onSuccess: (saved, { action }) => {
      store(saved);
      report(saved, stageOf(saved) === 'publishing' ? 'Publishing on-chain' : DONE[action]);
    },
    onError: (error) => {
      // A 409 can mean the voucher changed since it was shown: show it as it is now.
      if (error instanceof OctapError && error.status === 409)
        void cache.invalidateQueries({ queryKey: rewardKeys.list(organizationId) });
      notify.error(new Error(coreMessage(error)), 'Could not update the voucher');
    },
  });
}

/** Changes a published reward's number available and per-member limit. */
export function useRewardAvailability(report: RewardReport) {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  const store = useRewardCache();
  return useMutation({
    meta: cacheOnly,
    mutationFn: ({
      reward,
      totalSupply,
      perMemberLimit,
    }: {
      reward: Reward;
      totalSupply: number | null;
      perMemberLimit: number | null;
    }) =>
      unwrap(
        api.console.updateRewards({
          organizationId,
          id: reward.id,
          body: availabilityPatch(reward, totalSupply, perMemberLimit),
        }),
      ),
    onSuccess: (saved) => {
      store(saved);
      report(saved, 'Availability saved');
    },
    onError: (error) => notify.error(new Error(coreMessage(error)), 'Could not save availability'),
  });
}
