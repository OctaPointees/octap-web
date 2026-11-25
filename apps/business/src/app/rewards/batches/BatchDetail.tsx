import { useState } from 'react';
import { ArrowLeft, Pause, Play } from 'phosphor-react';
import { Link, useParams } from 'react-router';
import type { VoucherBatchActionResult } from '@octap/internal-sdk';
import { Button, ConfirmDialog, notify } from '@octap/shared/components';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { ErrorState, LoadingBlock, PageHeader } from '@/components/shared/Display';
import { cn } from '@/utils/cn';
import { fmtDateTime, fmtNumber } from '@/utils/format';
import {
  batchActions,
  batchProgress,
  batchTitle,
  describeOutcome,
  describeProgress,
} from '../domain/batches';
import { describePoints } from '../domain/describe';
import { coreMessage } from '../domain/errors';
import { STAGES, stageOf } from '../domain/stage';
import { RewardPanel, type RewardPanelMode } from '../components/RewardPanel';
import { useBatch, useBatchAction, type BatchAction } from '../hooks/useBatches';
import { usePeople } from '../hooks/usePeople';
import { useRewardPermissions } from '../hooks/useRewards';

const plural = (n: number, word: string) => `${fmtNumber(n)} ${word}${n === 1 ? '' : 's'}`;
/** The verb that agrees with `n`: `verb(1, 'is', 'are')` is "is". */
const verb = (n: number, one: string, many: string) => (n === 1 ? one : many);

/**
 * One import batch (OCT-304): its vouchers, and what can be done to all of them at once. Buttons
 * follow OCT-59: an Owner's Activate all also approves what a Developer sent for approval; a
 * Developer whose organization requires approval submits the batch instead; only an Owner pauses.
 * An Owner's Activate all sends the vouchers as shown here, so one a Developer changed meanwhile
 * comes back "changed since you reviewed it" instead of going live unseen (OCT-324).
 */
