import { useQuery } from '@tanstack/react-query';
import type { VoucherApprovalDto } from '@octap/internal-sdk';
import { unwrap, useAuth } from '@octap/shared/authentication';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { useApiKeys } from '@/app/api-keys/hooks/useApiKeys';
import { teamKeys } from '@/app/team/hooks/useTeam';

/** Who did something, as Core records it: a person, or an API key acting for a server. */
export type Actor = NonNullable<VoucherApprovalDto['submittedBy']>;

/** A readable name for an actor, and a second line such as their email, when known. */
export interface ActorName {
  name: string;
  detail?: string;
}

/**
 * Turns the IDs Core records on a reward's approval into names. Core sends IDs only, so this looks
 * them up in the team list and the API key list. Core lets only the Owner read the team, so anyone
 * else sees "You" for themselves and "A teammate" for others.
 */
export function usePeople() {
  const { api, identity } = useAuth();
  const { organizationId, owner } = useOrganization();
  // The same query as the Team page, so the two share one request and one cache.
  const staff = useQuery({
    queryKey: teamKeys.staff(organizationId),
    queryFn: () => unwrap(api.console.staff({ organizationId })),
    enabled: owner,
  });
  const keys = useApiKeys();
  const me = identity?.user.id;

  const person = (id: string): ActorName => {
    if (id === me) return { name: 'You' };
    const member = staff.data?.find((item) => item.id === id);
    if (member) return { name: member.fullName || member.email, detail: member.email };
    if (!owner) return { name: 'A teammate' };
    return { name: staff.data ? 'Former team member' : 'A team member' };
  };

  return {
    loading: staff.isPending && owner,
    actor: (actor: Actor | null | undefined): ActorName | null => {
      if (!actor) return null;
      if (actor.type === 'USER') return person(actor.id);
      const key = keys.data?.find((item) => item.id === actor.id);
      if (key) return { name: key.name, detail: `API key ${key.keyPrefix}••••` };
      return { name: keys.data ? 'Deleted API key' : 'An API key' };
    },
    person: (id: string | null | undefined) => (id ? person(id) : null),
  };
}
