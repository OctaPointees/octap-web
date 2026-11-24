import { useMemo, useState } from 'react';
import { FileArrowUp, Plus, Rows, SquaresFour, Ticket } from 'phosphor-react';
import { useSearchParams } from 'react-router';
import { useAuth } from '@octap/shared/authentication';
import { Button, createColumnHelper, notify, Table, useRowFlash } from '@octap/shared/components';
import { Segmented } from '@/components/shared/Controls';
import { EmptyState, ErrorState, PageHeader } from '@/components/shared/Display';
import { cn } from '@/utils/cn';
import { fmtDate } from '@/utils/format';
import { describePoints } from './domain/describe';
import { duplicateOf, fromReward, type Reward } from './domain/draft';
import { KINDS } from './domain/kinds';
import { FILTER_OF, FILTERS, rejectedFor, STAGES, stageOf, type Filter } from './domain/stage';
import {
  useRewardAction,
  useRewardPermissions,
  useRewards,
  type RewardReport,
} from './hooks/useRewards';
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
 * The organization's reward catalog, as cards or as a table, filtered by stage. Opening a reward
 * shows it in a side panel: editable while it is a draft, read-only once it is published.
 */
export default function RewardsPage() {
  const list = useRewards();
  const permissionsOf = useRewardPermissions();
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<View>(savedView);
  const { flashRow, isFlashing } = useRowFlash();
  // The tint shows the result. If the current filter hides that reward, a toast says it instead.
  const report: RewardReport = (saved, message) => {
    flashRow(saved.id);
    if (filter !== 'all' && FILTER_OF[stageOf(saved)] !== filter)
      notify.success(message, saved.title);
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

  const counts: Record<Filter, number> = {
    all: 0,
    drafts: 0,
    awaiting: 0,
    live: 0,
    paused: 0,
    ended: 0,
  };
  for (const reward of list.data ?? []) {
    counts.all += 1;
    counts[FILTER_OF[stageOf(reward)]] += 1;
  }
  const rewards = list.data?.filter(
    (reward) => filter === 'all' || FILTER_OF[stageOf(reward)] === filter,
  );

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
        enableColumnFilter: true,
      }),
      column.accessor((reward) => STAGES[stageOf(reward)].label, {
        id: 'stage',
        header: 'Stage',
        size: 160,
        enableColumnFilter: true,
        cell: ({ row }) => {
          const stage = stageOf(row.original);
          return (
            <span className={cn('badge badge-soft badge-sm', STAGES[stage].tone)}>
              {stage === 'publishing' && <span className="loading loading-spinner loading-xs" />}
              {STAGES[stage].label}
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
    [busyWith, permissionsOf],
  );

  return (
    <>
      <PageHeader
        title="Vouchers"
        description="What members can claim with their points. Drafts stay private until they are activated."
        actions={
          <>
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={filter}
          onValueChange={setFilter}
          options={FILTERS.map(({ value, label }) => ({
            value,
            label: (
              <>
                {label}
                <span className="text-xs opacity-70 tabular-nums">{counts[value]}</span>
              </>
            ),
          }))}
        />
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
      </div>

      {list.error ? (
        <ErrorState error={list.error} onRetry={() => void list.refetch()} />
      ) : !rewards ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy>
          {Array.from({ length: 6 }, (_, card) => (
            <div key={card} className="skeleton h-52 rounded-box" />
          ))}
        </div>
      ) : rewards.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title={FILTERS.find((f) => f.value === filter)!.empty}
          description={
            filter === 'all'
              ? 'Create a voucher, or import several from a CSV file, then activate it for members.'
              : 'Vouchers move here as their stage changes.'
          }
        />
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
      <ImportDialog open={importing} onClose={() => setImporting(false)} />
    </>
  );
}
