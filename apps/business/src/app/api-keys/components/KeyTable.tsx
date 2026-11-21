import { useMemo } from 'react';
import { Eye, LockSimple, PencilSimple, PencilSimpleLine } from 'phosphor-react';
import type { ConsoleCredential } from '@octap/services';
import { Button, createColumnHelper, Table } from '@octap/shared/components';
import { fmtDate, fmtRelative } from '@/utils/format';
import {
  accessLabel,
  canManageKey,
  hasWriteAccess,
  isActiveKey,
  isStaleKey,
  STALE_KEY_DAYS,
} from '../domain/keys';

const column = createColumnHelper<ConsoleCredential>();

const timeOf = (iso: string | null) => (iso ? Date.parse(iso) : 0);

/** The keys in one tab, most recently used first. Revoked keys are a record, with no actions. */
export function KeyTable({
  keys,
  owner,
  emptyMessage,
  onRename,
  onRevoke,
}: {
  keys: ConsoleCredential[];
  owner: boolean;
  emptyMessage: string;
  onRename: (key: ConsoleCredential) => void;
  onRevoke: (key: ConsoleCredential) => void;
}) {
  const columns = useMemo(
    () => [
      column.accessor('name', {
        header: 'Key',
        size: 340,
        cell: ({ row }) => (
          <span className="block min-w-0">
            <span className="block truncate font-medium">{row.original.name}</span>
            <span className="block truncate font-mono text-xs opacity-60">
              {row.original.keyPrefix}••••
            </span>
          </span>
        ),
      }),
      column.accessor(accessLabel, {
        id: 'access',
        header: 'Access',
        size: 180,
        enableColumnFilter: true,
        cell: ({ row, getValue }) => {
          const AccessIcon = hasWriteAccess(row.original) ? PencilSimpleLine : Eye;
          return (
            <span className="flex items-center gap-2 text-sm">
              <AccessIcon size={16} className="shrink-0 opacity-60" aria-hidden />
              {getValue()}
            </span>
          );
        },
      }),
      column.accessor((key) => timeOf(key.lastUsedAt), {
        id: 'lastUsed',
        header: 'Last used',
        size: 180,
        cell: ({ row }) => {
          const key = row.original;
          return (
            <span className="flex items-center gap-2 text-sm">
              {key.lastUsedAt ? fmtRelative(key.lastUsedAt) : 'Never'}
              {key.lastUsedAt && isActiveKey(key) && isStaleKey(key) && (
                <span
                  className="badge badge-soft badge-warning badge-sm"
                  title={`Not used in the last ${STALE_KEY_DAYS} days. Revoke it if nothing needs it.`}
                >
                  Idle
                </span>
              )}
            </span>
          );
        },
      }),
      column.accessor((key) => timeOf(key.createdAt), {
        id: 'created',
        header: 'Created',
        size: 130,
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.createdAt ? fmtDate(row.original.createdAt) : 'Unknown'}
          </span>
        ),
      }),
      column.display({
        id: 'actions',
        size: 130,
        enableSorting: false,
        cell: ({ row }) => {
          const key = row.original;
          if (!isActiveKey(key)) return null;
          if (!canManageKey(key, owner))
            return (
              <span
                className="flex justify-end pr-2 opacity-50"
                title="Only the Owner can manage a key with write access"
              >
                <LockSimple size={16} aria-label="Only the Owner can manage this key" />
              </span>
            );
          return (
            <span className="flex items-center justify-end gap-1">
              <Button
                className="btn-ghost btn-xs btn-square min-w-0"
                aria-label={`Rename ${key.name}`}
                title="Rename"
                onClick={() => onRename(key)}
              >
                <PencilSimple size={14} />
              </Button>
              <Button
                className="btn-ghost btn-xs min-w-0 text-error"
                aria-label={`Revoke ${key.name}`}
                onClick={() => onRevoke(key)}
              >
                Revoke
              </Button>
            </span>
          );
        },
      }),
    ],
    [owner, onRename, onRevoke],
  );

  return (
    <Table
      data={keys}
      columns={columns}
      emptyMessage={emptyMessage}
      initialState={{ sorting: [{ id: 'lastUsed', desc: true }] }}
    />
  );
}
