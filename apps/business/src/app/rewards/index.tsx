import { useMemo, useState } from 'react';
import {
  ClockCounterClockwise,
  FileArrowUp,
  Funnel,
  Plus,
  Rows,
  SquaresFour,
  Stack,
  Ticket,
} from 'phosphor-react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '@octap/shared/authentication';
import { Button, createColumnHelper, notify, Table, useRowFlash } from '@octap/shared/components';
import { EmptyState, ErrorState, PageHeader } from '@/components/shared/Display';
import { cn } from '@/utils/cn';
import { fmtDate } from '@/utils/format';
import { batchTitle } from './domain/batches';
import { describePoints } from './domain/describe';
import { duplicateOf, fromReward, type Reward } from './domain/draft';
import { KINDS } from './domain/kinds';
import { filterChips, matchesFilters } from './domain/filters';
import { rejectedFor, STAGES, stageOf } from './domain/stage';
import { useRewardFilters } from './hooks/useRewardFilters';
import { FilterBar } from './components/FilterBar';
import {
  useRewardAction,
  useRewardPermissions,
  useRewards,
  type RewardReport,
} from './hooks/useRewards';
import { useBatches } from './hooks/useBatches';
import { usePeople } from './hooks/usePeople';
import { ImportDialog } from './components/ImportDialog';
import type { RewardIntent } from './components/intents';
import { RewardActions, RewardPrimaryAction } from './components/RewardActions';
import { RewardCard } from './components/RewardCard';
import {
  AvailabilityDialog,
  RewardConfirm,
  type RewardConfirmRequest,
} from './components/RewardDialogs';
import { RewardPanel, type RewardPanelMode } from './components/RewardPanel';
import { RejectedBanner } from './components/RejectionNotice';

type View = 'cards' | 'table';
const viewKey = 'octap.business.rewardsView';
const savedView = (): View => {
  try {
    return localStorage.getItem(viewKey) === 'table' ? 'table' : 'cards';
  } catch {
    return 'cards';
  }
};

const column = createColumnHelper<Reward>();

/**
 * The organization's reward catalog, as cards or as a table, narrowed by the filters in the URL.
 * The table only sorts; filtering lives in the filter bar. Opening a reward
 * shows it in a side panel: editable while it is a draft, read-only once it is published.
 */
