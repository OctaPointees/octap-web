import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pause, Play } from 'phosphor-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import type { VoucherBatchActionResponse, VoucherBatchOutcome } from '@octap/services';
import { useAuth } from '@octap/shared/authentication';
import { ConsoleApiError } from '@octap/shared/console-api';
import { ConfirmDialog } from '@octap/shared/components';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { organizationKeys } from '@/app/organization/utils';
import { Button } from '@/components/shared/Button';
import { ErrorState, LoadingBlock, PageHeader } from '@/components/shared/Display';
import { cn } from '@/utils/cn';
import { fmtNumber } from '@/utils/format';
import { notify } from '@/utils/toast';
import { batchesApi } from './api';
import {
  batchActions,
  batchProgress,
  batchTitle,
  describeOutcome,
  describeProgress,
  formatWhen,
} from './batches';
import { stageOf } from './benefit';
import { coreErrors } from './errors';
import RewardForm, { type RewardFormMode } from './RewardForm';
import { STAGES } from './stages';
import { useCreatorName } from './useCreatorName';

type Action = 'activate' | 'pause' | 'resume' | 'archive';

/** While rewards publish, the worker writes their terms on-chain a few at a time: check every 3 s. */
const PUBLISH_POLL_MS = 3000;

const plural = (n: number, word: string) => `${fmtNumber(n)} ${word}${n === 1 ? '' : 's'}`;
/** The verb that agrees with `n`: `verb(1, 'is', 'are')` is "is". */
const verb = (n: number, one: string, many: string) => (n === 1 ? one : many);

/**
 * One import batch (OCT-304): its rewards, and what can be done to all of them at once. Buttons
 * follow OCT-59: an Owner's Activate all also approves what a Developer sent for approval; a
 * Developer whose organization requires approval submits the batch instead; only an Owner pauses.
 */
