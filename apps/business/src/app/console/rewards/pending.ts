import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@octap/shared/authentication';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { rewardsApi } from './api';

/** How often the Owner's menu checks for rewards newly submitted for approval. */
const PENDING_POLL_MS = 60_000;

/**
 * How many rewards wait for an Owner's approval (OCT-59), for the badge on the Owner's Rewards
 * menu item. It shares the Rewards page's query, so a decision there updates the badge too.
 * `undefined` for a Business Developer, or when nothing waits.
 */
export function usePendingApprovalCount(): number | undefined {
  const auth = useAuth();
  const { organizationId, owner } = useOrganization();
  const list = useQuery({
    queryKey: ['console-rewards', organizationId],
    queryFn: ({ signal }) => rewardsApi(auth).list(organizationId, signal),
    enabled: owner,
    refetchInterval: PENDING_POLL_MS,
  });
  if (!owner) return undefined;
  return list.data?.filter((voucher) => voucher.status === 'PENDING_APPROVAL').length || undefined;
}
