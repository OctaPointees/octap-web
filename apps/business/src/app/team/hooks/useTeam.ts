import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ConsoleOrganizationsInvitationsResponse,
  ConsoleOrganizationsStaffResponse,
} from '@octap/internal-sdk';
import { unwrap, useAuth } from '@octap/shared/authentication';
import { notify } from '@octap/shared/components';
import { useOrganization } from '@/app/organization/hooks/useOrganization';

export type TeamMember = ConsoleOrganizationsStaffResponse[number];
export type Invitation = ConsoleOrganizationsInvitationsResponse[number];

/** Query keys for an organization's team. Signing out clears them. */
export const teamKeys = {
  staff: (organizationId: string) => ['console', 'organization', organizationId, 'staff'] as const,
  invitations: (organizationId: string) =>
    ['console', 'organization', organizationId, 'invitations'] as const,
};

/**
 * Each write below updates the cached list from Core's answer, so it skips the app-wide refresh
 * after a mutation: one request per action, nothing fetched again.
 */
const cacheOnly = { invalidates: [] };

/** The staff and invitations, loaded side by side. Core lets only the Owner read them. */
export function useTeam() {
  const { api } = useAuth();
  const { organizationId, owner } = useOrganization();
  const staff = useQuery({
    queryKey: teamKeys.staff(organizationId),
    queryFn: () => unwrap(api.console.staff({ organizationId })),
    enabled: owner,
  });
  const invitations = useQuery({
    queryKey: teamKeys.invitations(organizationId),
    queryFn: () => unwrap(api.console.invitations({ organizationId })),
    enabled: owner,
  });
  return { staff, invitations };
}

/** Invites a Developer by email. Core answers with the invitation and its one-time token. */
export function useInviteDeveloper() {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  const cache = useQueryClient();
  return useMutation({
    meta: cacheOnly,
    mutationFn: (email: string) =>
      unwrap(
        api.console.invite({ organizationId, body: { email, persona: 'BUSINESS_DEVELOPER' } }),
      ),
    onSuccess: ({ id, email, status, expiresAt, persona }) => {
      const invitation: Invitation = { id, email, status, expiresAt, persona };
      cache.setQueryData<Invitation[]>(teamKeys.invitations(organizationId), (list = []) => [
        invitation,
        ...list.filter((row) => row.id !== id),
      ]);
    },
    onError: (cause) => notify.error(cause, 'Could not create the invitation'),
  });
}

/** Revokes a pending invitation, so its link stops working. */
export function useRevokeInvitation() {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  const cache = useQueryClient();
  return useMutation({
    meta: cacheOnly,
    mutationFn: async (invitation: Invitation) => {
      await unwrap(api.console.revokeOrganizations({ organizationId, id: invitation.id }));
      return invitation;
    },
    onSuccess: (revoked) => {
      cache.setQueryData<Invitation[]>(teamKeys.invitations(organizationId), (list) =>
        list?.map((row) => (row.id === revoked.id ? { ...row, status: 'REVOKED' } : row)),
      );
      notify.success('Invitation revoked', revoked.email);
    },
    onError: (cause) => notify.error(cause, 'Could not revoke the invitation'),
  });
}

/** Suspends or restores a Developer's access to the organization. */
export function useDeveloperAccess() {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  const cache = useQueryClient();
  return useMutation({
    meta: cacheOnly,
    mutationFn: async ({
      member,
      status,
    }: {
      member: TeamMember;
      status: 'ACTIVE' | 'SUSPENDED';
    }) => {
      await unwrap(
        api.console.staffAccess({ organizationId, userId: member.id, body: { status } }),
      );
      return { member, status };
    },
    onSuccess: ({ member, status }) => {
      cache.setQueryData<TeamMember[]>(teamKeys.staff(organizationId), (list) =>
        list?.map((row) => (row.id === member.id ? { ...row, status } : row)),
      );
    },
    onError: (cause) => notify.error(cause, 'Could not change access'),
  });
}
