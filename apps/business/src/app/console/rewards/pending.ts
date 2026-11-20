import { useQuery } from '@tanstack/react-query';
import { useConsoleAuth } from '@octap/shared/google-auth';
import { rewardsApi } from './api';

/** How often the Owner's menu checks for rewards newly submitted for approval. */
const PENDING_POLL_MS = 60_000;

/**
 * How many rewards wait for an Owner's approval (OCT-59), for the badge on the Owner's Rewards
 * menu item. It shares the Rewards page's query, so a decision there updates the badge too.
 * `undefined` for a Business Developer, outside the console, or when nothing waits.
 */
export function usePendingApprovalCount(): number | undefined {
  const auth = useConsoleAuth();
  const orgId = auth?.organizationId ?? '';
  const list = useQuery({
    queryKey: ['console-rewards', orgId],
    queryFn: ({ signal }) => rewardsApi(auth!).list(orgId, signal),
    enabled: Boolean(auth?.owner && orgId),
    refetchInterval: PENDING_POLL_MS,
  });
  if (!auth?.owner) return undefined;
  return list.data?.filter((voucher) => voucher.status === 'PENDING_APPROVAL').length || undefined;
}