export default function BatchDetail() {
  const { batchId = '' } = useParams();
  const auth = useAuth();
  const { organizationId, owner, organization: current } = useOrganization();
  const cache = useQueryClient();
  const creator = useCreatorName();
  const organization = useQuery({
    queryKey: organizationKeys.detail(organizationId),
    queryFn: ({ signal }) => auth.client().getConsoleOrganization(organizationId, signal),
    initialData: current,
    staleTime: 0,
  });
  const approvalRequired = organization.data?.voucherApprovalRequired ?? false;
  const submits = !owner && approvalRequired;

  const key = ['console-voucher-batch', organizationId, batchId];
  const detail = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => batchesApi(auth).get(organizationId, batchId, signal),
    refetchInterval: (query) =>
      query.state.data?.vouchers.some((v) => v.publishStatus === 'PUBLISHING')
        ? PUBLISH_POLL_MS
        : false,
  });
  const [confirming, setConfirming] = useState<Action | null>(null);
  const [form, setForm] = useState<RewardFormMode | null>(null);
  const [outcomes, setOutcomes] = useState<
    Record<string, { outcome: VoucherBatchOutcome; reason: string | null }>
  >({});

  const run = useMutation({
    mutationFn: (action: Action) => batchesApi(auth)[action](organizationId, batchId),
    onSuccess: (response: VoucherBatchActionResponse, action) => {
      setOutcomes(
        Object.fromEntries(
          response.vouchers.map((v) => [v.voucherId, { outcome: v.outcome, reason: v.reason }]),
        ),
      );
      setConfirming(null);
      refresh();
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
      const text = `${plural(done, 'reward')} ${summary}`;
      if (failed)
        notify.error(new Error(`${plural(failed, 'reward')} not done: see the list`), text);
      else notify.success(text);
    },
    onError: (error) => {
      // The approval setting may have changed under us: read it again so the buttons follow.
      if (error instanceof ConsoleApiError && (error.status === 403 || error.status === 409))
        void organization.refetch();
      setConfirming(null);
      notify.error(
        new Error(Object.values(coreErrors(error))[0] ?? String(error)),
        'Could not update the batch',
      );
    },
  });
  const refresh = () => {
    void cache.invalidateQueries({ queryKey: key });
    void cache.invalidateQueries({ queryKey: ['console-voucher-batches', organizationId] });
    void cache.invalidateQueries({ queryKey: ['console-rewards', organizationId] });
  };

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
  // What Activate all sends: drafts, and for an Owner also what waits for their approval.
  const toActivate = counts.drafts + (owner ? counts.waiting : 0);
  const activateLabel = submits
    ? `Submit batch for approval (${counts.drafts})`
    : `Activate all (${toActivate})`;
  const busy = run.isPending;

  return (
    <>
      <BackLink />
      <PageHeader
        title={batchTitle(batch)}
        description={`${plural(batchProgress(batch).total, 'reward')} · ${describeProgress(
          batchProgress(batch),
        )} · ${batch.source === 'API' ? 'API' : 'Console'} · ${creator(batch)} · ${formatWhen(
          batch.createdAt,
        )}`}
        actions={
          <>
            {!archived && (
              <Button
                className="btn-ghost"
                disabled={busy}
                onClick={() => setConfirming('archive')}
              >
                Archive
              </Button>
            )}
            {owner && counts.resumable > 0 && (
              <Button
                className="btn-outline"
                disabled={busy}
                onClick={() => setConfirming('resume')}
              >
                <Play /> Resume all ({counts.resumable})
              </Button>
            )}
            {owner && counts.pausable > 0 && (
              <Button
                className="btn-outline"
                disabled={busy}
                onClick={() => setConfirming('pause')}
              >
                <Pause /> Pause all ({counts.pausable})
              </Button>
            )}
            {!archived && (
              <Button
                className="btn-primary"
                disabled={busy || (submits ? counts.drafts : toActivate) === 0}
                title={toActivate === 0 ? 'Nothing left to activate in this batch' : undefined}
                onClick={() => setConfirming('activate')}
              >
                {activateLabel}
              </Button>
            )}
          </>
        }
      />
      {archived && (
        <p role="note" className="alert alert-soft mb-4 text-sm">
          Archived {formatWhen(batch.archivedAt!)}. Its drafts are frozen; import their codes again
          to use them. Live rewards stay live.
        </p>
      )}
      {!submits && owner && counts.waiting > 0 && !archived && (
        <p role="status" className="alert alert-info alert-soft mb-4 text-sm">
          {plural(counts.waiting, 'reward')} {verb(counts.waiting, 'waits', 'wait')} for your
          approval. Activate all approves and publishes them with the drafts.
        </p>
      )}
      <ul className="flex flex-col divide-y divide-base-300 rounded-box border border-base-300 bg-base-100">
        {batch.vouchers.map((voucher) => {
          const stage = stageOf(voucher);
          const last = outcomes[voucher.id];
          const editable = stage === 'draft' || stage === 'failed';
          return (
            <li
              key={voucher.id}
              aria-label={voucher.title}
              className="flex flex-col gap-1 px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="w-28 shrink-0 font-mono text-xs">{voucher.code}</span>
                <span className="min-w-0 flex-1 font-medium">{voucher.title}</span>
                <span className="w-20 text-right tabular-nums">
                  {fmtNumber(voucher.pointsCost)} pts
                </span>
                <span className={cn('badge badge-soft badge-sm', STAGES[stage].tone)}>
                  {stage === 'publishing' && (
                    <span className="loading loading-spinner loading-xs" />
                  )}
                  {STAGES[stage].label}
                </span>
                <Button
                  className="btn-ghost btn-xs"
                  onClick={() => setForm({ kind: 'edit', voucher, readOnly: !editable })}
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

      {form && (
        <RewardForm
          key={form.kind === 'edit' ? form.voucher.id : 'new'}
          mode={form}
          onClose={() => {
            setForm(null);
            refresh();
          }}
        />
      )}
      <ConfirmDialog
        open={confirming === 'activate'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={
          submits
            ? `Submit ${plural(counts.drafts, 'reward')}?`
            : `Activate ${plural(toActivate, 'reward')}?`
        }
        description={
          submits
            ? 'An Owner checks them before they go live. Once approved, everything under “Locked” is published on-chain and can never change.'
            : 'Everything under “Locked” is published on-chain and can never change. Check the list once more.'
        }
        confirmLabel={submits ? 'Submit' : `Activate ${fmtNumber(toActivate)}`}
        loading={busy}
        onConfirm={() => run.mutate('activate')}
      >
        <ul className="flex flex-col gap-1 text-sm">
          <li>
            {plural(counts.drafts, 'draft')} will{' '}
            {submits ? 'wait for an Owner' : 'start publishing'}
          </li>
          {owner && counts.waiting > 0 && (
            <li>
              {plural(counts.waiting, 'reward')} waiting for approval will be approved and published
            </li>
          )}
          {counts.live > 0 && (
            <li>
              {plural(counts.live, 'reward')} already live {verb(counts.live, 'is', 'are')} skipped
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
        onConfirm={() => run.mutate('archive')}
      >
        <ul className="flex flex-col gap-1 text-sm">
          {counts.drafts > 0 && (
            <li>
              Its {plural(counts.drafts, 'draft')} {verb(counts.drafts, 'is', 'are')} frozen.
            </li>
          )}
          {counts.waiting > 0 && (
            <li>
              Its {plural(counts.waiting, 'reward')} waiting for approval{' '}
              {verb(counts.waiting, 'is', 'are')} withdrawn.
            </li>
          )}
          {counts.live > 0 && (
            <li>
              Its {plural(counts.live, 'live reward')} {verb(counts.live, 'stays', 'stay')} live:
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
        title={`Pause ${plural(counts.pausable, 'reward')}?`}
        description="Members can't claim them until you resume. Vouchers already claimed stay usable. Drafts are not touched."
        confirmLabel="Pause"
        tone="warning"
        loading={busy}
        onConfirm={() => run.mutate('pause')}
      />
      <ConfirmDialog
        open={confirming === 'resume'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={`Resume ${plural(counts.resumable, 'reward')}?`}
        description="Members can claim them again."
        confirmLabel="Resume"
        loading={busy}
        onConfirm={() => run.mutate('resume')}
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
