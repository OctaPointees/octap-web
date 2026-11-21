import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  MembersDetailResponse,
  MembersListResponse,
  MembersPatchInput,
} from '@octap/internal-sdk';
import { unwrap, useAuth } from '@octap/shared/authentication';
import { notify } from '@octap/shared/components';
import { useOrganization } from '@/app/organization/hooks/useOrganization';

export type MemberRow = MembersListResponse['items'][number];
export type Member = MembersDetailResponse;

/** What Core filters the list by. Empty values are left out of the request. */
export interface MemberFilters {
  q: string;
  externalMemberId: string;
}

export const PAGE_SIZE = 25;

/** Query keys for an organization's members. Sign-out clears them. */
export const memberKeys = {
  all: (organizationId: string) => ['console', 'organization', organizationId, 'members'] as const,
  list: (organizationId: string, filters: MemberFilters, cursor: string) =>
    [...memberKeys.all(organizationId), 'list', filters, cursor] as const,
  /** Not under `list`: saving a member patches every entry there as a page of rows. */
  stats: (organizationId: string) => [...memberKeys.all(organizationId), 'stats'] as const,
  detail: (organizationId: string, memberId: string) =>
    [...memberKeys.all(organizationId), 'detail', memberId] as const,
  transactions: (organizationId: string, memberId: string) =>
    [...memberKeys.all(organizationId), 'transactions', memberId] as const,
  vouchers: (organizationId: string, memberId: string) =>
    [...memberKeys.all(organizationId), 'vouchers', memberId] as const,
};

/** One page of members. The previous page stays on screen while the next one loads. */
export function useMemberList(filters: MemberFilters, cursor: string) {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  return useQuery({
    queryKey: memberKeys.list(organizationId, filters, cursor),
    queryFn: () =>
      unwrap(
        api.console.listMembers({
          organizationId,
          limit: PAGE_SIZE,
          q: filters.q || undefined,
          externalMemberId: filters.externalMemberId || undefined,
          cursor: cursor || undefined,
        }),
      ),
    placeholderData: keepPreviousData,
  });
}

/** One member with their balance. Loads only while a member is open. */
export function useMember(memberId: string | null) {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  return useQuery({
    queryKey: memberKeys.detail(organizationId, memberId ?? ''),
    queryFn: () => unwrap(api.console.detailMembers({ organizationId, memberId: memberId! })),
    enabled: !!memberId,
  });
}

/** A member's points history, newest first, a page at a time. */
export function useMemberTransactions(memberId: string | null) {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  return useInfiniteQuery({
    queryKey: memberKeys.transactions(organizationId, memberId ?? ''),
    queryFn: ({ pageParam }) =>
      unwrap(
        api.console.transactions({
          organizationId,
          memberId: memberId!,
          limit: 10,
          cursor: pageParam || undefined,
        }),
      ),
    initialPageParam: '',
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: !!memberId,
  });
}

/** The vouchers a member has claimed. */
export function useMemberVouchers(memberId: string | null) {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  return useQuery({
    queryKey: memberKeys.vouchers(organizationId, memberId ?? ''),
    queryFn: () => unwrap(api.console.vouchers({ organizationId, memberId: memberId! })),
    enabled: !!memberId,
  });
}

/**
 * Saves the Owner's changes to a member: status, external ID and metadata. Core answers only
 * `{ updated }`, so the member and every cached list row are patched with what was sent instead
 * of fetching the lists again.
 */
export function useUpdateMember(member: Member) {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  const cache = useQueryClient();
  return useMutation({
    meta: { invalidates: [] },
    mutationFn: (body: MembersPatchInput) =>
      unwrap(api.console.patch({ organizationId, memberId: member.id, body })),
    onSuccess: (_result, body) => {
      const patch = {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.externalMemberId !== undefined && { externalMemberId: body.externalMemberId }),
        ...(body.metadata !== undefined && { metadata: body.metadata }),
      };
      cache.setQueryData<Member>(memberKeys.detail(organizationId, member.id), (current) =>
        current ? { ...current, ...patch } : current,
      );
      cache.setQueriesData<MembersListResponse>(
        { queryKey: [...memberKeys.all(organizationId), 'list'] },
        (page) =>
          page && {
            ...page,
            items: page.items.map((row) => (row.id === member.id ? { ...row, ...patch } : row)),
          },
      );
      if (body.status !== undefined || body.externalMemberId !== undefined)
        void cache.invalidateQueries({ queryKey: memberKeys.stats(organizationId) });
      notify.success('Member saved', member.displayName ?? member.email ?? undefined);
    },
    onError: (cause) => notify.error(cause, 'Could not save the member'),
  });
}
