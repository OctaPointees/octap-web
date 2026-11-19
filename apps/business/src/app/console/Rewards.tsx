import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, FileArrowUp, PencilSimple, Plus, Ticket, Warning } from 'phosphor-react';
import { useState } from 'react';
import type { ConsoleVoucher } from '@octap/services';
import { useConsoleAuth } from '@octap/shared/google-auth';
import { Button } from '@/components/shared/Button';
import { FormField, Segmented, TextInput } from '@/components/shared/Controls';
import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  UsageBar,
} from '@/components/shared/Display';
import { ConfirmDialog, Modal } from '@/components/shared/Modal';
import { cn } from '@/utils/cn';
import { fmtNumber } from '@/utils/format';
import { notify } from '@/utils/toast';
import { rewardsApi } from './rewards/api';
import {
  availabilityPatch,
  claimsClosed,
  describeBenefit,
  describeClaimWindow,
  describeMemberLimit,
  describeValidity,
  fromVoucher,
  rejectionOf,
  remainingLabel,
  stageOf,
  type Stage,
} from './rewards/benefit';
import ImportRewards from './rewards/ImportRewards';
import { coreErrors } from './rewards/errors';
import { KIND_ICONS } from './rewards/kindIcons';
import RewardForm, { type RewardFormMode } from './rewards/RewardForm';

const STAGES: Record<Stage, { label: string; tone: string }> = {
  draft: { label: 'Draft', tone: 'badge-ghost' },
  pending: { label: 'Pending approval', tone: 'badge-secondary' },
  publishing: { label: 'Publishing…', tone: 'badge-info' },
  failed: { label: 'Publish failed', tone: 'badge-error' },
  scheduled: { label: 'Scheduled', tone: 'badge-info' },
  live: { label: 'Live', tone: 'badge-success' },
  claims_closed: { label: 'Claims closed', tone: 'badge-neutral' },
  paused: { label: 'Paused', tone: 'badge-warning' },
  sold_out: { label: 'Sold out', tone: 'badge-neutral' },
};

type Filter = 'all' | 'draft' | 'pending' | 'live' | 'paused' | 'sold_out';
const FILTERS: { label: string; value: Filter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Drafts', value: 'draft' },
  { label: 'Pending approval', value: 'pending' },
  { label: 'Live', value: 'live' },
  { label: 'Paused', value: 'paused' },
  { label: 'Sold out', value: 'sold_out' },
];
/** Publishing and failed rewards are still drafts; scheduled and closed ones are published. */
const FILTER_OF: Record<Stage, Filter> = {
  draft: 'draft',
  pending: 'pending',
  publishing: 'draft',
  failed: 'draft',
  scheduled: 'live',
  live: 'live',
  claims_closed: 'live',
  paused: 'paused',
  sold_out: 'sold_out',
};
const PUBLISHED: Stage[] = ['scheduled', 'live', 'claims_closed', 'paused', 'sold_out'];

/** While a reward is publishing, the worker is writing its terms on-chain: check back every 3 s. */
const PUBLISH_POLL_MS = 3000;

/** What a reward waiting for approval, or rejected, can have done to it (OCT-59). */
type Decision =
  | { action: 'submit' | 'withdraw' | 'approve'; voucher: ConsoleVoucher }
  | { action: 'reject'; voucher: ConsoleVoucher; reason: string };

const DECIDED: Record<Decision['action'], string> = {
  submit: 'Sent for approval',
  withdraw: 'Back to draft',
  approve: 'Approved: publishing on-chain',
  reject: 'Rejected: back to draft',
};

