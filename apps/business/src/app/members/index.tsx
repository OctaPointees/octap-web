import { useMemo, useState } from 'react';
import { CaretRight, MagnifyingGlass } from 'phosphor-react';
import { Button, createColumnHelper, Table } from '@octap/shared/components';
import { ErrorState, PageHeader, StatusBadge } from '@/components/shared/Display';
import { cn } from '@/utils/cn';
import { fmtDate } from '@/utils/format';
import { MemberPanel } from './components/MemberPanel';
import { initials } from './components/initials';
import { PAGE_SIZE, useMemberList, type MemberFilters, type MemberRow } from './hooks/useMembers';

const column = createColumnHelper<MemberRow>();

const noFilters: MemberFilters = { q: '', externalMemberId: '' };

/**
 * The organization's loyalty members. Search and external ID go to Core, which pages the list;
 * the table sorts and filters the page on screen. Opening a member shows their balance and
 * activity in a side panel.
 */
export default function MembersPage() {
  const [filters, setFilters] = useState<MemberFilters>(noFilters);
  const [draft, setDraft] = useState<MemberFilters>(noFilters);
  const [cursors, setCursors] = useState<string[]>(['']);
  // The panel keeps the last member while it slides away; `panelOpen` alone closes it.
  const [selected, setSelected] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const setOpen = (memberId: string) => {
    setSelected(memberId);
    setPanelOpen(true);
  };
  // Which control asked for the page now loading, so only that button shows it.
  const [trigger, setTrigger] = useState<'search' | 'previous' | 'next'>('search');
  const list = useMemberList(filters, cursors.at(-1)!);
  const rows = list.data?.items;
  const filtered = !!(filters.q || filters.externalMemberId);
  // The first load, or a new page while the last one stays on screen.
  const loadingBy = (control: typeof trigger) =>
    list.isFetching && (!rows || (list.isPlaceholderData && trigger === control));

  const columns = useMemo(
    () => [
      column.accessor((row) => row.displayName ?? row.email ?? row.phoneNumber ?? row.id, {
        id: 'customer',
        header: 'Customer',
        size: 320,
        cell: ({ row }) => {
          const member = row.original;
          const name = member.displayName ?? member.email ?? 'Unnamed member';
          return (
            <span className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
              >
                {initials(name)}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{name}</span>
                <span className="block truncate text-xs opacity-60">
                  {member.email ?? member.phoneNumber ?? 'No contact details'}
                </span>
              </span>
            </span>
          );
        },
      }),
      column.accessor('status', {
        header: 'Status',
        size: 140,
        enableColumnFilter: true,
        cell: ({ getValue }) => <StatusBadge status={getValue().toLowerCase()} />,
      }),
      column.accessor('externalMemberId', {
        header: 'External ID',
        size: 200,
        cell: ({ getValue }) =>
          getValue() ? (
            <span className="font-mono text-sm">{getValue()}</span>
          ) : (
            <span className="text-sm opacity-50">Not linked</span>
          ),
      }),
      column.accessor('joinedAt', {
        header: 'Joined',
        size: 140,
        cell: ({ getValue }) => <span className="text-sm">{fmtDate(getValue())}</span>,
      }),
      column.display({
        id: 'open',
        size: 56,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="flex justify-end pr-2 opacity-50">
            <CaretRight size={16} aria-label={`Open ${row.original.displayName ?? 'member'}`} />
          </span>
        ),
      }),
    ],
    [],
  );

  const search = (next: MemberFilters) => {
    setTrigger('search');
    setFilters({ q: next.q.trim(), externalMemberId: next.externalMemberId.trim() });
    setCursors(['']);
  };

  return (
    <>
      <PageHeader
        title="Members"
        description="Customers enrolled in this organization's loyalty program. Staff are on the Team page."
      />

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          search(draft);
        }}
      >
        <label className="input min-w-64 flex-1">
          <MagnifyingGlass size={16} className="opacity-50" aria-hidden />
          <input
            type="search"
            aria-label="Search members"
            placeholder="Search by name, email, phone or POS ID"
            value={draft.q}
            onChange={(event) => setDraft({ ...draft, q: event.target.value })}
          />
        </label>
        <input
          aria-label="External member ID"
          className="input w-56 font-mono"
          placeholder="External member ID"
          value={draft.externalMemberId}
          onChange={(event) => setDraft({ ...draft, externalMemberId: event.target.value })}
        />
        <Button type="submit" className="btn-primary" loading={loadingBy('search')}>
          Search
        </Button>
        {filtered && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setDraft(noFilters);
              search(noFilters);
            }}
          >
            Clear
          </button>
        )}
      </form>

      {list.error ? (
        <ErrorState error={list.error} onRetry={() => void list.refetch()} />
      ) : !rows ? (
        <div className="flex flex-col gap-2 rounded-box border border-base-300 p-4" aria-busy>
          {Array.from({ length: 6 }, (_, row) => (
            <div key={row} className="skeleton h-10 w-full" />
          ))}
        </div>
      ) : (
        <div
          className={cn('transition-opacity', list.isPlaceholderData && 'opacity-60')}
          aria-busy={list.isFetching}
        >
          <Table
            data={rows}
            columns={columns}
            emptyMessage={
              filtered ? 'No members match this search.' : 'No members have enrolled yet.'
            }
            rowProps={(member) => ({
              tabIndex: 0,
              className: 'cursor-pointer hover:bg-primary/5 focus-visible:outline-primary',
              onClick: () => setOpen(member.id),
              onKeyDown: (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setOpen(member.id);
                }
              },
            })}
          />
        </div>
      )}

      {rows && (cursors.length > 1 || list.data?.nextCursor) && (
        <nav aria-label="Member pages" className="flex items-center justify-between gap-3">
          <span className="text-sm opacity-60">
            Page {cursors.length}, {PAGE_SIZE} per page
          </span>
          <div className="flex gap-2">
            <Button
              className="btn-sm"
              disabled={cursors.length === 1 || list.isFetching}
              loading={loadingBy('previous')}
              onClick={() => {
                setTrigger('previous');
                setCursors((stack) => stack.slice(0, -1));
              }}
            >
              Previous
            </Button>
            <Button
              className="btn-sm"
              disabled={!list.data?.nextCursor || list.isFetching}
              loading={loadingBy('next')}
              onClick={() => {
                setTrigger('next');
                setCursors((stack) => [...stack, list.data!.nextCursor!]);
              }}
            >
              Next
            </Button>
          </div>
        </nav>
      )}

      <MemberPanel open={panelOpen} memberId={selected} onClose={() => setPanelOpen(false)} />
    </>
  );
}
