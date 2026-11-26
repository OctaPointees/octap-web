import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { ArrowClockwise, Buildings, Clock, ListChecks, Warning } from 'phosphor-react';

import { Button } from '@octap/shared/components';
import { Table } from '@octap/shared/components';
import { useAuth } from '@octap/shared/authentication';

import type { OrganizationList } from '../../partners/types';
import type { ChangeRequest } from '../../requests/types';

type OrganizationListSuccess = Extract<OrganizationList, { error: null }>;
type Organization = NonNullable<NonNullable<OrganizationList['data']>['items']>[number];

export function DashboardOverview() {
  const { api: client } = useAuth();
  const queryClient = useQueryClient();
  const [lastLoadedAt, setLastLoadedAt] = useState(() => new Date());

  const organizationsQuery = useQuery({
    queryKey: ['partners', 'organizations'],
    queryFn: async (): Promise<OrganizationListSuccess> => {
      const items: Organization[] = [];
      let cursor: string | undefined;

      do {
        const response = await client.platform.listOrganizations({ limit: 100, cursor });
        if (response.error) throw response.error;
        items.push(...(response.data.items ?? []));
        cursor = response.data.nextCursor ?? undefined;
      } while (cursor);

      return { data: { items, nextCursor: null }, error: null } as OrganizationListSuccess;
    },
    staleTime: 5 * 60 * 1000,
  });

  const requestsQuery = useQuery({
    queryKey: ['requests', 'change-requests'],
    queryFn: async (): Promise<ChangeRequest[]> => {
      const requests: ChangeRequest[] = [];
      let cursor: string | undefined;

      do {
        const response = await client.platform.listChangeRequests({ limit: 100, cursor });
        if (response.error) throw response.error;
        requests.push(...response.data.items);
        cursor = response.data.nextCursor ?? undefined;
      } while (cursor);

      return requests;
    },
    staleTime: 5 * 60 * 1000,
  });

  const organizations = organizationsQuery.data?.data.items ?? [];
  const requests = requestsQuery.data ?? [];
  const pendingRequests = requests
    .filter((request) => request.status === 'PENDING')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const recentOrganizations = [...organizations]
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 5);
  const failedProvisioning = organizations.filter((organization) =>
    organization.provisioning?.status.toLowerCase().includes('fail'),
  );
  const isLoading = organizationsQuery.isPending || requestsQuery.isPending;
  const error = organizationsQuery.error ?? requestsQuery.error;

  const reload = async () => {
    const results = await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['partners', 'organizations'] }),
      queryClient.invalidateQueries({ queryKey: ['requests', 'change-requests'] }),
    ]);
    await Promise.all(results);
    setLastLoadedAt(new Date());
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 screen-wrapper place-center">
        <span className="loading loading-spinner" />
        Loading dashboard overview
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 screen-wrapper place-center">
        <Warning size={48} className="text-error" />
        <div className="text-center">
          <h1 className="font-bold">Could not load dashboard data</h1>
          <p className="mt-1 text-sm text-base-content/70">
            {error instanceof Error ? error.message : 'An unexpected error occurred.'}
          </p>
        </div>
        <Button icon={ArrowClockwise} className="btn-primary" onClick={() => void reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const activeOrganizations = organizations.filter(
    (organization) => organization.status === 'ACTIVE',
  );
  const awaitingApproval = organizations.filter(
    (organization) => organization.status === 'PENDING_APPROVAL',
  );

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto screen-wrapper xl:flex-row">
      <main className="flex-1 min-w-0 space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-base-content/60">
              Organization health and change requests that need attention.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-base-content/60">
              Updated {formatDistanceToNow(lastLoadedAt, { addSuffix: true })}
            </span>
            <Button
              icon={ArrowClockwise}
              loading={organizationsQuery.isFetching || requestsQuery.isFetching}
              onClick={() => void reload()}
            >
              Reload
            </Button>
          </div>
        </header>

        <section
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Platform overview"
        >
          <OverviewCard title="Organizations" value={organizations.length} icon={Buildings} />
          <OverviewCard
            title="Active organizations"
            value={activeOrganizations.length}
            icon={Buildings}
            tone="success"
          />
          <OverviewCard
            title="Awaiting approval"
            value={awaitingApproval.length}
            icon={Clock}
            tone="warning"
          />
          <OverviewCard
            title="Pending change requests"
            value={pendingRequests.length}
            icon={ListChecks}
            tone="warning"
          />
        </section>

        {failedProvisioning.length > 0 && (
          <section className="alert alert-error" role="status">
            <Warning size={22} />
            <div>
              <div className="font-semibold">{failedProvisioning.length} provisioning issue(s)</div>
              <div className="text-sm">Review organizations with failed provisioning status.</div>
            </div>
            <Link className="ml-auto link" to="/partners">
              View partners
            </Link>
          </section>
        )}

        <div className="grid gap-5 xl:grid-cols-2">
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Requests awaiting review</h2>
                <p className="text-sm text-base-content/60">Oldest pending requests first.</p>
              </div>
              <Link className="btn btn-sm btn-outline" to="/requests">
                All requests
              </Link>
            </div>
            <Table<ChangeRequest>
              data={pendingRequests.slice(0, 6)}
              emptyMessage="No change requests are waiting for review."
              columns={[
                {
                  accessorKey: 'requestType',
                  header: () => 'Request',
                  cell: ({ row }) => (
                    <div className="py-1 space-y-1">
                      <div className="font-semibold capitalize">
                        {row.original.requestType.toLowerCase().replaceAll('_', ' ')}
                      </div>
                      <div className="text-xs text-base-content/60">
                        {row.original.organizationName || 'Organization not assigned'}
                      </div>
                    </div>
                  ),
                },
                {
                  accessorKey: 'requesterEmail',
                  header: () => 'Requested by',
                  cell: ({ row }) => row.original.initialOwnerName || row.original.requesterEmail,
                },
                {
                  accessorKey: 'createdAt',
                  header: () => 'Submitted',
                  cell: ({ getValue }) => format(new Date(getValue<string>()), 'dd/MM/yyyy'),
                },
              ]}
            />
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Recently added organizations</h2>
                <p className="text-sm text-base-content/60">
                  Latest organizations across the platform.
                </p>
              </div>
              <Link className="btn btn-sm btn-outline" to="/partners">
                All partners
              </Link>
            </div>
            <Table<Organization>
              data={recentOrganizations}
              emptyMessage="No organizations found."
              columns={[
                {
                  accessorKey: 'name',
                  header: () => 'Organization',
                  cell: ({ row }) => (
                    <div>
                      <Link
                        className="font-bold text-primary hover:underline"
                        to={`/partners/${row.original.id}`}
                      >
                        {row.original.name}
                      </Link>
                      <div>{row.original.representativeName ?? 'Self-represnted'}</div>
                      <div className="mt-2 text-xs opacity-65">
                        <div>Created {formatDistanceToNow(row.original.createdAt)} ago</div>
                        <div>{row.original.id}</div>
                      </div>
                    </div>
                  ),
                },
                {
                  accessorKey: 'status',
                  header: () => 'Status',
                  cell: ({ getValue }) => {
                    const status = getValue<string>();
                    const color =
                      status === 'ACTIVE'
                        ? 'badge-success'
                        : status === 'PENDING_APPROVAL'
                          ? 'badge-warning'
                          : 'badge-ghost';

                    return (
                      <div className={`w-full badge capitalize ${color}`}>
                        {status.toLowerCase().replaceAll('_', ' ')}
                      </div>
                    );
                  },
                  size: 50,
                  enableColumnFilter: true,
                },
              ]}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

function OverviewCard({
  title,
  value,
  icon: Icon,
  tone = 'primary',
}: {
  title: string;
  value: number;
  icon: typeof Buildings;
  tone?: 'primary' | 'success' | 'warning';
}) {
  const toneClass = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
  }[tone];

  return (
    <article className="p-4 border rounded-box border-base-300 bg-base-100">
      <div className="text-sm text-base-content/60">{title}</div>
      <div className={`mt-2 flex items-center justify-between ${toneClass}`}>
        <div className="text-3xl font-bold">{value.toLocaleString()}</div>
        <Icon size={32} weight="fill" aria-hidden="true" />
      </div>
    </article>
  );
}