export default function ConnectedRewards() {
  const auth = useConsoleAuth()!;
  const orgId = auth.organizationId;
  const owner = auth.owner;
  // Owners never need approval. A Business Developer does when the organization asks for it.
  const approvalRequired = auth.data.organization?.voucherApprovalRequired ?? false;
  const publishesDirectly = owner || !approvalRequired;
  const cache = useQueryClient();
  const key = ['console-rewards', orgId];
  const [filter, setFilter] = useState<Filter>('all');
  const [form, setForm] = useState<RewardFormMode | null>(null);
  const [activating, setActivating] = useState<ConsoleVoucher | null>(null);
  const [submitting, setSubmitting] = useState<ConsoleVoucher | null>(null);
  const [reviewing, setReviewing] = useState<ConsoleVoucher | null>(null);
  const [pausing, setPausing] = useState<ConsoleVoucher | null>(null);
  const [availability, setAvailability] = useState<ConsoleVoucher | null>(null);
  const [importing, setImporting] = useState(false);

  const list = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => rewardsApi(auth).list(orgId, signal),
    refetchInterval: (query) =>
      query.state.data?.some((v) => v.publishStatus === 'PUBLISHING') ? PUBLISH_POLL_MS : false,
  });
  const setStatus = useMutation({
    mutationFn: ({ voucher, status }: { voucher: ConsoleVoucher; status: 'ACTIVE' | 'PAUSED' }) =>
      rewardsApi(auth).update(orgId, voucher.id, { status }),
    onSuccess: (voucher) => {
      void cache.invalidateQueries({ queryKey: key });
      const stage = stageOf(voucher);
      notify.success(
        stage === 'publishing'
          ? 'Publishing on-chain'
          : stage === 'paused'
            ? 'Reward paused'
            : stage === 'live'
              ? 'Reward is live'
              : `Reward resumed: ${STAGES[stage].label}`,
        voucher.title,
      );
      setActivating(null);
      setPausing(null);
    },
    onError: (error) =>
      notify.error(
        new Error(Object.values(coreErrors(error))[0] ?? String(error)),
        'Could not update the reward',
      ),
  });

  const decide = useMutation({
    mutationFn: (decision: Decision) => {
      const api = rewardsApi(auth);
      const { voucher } = decision;
      if (decision.action === 'reject') return api.reject(orgId, voucher.id, decision.reason);
      return api[decision.action](orgId, voucher.id);
    },
    onSuccess: (voucher, decision) => {
      void cache.invalidateQueries({ queryKey: key });
      notify.success(DECIDED[decision.action], voucher.title);
      setSubmitting(null);
      setReviewing(null);
    },
    onError: (error) =>
      notify.error(
        new Error(Object.values(coreErrors(error))[0] ?? String(error)),
        'Could not update the reward',
      ),
  });
  // Only an Owner may list the team, so a Business Developer reads "an Owner" instead of a name.
  const staff = useQuery({
    queryKey: ['console-staff', orgId],
    queryFn: ({ signal }) => auth.client().listConsoleStaff(orgId, signal),
    enabled: owner,
  });
  const me = auth.identity?.user.id;
  const nameOf = (userId: string | null, fallback: string) =>
    userId && userId === me
      ? 'you'
      : (staff.data?.find((person) => person.id === userId)?.fullName ?? fallback);
  const submitterOf = (voucher: ConsoleVoucher) => {
    const by = voucher.approval?.submittedBy;
    if (!by) return 'someone no longer in the team';
    return by.type === 'API_CREDENTIAL' ? 'an API key' : nameOf(by.id, 'a Business Developer');
  };

  const counts = { all: 0, draft: 0, pending: 0, live: 0, paused: 0, sold_out: 0 } as Record<
    Filter,
    number
  >;
  for (const voucher of list.data ?? []) {
    counts.all += 1;
    counts[FILTER_OF[stageOf(voucher)]] += 1;
  }
  const failed = list.data?.filter((voucher) => stageOf(voucher) === 'failed') ?? [];
  const rows = list.data?.filter(
    (voucher) => filter === 'all' || FILTER_OF[stageOf(voucher)] === filter,
  );
  const refresh = () => void cache.invalidateQueries({ queryKey: key });
  const close = () => {
    setForm(null);
    refresh();
  };

  return (
    <>
      <PageHeader
        title="Rewards"
        description={
          publishesDirectly
            ? 'Vouchers your members claim with points. Drafts stay private until you activate them.'
            : 'Vouchers your members claim with points. Drafts stay private until an Owner approves them.'
        }
        actions={
          <div className="flex gap-2">
            <Button className="btn-outline" onClick={() => setImporting(true)}>
              <FileArrowUp /> Import CSV
            </Button>
            <Button className="btn-primary" onClick={() => setForm({ kind: 'create' })}>
              <Plus /> New reward
            </Button>
          </div>
        }
      />
      {failed.length > 0 && (
        <div role="status" className="alert alert-error alert-soft text-sm">
          <Warning size={18} />
          <span>
            {failed.length === 1
              ? `“${failed[0].title}” could not be published.`
              : `${failed.length} rewards could not be published.`}{' '}
            Retry from {failed.length === 1 ? 'its card' : 'their cards'} under Drafts.
          </span>
        </div>
      )}
      <Segmented
        value={filter}
        onValueChange={setFilter}
        // The approval tab shows while approval is on, and while rewards still wait after it is off.
        options={FILTERS.filter(
          ({ value }) => value !== 'pending' || approvalRequired || counts.pending > 0,
        ).map(({ label, value }) => ({
          value,
          label: list.data ? `${label} (${counts[value]})` : label,
        }))}
      />
      {list.error && <ErrorState error={list.error} onRetry={() => void list.refetch()} />}
      {list.isPending && <LoadingBlock rows={2} />}
      {rows && rows.length === 0 && (
        <EmptyState
          icon={Ticket}
          title={list.data?.length ? 'No rewards in this view' : 'No rewards yet'}
          description="Create a reward, start from a template, or import a CSV."
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows?.map((voucher) => {
          const stage = stageOf(voucher);
          const draft = fromVoucher(voucher);
          const KindIcon = KIND_ICONS[draft.kind];
          const busy = setStatus.isPending && setStatus.variables?.voucher.id === voucher.id;
          const published = PUBLISHED.includes(stage);
          // Core refuses to reopen a reward whose claims have closed, so a sold-out one stays so.
          const closed = claimsClosed(voucher);
          const view = () => setForm({ kind: 'edit', voucher, readOnly: true });
          const rejection = rejectionOf(voucher);
          const deciding = decide.isPending && decide.variables?.voucher.id === voucher.id;
          return (
            <article
              key={voucher.id}
              aria-label={voucher.title}
              className="flex flex-col gap-3 rounded-box border border-base-300 bg-base-100 p-5"
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 rounded-box bg-primary/10 p-2.5 text-primary">
                  <KindIcon size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm opacity-70">{voucher.title}</h3>
                  <p className="font-semibold leading-snug">{describeBenefit(draft)}</p>
                </div>
                <span className={cn('badge badge-soft badge-sm shrink-0', STAGES[stage].tone)}>
                  {stage === 'publishing' && (
                    <span className="loading loading-spinner loading-xs" />
                  )}
                  {STAGES[stage].label}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span>
                  <span className="text-2xl font-bold">{fmtNumber(voucher.pointsCost)}</span>{' '}
                  <span className="text-sm opacity-60">points</span>
                </span>
                <span className="font-mono text-xs opacity-50">{voucher.code}</span>
              </div>
              <div className="flex flex-col gap-1 text-xs">
                {voucher.totalSupply !== null && (
                  <UsageBar value={voucher.claimedCount} max={voucher.totalSupply} />
                )}
                <p className="opacity-70">
                  {remainingLabel(voucher)}
                  {voucher.perMemberLimit !== null &&
                    ` · ${describeMemberLimit(draft).toLowerCase()}`}
                </p>
                <p>{describeValidity(draft)}</p>
                <p className="opacity-60">{describeClaimWindow(draft)}</p>
              </div>
              {stage === 'pending' && (
                <p className="text-xs opacity-70">
                  Submitted by {submitterOf(voucher)}. An Owner approves it before it goes live.
                </p>
              )}
              {rejection && (
                <p role="note" className="alert alert-warning alert-soft text-xs">
                  <span>
                    <span className="font-semibold">
                      Rejected by {nameOf(rejection.reviewedById, 'an Owner')}:
                    </span>{' '}
                    {rejection.reason}
                  </span>
                </p>
              )}
              <div className="mt-auto flex flex-wrap items-center justify-end gap-1 border-t border-base-300 pt-3">
                {stage === 'publishing' ? (
                  <Button className="btn-ghost btn-xs" onClick={view}>
                    View
                  </Button>
                ) : (
                  <>
                    {(stage === 'draft' || stage === 'failed') && (
                      <>
                        <Button
                          className="btn-ghost btn-xs"
                          onClick={() => setForm({ kind: 'edit', voucher, readOnly: false })}
                        >
                          <PencilSimple /> Edit
                        </Button>
                        {publishesDirectly ? (
                          <Button
                            className="btn-primary btn-xs"
                            disabled={busy}
                            onClick={() => setActivating(voucher)}
                          >
                            {stage === 'failed' ? 'Retry publish' : 'Activate'}
                          </Button>
                        ) : (
                          <Button
                            className="btn-primary btn-xs"
                            disabled={deciding}
                            onClick={() => setSubmitting(voucher)}
                          >
                            Submit for approval
                          </Button>
                        )}
                      </>
                    )}
                    {stage === 'pending' &&
                      (owner ? (
                        <>
                          <Button className="btn-ghost btn-xs" onClick={view}>
                            View
                          </Button>
                          <Button
                            className="btn-primary btn-xs"
                            onClick={() => setReviewing(voucher)}
                          >
                            Review
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button className="btn-ghost btn-xs" onClick={view}>
                            View
                          </Button>
                          <Button
                            className="btn-ghost btn-xs"
                            disabled={deciding}
                            onClick={() => decide.mutate({ action: 'withdraw', voucher })}
                          >
                            Withdraw to draft
                          </Button>
                        </>
                      ))}
                    {published && !owner && (
                      <Button className="btn-ghost btn-xs" onClick={view}>
                        View
                      </Button>
                    )}
                    {published && owner && (
                      <>
                        {stage === 'paused' ? (
                          <Button
                            className="btn-ghost btn-xs"
                            disabled={busy}
                            onClick={() => setStatus.mutate({ voucher, status: 'ACTIVE' })}
                          >
                            Resume
                          </Button>
                        ) : (
                          stage !== 'sold_out' && (
                            <Button
                              className="btn-ghost btn-xs"
                              disabled={busy}
                              onClick={() => setPausing(voucher)}
                            >
                              Pause
                            </Button>
                          )
                        )}
                        {!(stage === 'sold_out' && closed) && (
                          <Button
                            className={cn(
                              'btn-xs',
                              stage === 'sold_out' ? 'btn-primary' : 'btn-ghost',
                            )}
                            onClick={() => setAvailability(voucher)}
                          >
                            {stage === 'sold_out' ? 'Restock' : 'Edit availability'}
                          </Button>
                        )}
                        <Button className="btn-ghost btn-xs" onClick={view}>
                          View
                        </Button>
                      </>
                    )}
                    <Button
                      className="btn-ghost btn-xs"
                      aria-label={`Duplicate ${voucher.title}`}
                      onClick={() => setForm({ kind: 'create', from: voucher })}
                    >
                      <Copy />
                    </Button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {form && (
        <RewardForm
          key={
            form.kind === 'edit' ? `edit-${form.voucher.id}` : `create-${form.from?.id ?? 'new'}`
          }
          mode={form}
          onClose={close}
        />
      )}
      {importing && (
        <ImportRewards
          onClose={() => {
            setImporting(false);
            refresh();
          }}
        />
      )}
      {availability && (
        <AvailabilityDialog
          voucher={availability}
          onClose={() => {
            setAvailability(null);
            refresh();
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(activating)}
        onOpenChange={(open) => !open && setActivating(null)}
        title={
          activating?.publishStatus === 'FAILED' ? 'Retry publishing?' : 'Activate this reward?'
        }
        description="Check it once more: everything under “Locked” is published on-chain and can never change. To change it later, create a new reward. Members can claim it once publishing finishes."
        confirmLabel={activating?.publishStatus === 'FAILED' ? 'Retry' : 'Activate'}
        loading={setStatus.isPending}
        onConfirm={() => activating && setStatus.mutate({ voucher: activating, status: 'ACTIVE' })}
      >
        {activating && <ActivationSummary voucher={activating} />}
      </ConfirmDialog>
      <ConfirmDialog
        open={Boolean(submitting)}
        onOpenChange={(open) => !open && setSubmitting(null)}
        title="Submit for approval?"
        description="An Owner checks it before it goes live. Once approved, everything under “Locked” is published on-chain and can never change. It can't be edited while it waits: withdraw it to draft to change it."
        confirmLabel="Submit"
        loading={decide.isPending}
        onConfirm={() => submitting && decide.mutate({ action: 'submit', voucher: submitting })}
      >
        {submitting && <ActivationSummary voucher={submitting} />}
      </ConfirmDialog>
      {reviewing && (
        <ReviewDialog
          voucher={reviewing}
          submitter={submitterOf(reviewing)}
          busy={decide.isPending}
          onClose={() => setReviewing(null)}
          onApprove={() => decide.mutate({ action: 'approve', voucher: reviewing })}
          onReject={(reason) => decide.mutate({ action: 'reject', voucher: reviewing, reason })}
        />
      )}
      <ConfirmDialog
        open={Boolean(pausing)}
        onOpenChange={(open) => !open && setPausing(null)}
        title="Pause this reward?"
        description="Members can't claim it any more. Vouchers already claimed stay usable until they expire. You can resume it at any time."
        confirmLabel="Pause"
        tone="warning"
        loading={setStatus.isPending}
        onConfirm={() => pausing && setStatus.mutate({ voucher: pausing, status: 'PAUSED' })}
      />
    </>
  );
}

/** Everything activation freezes, so a typo (5,000,000 for 50,000) is caught before it is permanent. */
function ActivationSummary({ voucher }: { voucher: ConsoleVoucher }) {
  const draft = fromVoucher(voucher);
  const row = (label: string, value: string) => (
    <div className="grid grid-cols-[7rem_1fr] gap-2">
      <dt className="opacity-60">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
  return (
    <div className="flex flex-col gap-3 text-sm">
      <section aria-label="Locked" className="rounded-box border border-warning/40 p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase opacity-70">Locked</h3>
        <dl className="flex flex-col gap-1.5">
          {row('Reward', voucher.title)}
          {row('Code', voucher.code)}
          {row('Offer', describeBenefit(draft))}
          {voucher.description && row('Description', voucher.description)}
          {row('Points', `${fmtNumber(voucher.pointsCost)} points`)}
          {row('Claims', describeClaimWindow(draft))}
          {row('Validity', describeValidity(draft))}
        </dl>
      </section>
      <section aria-label="Editable later" className="rounded-box border border-base-300 p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase opacity-70">Editable later</h3>
        <dl className="flex flex-col gap-1.5">
          {row(
            'Available',
            voucher.totalSupply === null ? 'Unlimited' : fmtNumber(voucher.totalSupply),
          )}
          {row('Per member', describeMemberLimit(draft))}
        </dl>
      </section>
    </div>
  );
}

const REASON_MAX = 500;

/**
 * An Owner's look at a reward waiting for approval: everything approving freezes on-chain, then
 * approve (publishing starts, as activating does) or reject with a reason the submitter reads.
 */
function ReviewDialog({
  voucher,
  submitter,
  busy,
  onClose,
  onApprove,
  onReject,
}: {
  voucher: ConsoleVoucher;
  submitter: string;
  busy: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();
  const tooLong = trimmed.length > REASON_MAX;
  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title={rejecting ? 'Reject this reward?' : 'Review reward'}
      description={`${voucher.title} · submitted by ${submitter}`}
      footer={
        rejecting ? (
          <>
            <Button className="btn-ghost" onClick={() => setRejecting(false)}>
              Back
            </Button>
            <Button
              className="btn-error"
              disabled={busy || !trimmed || tooLong}
              onClick={() => onReject(trimmed)}
            >
              {busy && <span className="loading loading-spinner loading-sm" />}
              Reject
            </Button>
          </>
        ) : (
          <>
            <Button className="btn-ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button className="btn-outline btn-error" onClick={() => setRejecting(true)}>
              Reject
            </Button>
            <Button className="btn-primary" disabled={busy} onClick={onApprove}>
              {busy && <span className="loading loading-spinner loading-sm" />}
              Approve and publish
            </Button>
          </>
        )
      }
    >
      {rejecting ? (
        <label className="flex flex-col gap-1 text-sm font-medium">
          Reason
          <textarea
            className={cn('textarea w-full font-normal', tooLong && 'textarea-error')}
            rows={4}
            value={reason}
            aria-invalid={tooLong || undefined}
            placeholder="e.g. The cap is too high: make it 50.000 ₫"
            onChange={(event) => setReason(event.target.value)}
          />
          <span className={cn('text-xs font-normal', tooLong ? 'text-error' : 'opacity-60')}>
            The submitter sees this on the reward, back in Drafts. {trimmed.length}/{REASON_MAX}
          </span>
        </label>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm opacity-75">
            Approving publishes it on-chain: everything under “Locked” can never change.
          </p>
          <ActivationSummary voucher={voucher} />
        </div>
      )}
    </Modal>
  );
}

const QUICK_ADD = [10, 50, 100];

/**
 * What a published reward can still change: the number available and the per-member limit.
 * It reads the reward again when it opens, so a total changed elsewhere is never overwritten
 * with an old one, and reopens a sold-out reward that has room again.
 */
function AvailabilityDialog({
  voucher,
  onClose,
}: {
  voucher: ConsoleVoucher;
  onClose: () => void;
}) {
  const auth = useConsoleAuth()!;
  const orgId = auth.organizationId;
  const current = useQuery({
    queryKey: ['console-reward', orgId, voucher.id],
    queryFn: ({ signal }) => rewardsApi(auth).get(orgId, voucher.id, signal),
    staleTime: 0,
  });
  const fresh = current.data;
  const [edits, setEdits] = useState<{ total?: string; limit?: string }>({});
  const total = edits.total ?? (fresh?.totalSupply == null ? '' : String(fresh.totalSupply));
  const limit = edits.limit ?? (fresh?.perMemberLimit == null ? '' : String(fresh.perMemberLimit));

  const save = useMutation({
    mutationFn: async () => {
      const api = rewardsApi(auth);
      // Decide on reopening from the reward as it is now, not as the dialog first read it.
      const latest = await api.get(orgId, voucher.id);
      return api.update(
        orgId,
        voucher.id,
        availabilityPatch(
          latest,
          total.trim() ? Number(total) : null,
          limit.trim() ? Number(limit) : null,
        ),
      );
    },
    onSuccess: (saved) => {
      notify.success(
        'Availability saved',
        saved.totalSupply === null ? 'Unlimited' : `${fmtNumber(saved.totalSupply)} in total`,
      );
      onClose();
    },
  });
  const whole = (value: string) => /^\d+$/.test(value.trim()) && Number(value) > 0;
  const claimed = fresh?.claimedCount ?? voucher.claimedCount;
  const totalError =
    total.trim() && !whole(total)
      ? 'Enter a positive whole number, or leave empty for unlimited'
      : total.trim() && Number(total) < claimed
        ? `At least ${fmtNumber(claimed)}: that many are already claimed`
        : undefined;
  const limitError =
    limit.trim() && !whole(limit)
      ? 'Enter a positive whole number, or leave empty for no limit'
      : undefined;
  const fromCore = coreErrors(save.error);
  // Core can refuse for a field this dialog doesn't show (claims close within 24 h): show it here.
  const { totalSupply: coreTotal, perMemberLimit: coreLimit, ...otherCore } = fromCore;
  const coreOther = Object.values(otherCore).find(Boolean);
  const soldOut = (fresh ?? voucher).status === 'DEPLETED';
  const edit = (next: { total?: string; limit?: string }) => {
    setEdits((value) => ({ ...value, ...next }));
    save.reset();
  };

  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title={soldOut ? 'Restock reward' : 'Edit availability'}
      description={voucher.title}
      size="sm"
      footer={
        <>
          <Button className="btn-ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="btn-primary"
            disabled={!fresh || Boolean(totalError || limitError) || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending && <span className="loading loading-spinner loading-sm" />}
            Save
          </Button>
        </>
      }
    >
      {current.error ? (
        <ErrorState error={current.error} onRetry={() => void current.refetch()} />
      ) : !fresh ? (
        <LoadingBlock rows={2} />
      ) : (
        <div className="flex flex-col gap-4">
          {coreOther && (
            <p role="alert" className="alert alert-error alert-soft text-sm">
              {coreOther}
            </p>
          )}
          {soldOut && (
            <p className="alert alert-warning alert-soft text-sm">
              Sold out. A number above {fmtNumber(claimed)} reopens claims.
            </p>
          )}
          <FormField
            label="Number available"
            error={totalError ?? coreTotal}
            hint={`${remainingLabel(fresh)}. Empty = unlimited.`}
          >
            <TextInput
              value={total}
              inputMode="numeric"
              placeholder="Unlimited"
              invalid={Boolean(totalError ?? coreTotal)}
              onChange={(event) => edit({ total: event.target.value })}
            />
          </FormField>
          <div className="-mt-2 flex gap-1.5">
            {QUICK_ADD.map((add) => (
              <Button
                key={add}
                className="btn-outline btn-xs"
                onClick={() =>
                  edit({ total: String((whole(total) ? Number(total) : claimed) + add) })
                }
              >
                +{add}
              </Button>
            ))}
          </div>
          <FormField
            label="Per-member limit"
            error={limitError ?? coreLimit}
            hint="Empty = no limit. Lowering it only stops new claims."
          >
            <TextInput
              value={limit}
              inputMode="numeric"
              placeholder="No limit"
              invalid={Boolean(limitError ?? coreLimit)}
              onChange={(event) => edit({ limit: event.target.value })}
            />
          </FormField>
        </div>
      )}
    </Modal>
  );
}
