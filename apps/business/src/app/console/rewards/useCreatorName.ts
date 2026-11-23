import { useQuery } from '@tanstack/react-query';
import type { VoucherBatch } from '@octap/services';
import { useAuth } from '@octap/shared/authentication';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { organizationKeys } from '@/app/organization/utils';

/**
 * Who made a batch, in words. Only an Owner may list the team, so a Business Developer reads
 * "a teammate" instead of a name, as on the Rewards page.
 */
export function useCreatorName(): (batch: Pick<VoucherBatch, 'createdBy'>) => string {
  const auth = useAuth();
  const { organizationId, owner } = useOrganization();
  const staff = useQuery({
    queryKey: organizationKeys.staff(organizationId),
    queryFn: ({ signal }) => auth.client().listConsoleStaff(organizationId, signal),
    enabled: owner,
  });
  const me = auth.identity?.user.id;
  return ({ createdBy }) => {
    if (!createdBy) return 'someone no longer in the team';
    if (createdBy.type === 'API_CREDENTIAL') return 'an API key';
    if (createdBy.id === me) return 'you';
    return staff.data?.find((person) => person.id === createdBy.id)?.fullName ?? 'a teammate';
  };
}
