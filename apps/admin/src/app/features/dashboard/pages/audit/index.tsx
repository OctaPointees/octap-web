import { useState } from 'react';

import type { ColumnDef } from '@tanstack/react-table';

import { Table } from '@octap/shared/components';

import { cn, wait } from '@octap/shared/utils';
import { SearchAndFilterForm } from './components/SearchAndFilterForm';
import { CheckCircle, UsersFour, WarningOctagon, XCircle } from 'phosphor-react';
import { TestGraph } from '@/components/svg/TestGraph';
import { AUDIT_SUMMARY, EVENTS, type AuditEvent } from './data';

const COLUMNS: ColumnDef<AuditEvent>[] = [
  {
    accessorKey: 'timestamp',
    header: 'Timestamp (UTC)',
    size: 190,
    cell: ({ getValue }) => {
      const date = new Date(getValue<string>());
      return (
        <time dateTime={date.toISOString()} className="whitespace-nowrap">
          {date.toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'UTC',
          })}
        </time>
      );
    },
  },
  {
    accessorKey: 'actor',
    header: 'Performed by',
    size: 220,
    cell({ getValue }) {
      const v = getValue<string | null>();

      if (!v) return <div className="italic text-base-content/67">Unknown</div>;

      return <div>{v}</div>;
    },
  },
  { accessorKey: 'action', header: 'Event', size: 170 },
  { accessorKey: 'target', header: 'Resource', size: 190 },
  { accessorKey: 'ipAddress', header: 'IP address', size: 145 },
  {
    accessorKey: 'result',
    enableResizing: false,
    header: 'Outcome',
    size: 110,
    enableColumnFilter: true,
    cell: ({ getValue }) => {
      const result = getValue<AuditEvent['result']>();

      if (result === 'Success') {
        return (
          <span className="badge badge-success badge-soft w-full gap-1">
            Success
            <CheckCircle weight="fill" size="1.5em" />
          </span>
        );
      }

      return (
        <span className="badge badge-error badge-soft w-full gap-1">
          Denied
          <XCircle weight="fill" size="1.5em" />
        </span>
      );
    },
  },
];

export function AuditPages() {
  const [visibleEvents, setVisibleEvents] = useState(EVENTS);

  async function handleSearch({ query }: { query: string }) {
    await wait(250);
    const normalizedQuery = query.trim().toLowerCase();
    setVisibleEvents(
      normalizedQuery
        ? EVENTS.filter((event) =>
            [event.actor, event.action, event.target, event.ipAddress, event.result]
              .join(' ')
              .toLowerCase()
              .includes(normalizedQuery),
          )
        : EVENTS,
    );
  }

  return (
    <div className="screen-wrapper flex gap-4">
      <div className="w-80 rounded-box h-fit min-h-48 overflow-hidden">
        <div className="p-3 font-bold text-primary-content bg-primary rounded-t-box">
          System Audit
        </div>
        <SearchAndFilterForm onSubmit={handleSearch} />
      </div>

      <div className="flex-1 w-auto space-y-4">
        <div className="grid grid-cols-4 grid-rows-1 gap-4">
          <div className="info-box pr-0">
            <div className="title">Events recorded</div>
            <div className="content flex items-center text-primary">
              <div className="figure-bold w-44">{AUDIT_SUMMARY.totalEvents}</div>
              <TestGraph className="h-14 flex-1" />
            </div>
            <div className="description">in the past 24 hours</div>
          </div>

          <div className="info-box">
            <div className="title">Successful actions</div>
            <div className="content flex items-center">
              <div className="figure-bold flex-2 text-primary">{AUDIT_SUMMARY.successRate}</div>
              <div className="flex flex-col flex-1 items-end">
                <div className="uppercase text-xs flex items-center gap-1">
                  <span className="status status-success"></span>
                  Success
                </div>
                <strong className="text-2xl">{AUDIT_SUMMARY.successfulActions}</strong>
              </div>
              <div className="flex flex-col flex-1 items-end">
                <div className="uppercase text-xs flex items-center gap-1">
                  <span className="status status-error"></span>
                  Denied
                </div>
                <strong className="text-2xl">{AUDIT_SUMMARY.deniedRequests}</strong>
              </div>
            </div>
            <div className="description">in the past 24 hours</div>
          </div>

          <div className="info-box">
            <div className="title">Denied requests</div>
            <div className="content flex items-center text-error">
              <div className="figure-bold flex-1">{AUDIT_SUMMARY.deniedRequests}</div>
              <WarningOctagon weight="fill" size={45} />
            </div>
            <div className="description">access attempts blocked</div>
          </div>

          <div className="info-box">
            <div className="title">Unique Actors</div>
            <div className="content flex items-center text-primary">
              <div className="figure-bold flex-1">{AUDIT_SUMMARY.uniqueActors}</div>
              <UsersFour weight="fill" size={45} />
            </div>
            <div className="description">active in the past 24 hours</div>
          </div>
        </div>

        <Table
          data={visibleEvents}
          columns={COLUMNS}
          emptyMessage="No audit events match your search."
          rowProps={() => ({
            className: cn('cursor-pointer hover:bg-base-200'),
          })}
        />
      </div>
    </div>
  );
}
