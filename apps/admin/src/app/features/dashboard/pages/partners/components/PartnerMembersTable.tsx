import { useState } from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowClockwise, UsersThree, Warning } from 'phosphor-react';

import { Button } from '@octap/shared/components';
import { Table } from '@octap/shared/components';
import { useAuth } from '@octap/shared/authentication';
import type { OctapClient } from '@octap/internal-sdk';

type MembersListResponse = Awaited<ReturnType<OctapClient['console']['listMembers']>>;
type MembersListSuccess = Extract<MembersListResponse, { error: null }>;
type OrganizationMember = MembersListSuccess['data']['items'][number];

export function PartnerMembersTable() {
  const { id: organizationId } = useParams<{ id: string }>();
  const { api: client } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const membersQuery = useQuery({
    queryKey: ['partners', 'members', organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID is missing');

      const members: OrganizationMember[] = [];
      let cursor: string | undefined;

      do {
        const response = await client.console.listMembers({
          organizationId,
          limit: 100,
          cursor,
        });
        if (response.error) throw response.error;

        members.push(...(response.data.items ?? []));
        cursor = response.data.nextCursor ?? undefined;
      } while (cursor);

      return members;
    },
    enabled: Boolean(organizationId),
    staleTime: 5 * 60 * 1000,
  });
  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase();
  const members = (membersQuery.data ?? []).filter((member) =>
    [
      member.displayName,
      member.id,
      member.endUserId,
      member.email,
      member.phoneNumber,
      member.status,
      member.externalMemberId,
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase()
      .includes(normalizedSearchQuery),
  );

  return (
    <section className="rounded-box border border-base-300 bg-base-100 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <UsersThree size={22} />
        <h2 className="text-lg font-semibold">Partner Members</h2>
        <div className="ml-auto flex flex-1 flex-wrap items-center justify-end gap-2">
          <input
            className="input input-bordered input-sm w-full max-w-xs"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search members"
            aria-label="Search partner members"
          />
          <Button
            icon={ArrowClockwise}
            className="btn-outline btn-sm"
            loading={membersQuery.isFetching}
            disabled={!organizationId}
            onClick={() => void membersQuery.refetch()}
          >
            Reload
          </Button>
        </div>
      </div>

      {!organizationId ? (
        <div className="flex items-center gap-2 py-4 text-sm text-error">
          <Warning size={20} />
          Organization ID is missing from the route.
        </div>
      ) : membersQuery.isPending ? (
        <div className="flex items-center gap-3 py-6 text-sm text-base-content/70">
          <span className="loading loading-spinner" />
          Loading partner members
        </div>
      ) : membersQuery.isError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 py-3">
          <p className="text-sm text-error">
            {membersQuery.error instanceof Error
              ? membersQuery.error.message
              : 'Could not load partner members.'}
          </p>
          <Button
            icon={ArrowClockwise}
            className="btn-outline"
            onClick={() => void membersQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : (
        <Table<OrganizationMember>
          data={members}
          emptyMessage="No members found for this organization."
          columns={[
            {
              accessorKey: 'id',
              header: () => 'Member',
              cell: ({ row }) => (
                <div className="space-y-1 py-1">
                  <div className="font-semibold">
                    {row.original.displayName || 'Unnamed member'}
                  </div>
                  <div className="text-xs text-base-content/60">Member ID: {row.original.id}</div>
                </div>
              ),
            },
            {
              accessorKey: 'email',
              header: () => 'Contact',
              cell: ({ row }) => (
                <div className="space-y-1 py-1">
                  <div>{row.original.email || 'No email'}</div>
                  <div className="text-xs text-base-content/60">
                    {row.original.phoneNumber || 'No phone number'}
                  </div>
                </div>
              ),
            },
            {
              accessorKey: 'status',
              header: () => 'Status',
              cell: ({ getValue }) => {
                const status = getValue<string>();
                const badgeClass = status === 'ACTIVE' ? 'badge-success' : 'badge-warning';
                return (
                  <span className={`badge ${badgeClass}`}>
                    {status.toLowerCase().replaceAll('_', ' ')}
                  </span>
                );
              },
            },
            {
              accessorKey: 'externalMemberId',
              header: () => 'External Member ID',
              cell: ({ getValue }) => getValue<string | null>() ?? 'Not provided',
            },
            {
              accessorKey: 'joinedAt',
              header: () => 'Joined',
              cell: ({ getValue }) =>
                format(new Date(getValue<string>()), 'dd/MM/yyyy - hh:mm:ss aa'),
            },
          ]}
        />
      )}
    </section>
  );
}