export default function BatchDetailPage() {
  const { batchId = '' } = useParams();
  const { owner, organization } = useOrganization();
  const people = usePeople();
  const permissionsOf = useRewardPermissions();
  const detail = useBatch(batchId);
  const run = useBatchAction(batchId);
  const [confirming, setConfirming] = useState<BatchAction | null>(null);
  const [outcomes, setOutcomes] = useState<Record<string, VoucherBatchActionResult>>({});
  // The panel keeps its last mode while it slides away, so it closes with `panelOpen` only.
  const [panel, setPanel] = useState<RewardPanelMode | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const submits = !owner && organization.voucherApprovalRequired;

  const act = (action: BatchAction) =>
    run.mutate(action, {
      onSuccess: (response) => {
        setOutcomes(Object.fromEntries(response.vouchers.map((v) => [v.voucherId, v])));
        setConfirming(null);
        const done = response.vouchers.filter(
          (v) => v.outcome !== 'skipped' && v.outcome !== 'failed',
        ).length;
        const failed = response.vouchers.filter((v) => v.outcome === 'failed').length;
        const summary = {
          activate: submits ? 'sent for approval' : 'publishing',
          pause: 'paused',
          resume: 'resumed',
          archive: 'archived',
        }[action];
        const text = `${plural(done, 'voucher')} ${summary}`;
        if (failed)
          notify.error(new Error(`${plural(failed, 'voucher')} not done: see the list`), text);
        else notify.success(text);
      },
      onError: (error) => {
        setConfirming(null);
        notify.error(new Error(coreMessage(error)), 'Could not update the batch');
      },
    });

  if (detail.error)
    return (
      <>
        <BackLink />
        <ErrorState error={detail.error} onRetry={() => void detail.refetch()} />
      </>
    );
  if (!detail.data)
    return (
      <>
        <BackLink />
        <LoadingBlock rows={3} />
      </>
    );

  const batch = detail.data;
  const archived = Boolean(batch.archivedAt);
  const counts = batchActions(batch.vouchers);
  const progress = batchProgress(batch);
  // What Activate all sends: drafts, and for an Owner also what waits for their approval.
  const toActivate = counts.drafts + (owner ? counts.waiting : 0);
  const busy = run.isPending;
  const creator = people.actor(batch.createdBy)?.name ?? 'Someone no longer in the team';

  return (
    <>
      <BackLink />
      <PageHeader
        title={batchTitle(batch)}
        description={`${plural(progress.total, 'voucher')} · ${describeProgress(progress)} · ${
          batch.source === 'API' ? 'API' : 'Console'
        } · ${creator} · ${fmtDateTime(batch.createdAt)}`}
        actions={
          <>
            {!archived && (
              <Button
                className="btn-ghost btn-sm"
                disabled={busy}
                onClick={() => setConfirming('archive')}
              >
                Archive
              </Button>
            )}
            {owner && counts.resumable > 0 && (
              <Button
                className="btn-outline btn-sm"
                disabled={busy}
                onClick={() => setConfirming('resume')}
              >
                <Play size={16} className="mr-1.5" /> Resume all ({counts.resumable})
              </Button>
            )}
            {owner && counts.pausable > 0 && (
              <Button
                className="btn-outline btn-sm"
                disabled={busy}
                onClick={() => setConfirming('pause')}
              >
                <Pause size={16} className="mr-1.5" /> Pause all ({counts.pausable})
              </Button>
            )}
            {!archived && (
              <Button
                className="btn-primary btn-sm"
                disabled={busy || (submits ? counts.drafts : toActivate) === 0}
                title={toActivate === 0 ? 'Nothing left to activate in this batch' : undefined}
                onClick={() => setConfirming('activate')}
              >
                {submits
                  ? `Submit batch for approval (${counts.drafts})`
                  : `Activate all (${toActivate})`}
              </Button>
            )}
          </>
        }
      />
      {archived && (
        <p role="note" className="alert alert-soft mb-4 text-sm">
          Archived {fmtDateTime(batch.archivedAt!)}. Its drafts are frozen; import their codes again
          to use them. Live vouchers stay live.
        </p>
      )}
      {!submits && owner && counts.waiting > 0 && !archived && (
        <p role="status" className="alert alert-info alert-soft mb-4 text-sm">
          {plural(counts.waiting, 'voucher')} {verb(counts.waiting, 'waits', 'wait')} for your
          approval. Activate all approves and publishes them with the drafts.
        </p>
      )}
      <ul className="animate-reveal flex flex-col divide-y divide-base-300 rounded-box border border-base-300 bg-base-100">
        {batch.vouchers.map((voucher) => {
          const stage = stageOf(voucher);
          const last = outcomes[voucher.id];
          const editable = permissionsOf(voucher).edit;
          return (
            <li
              key={voucher.id}
              aria-label={voucher.title}
              className="flex flex-col gap-1 px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="w-28 shrink-0 truncate font-mono text-xs">{voucher.code}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{voucher.title}</span>
                <span className="w-24 text-right tabular-nums">
                  {describePoints(voucher.pointsCost)}
                </span>
                <span className={cn('badge badge-soft badge-sm', STAGES[stage].tone)}>
                  {stage === 'publishing' && (
                    <span className="loading loading-spinner loading-xs" />
                  )}
                  {STAGES[stage].label}
                </span>
                <Button
                  className="btn-ghost btn-xs"
                  onClick={() => {
                    setPanel({ type: editable ? 'edit' : 'view', reward: voucher });
                    setPanelOpen(true);
                  }}
                >
                  {editable ? 'Edit' : 'View'}
                </Button>
              </div>
              {last && last.outcome !== 'skipped' && (
                <p
                  className={cn('text-xs', last.outcome === 'failed' ? 'text-error' : 'opacity-70')}
                >
                  {last.outcome === 'failed' ? '✗ ' : ''}
                  {describeOutcome(last.outcome, last.reason)}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <RewardPanel
        open={panelOpen}
        mode={panel}
        onSaved={() => void detail.refetch()}
        onClose={() => setPanelOpen(false)}
      />
      <ConfirmDialog
        open={confirming === 'activate'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={
          submits
            ? `Submit ${plural(counts.drafts, 'voucher')}?`
            : `Activate ${plural(toActivate, 'voucher')}?`
        }
        description={
          submits
            ? 'An Owner checks them before they go live. Once approved, everything under “Locked” is published on-chain and can never change.'
            : 'Everything under “Locked” is published on-chain and can never change. Check the list once more.'
        }
        confirmLabel={submits ? 'Submit' : `Activate ${fmtNumber(toActivate)}`}
        loading={busy}
        onConfirm={() => act('activate')}
      >
        <ul className="flex flex-col gap-1 text-sm">
          <li>
            {plural(counts.drafts, 'draft')} will{' '}
            {submits ? 'wait for an Owner' : 'start publishing'}
          </li>
          {owner && counts.waiting > 0 && (
            <li>
              {plural(counts.waiting, 'voucher')} waiting for approval will be approved and
              published
            </li>
          )}
          {counts.live > 0 && (
            <li>
              {plural(counts.live, 'voucher')} already live {verb(counts.live, 'is', 'are')} skipped
            </li>
          )}
          {owner && (
            <li className="opacity-70">
              Only the vouchers as listed here go live: one changed by a teammate meanwhile is left
              out, so you can review it again.
            </li>
          )}
          {!submits && (
            <li className="opacity-70">
              Publishing runs a few at a time: the whole batch takes a few minutes.
            </li>
          )}
        </ul>
      </ConfirmDialog>
      <ConfirmDialog
        open={confirming === 'archive'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Archive this import?"
        description="It can no longer be activated, and there is no undo."
        confirmLabel="Archive"
        tone="error"
        loading={busy}
        onConfirm={() => act('archive')}
      >
        <ul className="flex flex-col gap-1 text-sm">
          {counts.drafts > 0 && (
            <li>
              Its {plural(counts.drafts, 'draft')} {verb(counts.drafts, 'is', 'are')} frozen.
            </li>
          )}
          {counts.waiting > 0 && (
            <li>
              Its {plural(counts.waiting, 'voucher')} waiting for approval{' '}
              {verb(counts.waiting, 'is', 'are')} withdrawn.
            </li>
          )}
          {counts.live > 0 && (
            <li>
              Its {plural(counts.live, 'live voucher')} {verb(counts.live, 'stays', 'stay')} live:
              use Pause all to stop claims.
            </li>
          )}
          <li className="opacity-70">
            To use these codes later, import them again: the drafts come back, not duplicated.
          </li>
        </ul>
      </ConfirmDialog>
      <ConfirmDialog
        open={confirming === 'pause'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={`Pause ${plural(counts.pausable, 'voucher')}?`}
        description="Members can't claim them until you resume. Vouchers already claimed stay usable. Drafts are not touched."
        confirmLabel="Pause"
        tone="warning"
        loading={busy}
        onConfirm={() => act('pause')}
      />
      <ConfirmDialog
        open={confirming === 'resume'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={`Resume ${plural(counts.resumable, 'voucher')}?`}
        description="Members can claim them again."
        confirmLabel="Resume"
        loading={busy}
        onConfirm={() => act('resume')}
      />
    </>
  );
}

function BackLink() {
  return (
    <Link to=".." relative="path" className="link mt-6 inline-flex items-center gap-1 text-sm">
      <ArrowLeft /> Import history
    </Link>
  );
}
