import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowClockwise,
  CheckCircle,
  CheckSquareOffset,
  Clock,
  Copy,
  ListBullets,
  MagnifyingGlass,
  Rows,
  Warning,
} from 'phosphor-react';

import { Button } from '@octap/shared/components';
import { Table } from '@octap/shared/components';
import { useAuth } from '@octap/shared/authentication';

import { ChangeRequestActions } from './components/ChangeRequestActions';
import type { ChangeRequest, ChangeRequestStatus } from './types';
import { cn } from '@octap/shared/utils';
import type { ColumnDef } from '@tanstack/react-table';
import { ColumnMenu } from '@/components/shared/ColumnMenu';

export function RequestsPage() {
  const { api: client } = useAuth();

  const [timestamp, setTimestamp] = useState(new Date());
  const requestsQuery = useQuery({
    queryKey: ['requests', 'change-requests'],
    queryFn: async () => {
      const requests: ChangeRequest[] = [];
      let cursor: string | undefined;

      do {
        const response = await client.platform.listChangeRequests({ limit: 100, cursor });
        if (response.error) throw response.error;
        requests.push(...response.data.items);
        cursor = response.data.nextCursor ?? undefined;
      } while (cursor);

      setTimestamp(new Date());

      return requests;
    },
    staleTime: 5 * 60 * 1000,
  });

  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [isCompact, setIsCompact] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ChangeRequestStatus | null>(null);
  const [disabledCols, setDisabledCols] = useState(new Set<string>(['Request Details']));

  const requests = requestsQuery.data ?? [];
  const pendingCount = requests.filter((request) => request.status === 'PENDING').length;
  const approvedCount = requests.filter((request) => request.status === 'APPROVED').length;
  const normalizedSearch = appliedSearch.trim().toLocaleLowerCase();
  const filteredRequests = requests.filter((request) => {
    const matchesStatus = !statusFilter || request.status === statusFilter;
    const searchableText = [
      request.id,
      request.organizationId,
      request.organizationName,
      request.requestType,
      request.requesterEmail,
      request.reviewerEmail,
      request.initialOwnerName,
      request.initialOwnerEmail,
      request.status,
      request.reason,
      JSON.stringify(request.payload),
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase();

    return matchesStatus && (!normalizedSearch || searchableText.includes(normalizedSearch));
  });

  const applySearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedSearch(searchInput);
  };

  if (requestsQuery.isPending) {
    return (
      <div className="flex flex-col gap-4 screen-wrapper place-center">
        <span className="loading loading-spinner" />
        Loading change requests
      </div>
    );
  }

  if (requestsQuery.isError) {
    return (
      <div className="flex flex-col gap-6 screen-wrapper place-center ring ring-base-300 rounded-box">
        <Warning size={60} className="text-error" />
        <div className="text-center">
          <h1 className="font-bold">Could not load change requests</h1>
          <p className="mt-1 text-sm text-base-content/70">
            {requestsQuery.error instanceof Error
              ? requestsQuery.error.message
              : 'An unexpected error occurred while fetching requests.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            icon={ArrowClockwise}
            className="btn-primary"
            onClick={() => void requestsQuery.refetch()}
          >
            Retry
          </Button>
          <Button
            icon={Copy}
            onClick={() =>
              void navigator.clipboard.writeText(JSON.stringify(requestsQuery.error, null, 2))
            }
          >
            Copy Error
          </Button>
        </div>
      </div>
    );
  }

  const COLUMNS: Array<ColumnDef<ChangeRequest> & { name: string }> = [
    {
      enableColumnFilter: true,
      accessorKey: 'requestType',
      header: () => 'Request',
      name: 'Request',
      cell: ({ row }) =>
        isCompact ? (
          <div className="py-1 font-semibold capitalize truncate">{row.original.requestType}</div>
        ) : (
          <div className="py-1 space-y-1">
            <div className="font-semibold capitalize">
              {row.original.requestType.toLowerCase().replaceAll('_', ' ')}
              <span className="opacity-65 text-xs"> [{row.original.requestType}]</span>
            </div>
            <div className="text-xs text-base-content/60">ID: {row.original.id}</div>
            {row.original.organizationId ? (
              <Link
                className="text-xs text-primary hover:underline"
                to={`/partners/${row.original.organizationId}`}
              >
                {row.original.organizationName || row.original.organizationId}
              </Link>
            ) : (
              <div className="text-xs text-base-content/60">Organization not assigned</div>
            )}
          </div>
        ),
    },
    {
      accessorKey: 'requesterEmail',
      header: () => 'Requester',
      name: 'Requester',
      cell: ({ row }) =>
        isCompact ? (
          <div className="py-1 font-medium truncate">
            {row.original.initialOwnerName || row.original.requesterEmail}
          </div>
        ) : (
          <div className="py-1 space-y-1">
            <div className="font-medium">
              {row.original.initialOwnerName || row.original.requesterEmail}
            </div>
            <div className="text-xs text-base-content/60">{row.original.requesterEmail}</div>
            {row.original.initialOwnerEmail && (
              <div className="text-xs text-base-content/60">
                Initial owner: {row.original.initialOwnerEmail}
              </div>
            )}
          </div>
        ),
    },
    {
      accessorKey: 'payload',
      header: () => 'Request Details',
      name: 'Request Details',
      cell: ({ getValue }) => {
        const payload = getValue<unknown>();
        const details =
          payload && typeof payload === 'object'
            ? JSON.stringify(payload)
            : String(payload ?? 'No details provided');

        return (
          <div
            className={cn('whitespace-normal text-xs truncate font-mono line-clamp-3', {
              'line-clamp-1': isCompact,
            })}
          >
            {details}
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: () => 'Submitted',
      name: 'Submitted',
      cell: ({ getValue }) => format(new Date(getValue<string>()), 'dd/MM/yyyy - hh:mm:ss aa'),
    },
    {
      accessorKey: 'status',
      header: () => 'Status & Reason',
      name: 'Status & Reason',
      enableColumnFilter: true,
      cell: ({ row }) => {
        const status = row.original.status;
        const badgeClass =
          status === 'APPROVED'
            ? 'badge-success'
            : status === 'PENDING'
              ? 'badge-warning'
              : status === 'REJECTED'
                ? 'badge-error'
                : 'badge-ghost';
        if (isCompact) {
          return (
            <span className={`badge capitalize ${badgeClass}`}>
              {status.toLowerCase().replaceAll('_', ' ')}
            </span>
          );
        }

        return (
          <div className="py-1 space-y-1 capitalize">
            <span className={`badge ${badgeClass} mb-4`}>
              {status.toLowerCase().replaceAll('_', ' ')}
            </span>
            <div className="text-xs whitespace-normal text-base-content/70">
              {row.original.reason || 'No reason provided'}
            </div>
            {row.original.reviewerEmail && (
              <div className="text-xs text-base-content/60">
                Reviewed by {row.original.reviewerEmail}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => 'Actions',
      name: 'Actions',
      enableSorting: false,
      cell: ({ row }) => <ChangeRequestActions request={row.original} />,
      maxSize: 60,
      minSize: 60,
    },
  ];

  const FILTER_COLUMNS = COLUMNS.filter((_) => !disabledCols.has(_.name));

  const TOGGLE_COLUMN = (colName: string) => {
    const cols = new Set(disabledCols);
    cols[cols.has(colName) ? 'delete' : 'add'](colName);

    setDisabledCols(cols);
  };

  return (
    <div className="flex gap-4 screen-wrapper">
      <aside className="flex flex-col p-1 overflow-hidden w-80 shrink-0 rounded-box">
        <div className="p-3 font-bold rounded-t-box bg-primary text-primary-content">
          Change Requests
        </div>

        <form onSubmit={applySearch}>
          <label className="w-full rounded-t-none input">
            <MagnifyingGlass />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search requests"
              autoComplete="off"
              spellCheck={false}
              aria-label="Search change requests"
            />
          </label>
        </form>

        <div className="*:btn-block space-y-2 my-2 flex-1">
          <ColumnMenu
            columns={COLUMNS.map((column) => column.name)}
            hidden={disabledCols}
            onToggle={TOGGLE_COLUMN}
          />

          <Button
            type="button"
            icon={isCompact ? ListBullets : Rows}
            aria-pressed={isCompact}
            title={isCompact ? 'Switch to detailed table' : 'Switch to compact table'}
            onClick={() => setIsCompact((current) => !current)}
          >
            View mode: {isCompact ? 'Compact' : 'Detailed'}
          </Button>
          <Button
            icon={ArrowClockwise}
            loading={requestsQuery.isFetching}
            onClick={() => void requestsQuery.refetch()}
          >
            Reload
          </Button>

          <div className="py-2 text-sm italic text-center opacity-67">
            Updated {formatDistanceToNow(timestamp, { addSuffix: true })}
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-2 *:flex-1">
          <button
            type="button"
            aria-pressed={statusFilter === null}
            onClick={() => setStatusFilter(null)}
            className={`info-box info-box-compact border border-base-300 text-left hover:border-primary ${statusFilter === null ? 'ring-2 ring-primary' : ''}`}
          >
            <div className="title">All Requests</div>
            <div className="flex items-center content text-primary">
              <div className="flex-1 figure-bold">{requests.length.toLocaleString()}</div>
              <CheckSquareOffset weight="fill" size={42} />
            </div>
            <div className="description">from all organizations</div>
          </button>

          <button
            type="button"
            aria-pressed={statusFilter === 'PENDING'}
            onClick={() => setStatusFilter(statusFilter === 'PENDING' ? null : 'PENDING')}
            className={`info-box info-box-compact border border-base-300 text-left hover:border-warning ${statusFilter === 'PENDING' ? 'ring-2 ring-warning' : ''}`}
          >
            <div className="title">Pending</div>
            <div className="flex items-center content text-warning">
              <div className="flex-1 figure-bold">{pendingCount.toLocaleString()}</div>
              <Clock weight="fill" size={40} />
            </div>
            <div className="description">awaiting review</div>
          </button>

          <button
            type="button"
            aria-pressed={statusFilter === 'APPROVED'}
            onClick={() => setStatusFilter(statusFilter === 'APPROVED' ? null : 'APPROVED')}
            className={`info-box info-box-compact border border-base-300 text-left hover:border-success ${statusFilter === 'APPROVED' ? 'ring-2 ring-success' : ''}`}
          >
            <div className="title">Approved</div>
            <div className="flex items-center content text-success">
              <div className="flex-1 figure-bold">{approvedCount.toLocaleString()}</div>
              <CheckCircle weight="fill" size={40} />
            </div>
            <div className="description">approved requests</div>
          </button>
        </div>
      </aside>

      <section className="flex-1 min-w-0">
        <Table<ChangeRequest>
          data={filteredRequests}
          initialState={{
            sorting: [{ id: 'createdAt', desc: true }],
          }}
          emptyMessage="No requests match the current filters."
          columns={FILTER_COLUMNS}
          className="h-full overflow-y-scroll"
        />
      </section>
    </div>
  );
}