export default function RewardsPage() {
  const list = useRewards();
  const permissionsOf = useRewardPermissions();
  const people = usePeople();
  const { filters, setFilters, clear: clearFilters } = useRewardFilters();
  const [view, setView] = useState<View>(savedView);
  const { flashRow, isFlashing } = useRowFlash();
  // The tint shows the result. If the filters hide that reward, a toast says it instead.
  const report: RewardReport = (saved, message) => {
    flashRow(saved.id);
    if (!matchesFilters(saved, filters)) notify.success(message, saved.title);
  };
  const run = useRewardAction(report);
  // The panel keeps its last mode while it slides away, so it closes with `panelOpen` only.
  const [panel, setPanelMode] = useState<RewardPanelMode | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const setPanel = (mode: RewardPanelMode) => {
    setPanelMode(mode);
    setPanelOpen(true);
  };
  // The dialogs stay mounted, so they animate in and out.
  const [confirming, setConfirming] = useState<RewardConfirmRequest | null>(null);
  const [editingAvailability, setEditingAvailability] = useState<Reward | null>(null);
  const [importing, setImporting] = useState(false);
  const navigate = useNavigate();
  // Open imports with drafts left, for the banner that leads back to them.
  const batches = useBatches();
  const waitingBatches = batches.data?.filter((batch) => (batch.statusCounts.DRAFT ?? 0) > 0) ?? [];
  const waitingDrafts = waitingBatches.reduce((n, batch) => n + (batch.statusCounts.DRAFT ?? 0), 0);

  const chooseView = (next: View) => {
    setView(next);
    try {
      localStorage.setItem(viewKey, next);
    } catch {
      /* Remembered for this visit only. */
    }
  };

  const onIntent = (intent: RewardIntent, reward: Reward) => {
    if (intent === 'view' || intent === 'edit') setPanel({ type: intent, reward });
    else if (intent === 'duplicate') setPanel({ type: 'create', from: duplicateOf(reward) });
    else if (intent === 'availability') setEditingAvailability(reward);
    else if (
      intent === 'activate' ||
      intent === 'submit' ||
      intent === 'approve' ||
      intent === 'pause' ||
      intent === 'reject'
    )
      setConfirming({ action: intent, reward });
    else run.mutate({ reward, action: intent });
  };
  const busyWith = run.isPending ? run.variables.reward.id : null;
  const openReward = (reward: Reward) =>
    onIntent(permissionsOf(reward).edit ? 'edit' : 'view', reward);

  const { identity } = useAuth();
  const rejected = list.data ? rejectedFor(list.data, identity?.user.id) : [];

  // `?open=<id>` (from a dashboard row) opens that reward once the list is in. It opens once per
  // link, and closing the panel drops the parameter.
  const [params, setParams] = useSearchParams();
  const openId = params.get('open');
  const [openedId, setOpenedId] = useState<string | null>(null);
  if (openId && openId !== openedId && list.data) {
    setOpenedId(openId);
    const reward = list.data.find((item) => item.id === openId);
    if (reward) openReward(reward);
  }
  const closePanel = () => {
    setPanelOpen(false);
    if (openId)
      setParams(
        (current) => {
          current.delete('open');
          return current;
        },
        { replace: true },
      );
  };

  const rewards = list.data?.filter((reward) => matchesFilters(reward, filters));
  const filtered = filterChips(filters).length > 0;

  const columns = useMemo(
    () => [
      column.accessor('title', {
        header: 'Voucher',
        size: 300,
        cell: ({ row }) => {
          const reward = row.original;
          const { icon: KindIcon } = KINDS[fromReward(reward).kind];
          return (
            <span className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-field bg-primary/10 text-primary">
                <KindIcon size={16} />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{reward.title}</span>
                <span className="block truncate font-mono text-xs opacity-55">{reward.code}</span>
              </span>
            </span>
          );
        },
      }),
      column.accessor((reward) => KINDS[fromReward(reward).kind].label, {
        id: 'type',
        header: 'Type',
        size: 140,
      }),
      column.accessor((reward) => STAGES[stageOf(reward)].label, {
        id: 'stage',
        header: 'Stage',
        size: 160,
        cell: ({ row }) => {
          const stage = stageOf(row.original);
          // While it waits, who sent it, so the Owner knows whose request it is.
          const submitter =
            stage === 'pending_approval' ? people.actor(row.original.approval?.submittedBy) : null;
          return (
            <span className="flex min-w-0 flex-col items-start gap-0.5">
              <span className={cn('badge badge-soft badge-sm', STAGES[stage].tone)}>
                {stage === 'publishing' && <span className="loading loading-spinner loading-xs" />}
                {STAGES[stage].label}
              </span>
              {submitter && (
                <span
                  className="max-w-full truncate text-xs opacity-60"
                  title={submitter.detail ?? submitter.name}
                >
                  by {submitter.name}
                </span>
              )}
            </span>
          );
        },
      }),
      column.accessor('pointsCost', {
        header: 'Points',
        size: 110,
        cell: ({ getValue }) => <span className="tabular-nums">{describePoints(getValue())}</span>,
      }),
      column.accessor('claimedCount', {
        header: 'Claimed',
        size: 120,
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.claimedCount}
            <span className="opacity-50">
              {row.original.totalSupply == null
                ? ' of unlimited'
                : ` of ${row.original.totalSupply}`}
            </span>
          </span>
        ),
      }),
      column.accessor((reward) => reward.expiresAt ?? '', {
        id: 'closes',
        header: 'Claims close',
        size: 140,
        cell: ({ getValue }) =>
          getValue() ? fmtDate(getValue()) : <span className="opacity-50">No date</span>,
      }),
      column.display({
        id: 'actions',
        size: 200,
        enableSorting: false,
        cell: ({ row }) => {
          const reward = row.original;
          const permissions = permissionsOf(reward);
          return (
            <span className="flex items-center justify-end gap-1">
              <RewardPrimaryAction
                reward={reward}
                permissions={permissions}
                busy={busyWith === reward.id}
                onIntent={onIntent}
              />
              <RewardActions reward={reward} permissions={permissions} onIntent={onIntent} />
            </span>
          );
        },
      }),
    ],
    // The handlers read the latest state on every render; the column shape never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busyWith, permissionsOf, people],
  );

  return (
    <>
      <PageHeader
        title="Vouchers"
        description="What members can claim with their points. Drafts stay private until they are activated."
        actions={
          <>
            <Link to="imports" className="btn btn-ghost btn-sm">
              <ClockCounterClockwise size={16} className="mr-1.5" /> Import history
            </Link>
            <Button className="btn-ghost btn-sm" onClick={() => setImporting(true)}>
              <FileArrowUp size={16} className="mr-1.5" /> Import CSV
            </Button>
            <Button className="btn-primary btn-sm" onClick={() => setPanel({ type: 'create' })}>
              <Plus size={16} className="mr-1.5" /> New voucher
            </Button>
          </>
        }
      />

      <RejectedBanner rewards={rejected} onOpen={openReward} />

      {waitingBatches.length > 0 && (
        <div role="status" className="alert alert-info alert-soft mb-4 text-sm">
          <Stack size={18} aria-hidden />
          <span>
            {waitingBatches.length === 1
              ? `“${batchTitle(waitingBatches[0])}” has ${waitingDrafts} draft${waitingDrafts === 1 ? '' : 's'} waiting to go live.`
              : `${waitingBatches.length} imports have ${waitingDrafts} drafts waiting to go live.`}
          </span>
          <Link
            className="btn btn-ghost btn-xs"
            to={waitingBatches.length === 1 ? `imports/${waitingBatches[0].id}` : 'imports'}
          >
            Open
          </Link>
        </div>
      )}

      <FilterBar
        rewards={list.data ?? []}
        filters={filters}
        onChange={setFilters}
        onClear={clearFilters}
        end={
          <div role="radiogroup" aria-label="Display" className="join">
            {(
              [
                ['cards', 'Cards', SquaresFour],
                ['table', 'Table', Rows],
              ] as const
            ).map(([value, label, ViewIcon]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={view === value}
                title={label}
                onClick={() => chooseView(value)}
                className={cn('btn btn-sm join-item', view === value ? 'btn-active' : 'btn-ghost')}
              >
                <ViewIcon size={16} />
                <span className="sr-only">{label}</span>
              </button>
            ))}
          </div>
        }
      />

      {list.error ? (
        <ErrorState error={list.error} onRetry={() => void list.refetch()} />
      ) : !rewards ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy>
          {Array.from({ length: 6 }, (_, card) => (
            <div key={card} className="skeleton h-52 rounded-box" />
          ))}
        </div>
      ) : rewards.length === 0 ? (
        filtered ? (
          <EmptyState
            icon={Funnel}
            title="No vouchers match these filters"
            description={`None of your ${list.data?.length ?? 0} vouchers match. Change or clear the filters.`}
            action={
              <Button className="btn-sm" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Ticket}
            title="No vouchers yet"
            description="Create a voucher, or import several from a CSV file, then activate it for members."
          />
        )
      ) : view === 'cards' ? (
        <ul className="animate-reveal grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rewards.map((reward) => (
            <li key={reward.id}>
              <RewardCard
                reward={reward}
                permissions={permissionsOf(reward)}
                busy={busyWith === reward.id}
                highlighted={isFlashing(reward.id)}
                onIntent={onIntent}
              />
            </li>
          ))}
        </ul>
      ) : (
        <Table
          className="animate-reveal"
          data={rewards}
          columns={columns}
          highlightRow={(reward) => isFlashing(reward.id)}
          rowProps={(reward) => ({
            tabIndex: 0,
            className: 'cursor-pointer hover:bg-primary/5',
            onClick: () => openReward(reward),
            onKeyDown: (event) => {
              if (event.target !== event.currentTarget) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openReward(reward);
              }
            },
          })}
        />
      )}

      <RewardPanel open={panelOpen} mode={panel} onSaved={report} onClose={closePanel} />
      <RewardConfirm request={confirming} onDone={report} onClose={() => setConfirming(null)} />
      <AvailabilityDialog
        reward={editingAvailability}
        onDone={report}
        onClose={() => setEditingAvailability(null)}
      />
      <ImportDialog
        open={importing}
        onClose={() => setImporting(false)}
        onOpenBatch={(id) => navigate(`imports/${id}`)}
      />
    </>
  );
}
