import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unwrap, useAuth } from '@octap/shared/authentication';
import { notify } from '@octap/shared/components';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { toRewardPatch, type Reward, type RewardInput } from '../domain/draft';
import { coreMessage } from '../domain/errors';
import { availabilityPatch, rewardPermissions, stageOf, STAGES } from '../domain/stage';

/** How often the list is read again while a reward publishes on-chain. */
const PUBLISH_POLL_MS = 3000;

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
        new Error('Open the reward and activate it again.'),
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
        ? PUBLISH_POLL_MS
        : false,
  });
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

/** Creates one draft without a toast, for the CSV import's row-by-row run. */
export function useCreateDraft() {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  const store = useRewardCache();
  return async (input: RewardInput) => {
    const saved = await unwrap(api.console.createRewards({ organizationId, body: input }));
    store(saved);
    return saved;
  };
}

export type RewardAction =
  'activate' | 'pause' | 'resume' | 'submit' | 'withdraw' | 'approve' | 'reject';

const DONE: Record<RewardAction, string> = {
  activate: 'Activating',
  pause: 'Reward paused',
  resume: 'Reward resumed',
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
      const status = { activate: 'ACTIVE', resume: 'ACTIVE', pause: 'PAUSED' } as const;
      if (action === 'activate' || action === 'resume' || action === 'pause')
        return unwrap(
          api.console.updateRewards({ organizationId, id, body: { status: status[action] } }),
        );
      if (action === 'reject')
        return unwrap(api.console.reject({ organizationId, id, body: { reason } }));
      return unwrap(api.console[action]({ organizationId, id }));
    },
    onSuccess: (saved, { action }) => {
      store(saved);
      report(saved, stageOf(saved) === 'publishing' ? 'Publishing on-chain' : DONE[action]);
    },
    onError: (error) => notify.error(new Error(coreMessage(error)), 'Could not update the reward'),
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
