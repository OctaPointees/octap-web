import { useState, type ReactNode } from 'react';
import { LockSimple, PencilSimple } from 'phosphor-react';
import { Button, ConfirmDialog, Modal, useExitValue } from '@octap/shared/components';
import { FormField, TextInput } from '@/components/shared/Controls';
import { UsageBar } from '@/components/shared/Display';
import { describeRefundRules } from '@/app/settings/domain/refundPolicy';
import { useRefundPolicy } from '@/app/settings/hooks/useRefundPolicy';
import { fmtNumber, fmtVnd } from '@/utils/format';
import {
  describeClaimDates,
  describeOffer,
  describePoints,
  describeSupply,
  describeValidity,
} from '../domain/describe';
import { fromReward, type Reward } from '../domain/draft';
import { KINDS } from '../domain/kinds';
import { useRewardAction, useRewardAvailability, type RewardReport } from '../hooks/useRewards';
import { SubmittedBy } from './RejectionNotice';

export type RewardConfirmRequest = {
  action: 'activate' | 'submit' | 'approve' | 'pause' | 'reject';
  reward: Reward;
};

const ACTIVATION =
  "Check the details below. Once it's published on-chain, the locked ones can never change.";

/**
 * Asks before the steps that need a second look: activating, submitting or approving, pausing,
 * rejecting.
 * Stays mounted, so it animates in and out; `request` opens it.
 */
export function RewardConfirm({
  request,
  onDone,
  onClose,
}: {
  request: RewardConfirmRequest | null;
  onDone: RewardReport;
  onClose: () => void;
}) {
  const run = useRewardAction(onDone);
  const shown = useExitValue(request);
  const [reason, setReason] = useState('');
  const [session, setSession] = useState(request);
  if (request !== session) {
    setSession(request);
    if (request) setReason('');
  }
  const action = shown?.action ?? 'activate';
  const reward = shown?.reward;
  const copies: Record<
    RewardConfirmRequest['action'],
    {
      title: string;
      description: string;
      confirmLabel: string;
      tone: 'primary' | 'warning' | 'error';
    }
  > = {
    activate: {
      title: 'Activate this voucher?',
      description: ACTIVATION,
      confirmLabel: 'Activate',
      tone: 'primary',
    },
    submit: {
      title: 'Submit for approval?',
      description:
        "The Owner reviews these details. Once they approve, it's published on-chain and the locked ones can never change.",
      confirmLabel: 'Submit',
      tone: 'primary',
    },
    approve: {
      title: 'Approve and activate?',
      description: ACTIVATION,
      confirmLabel: 'Approve',
      tone: 'primary',
    },
    pause: {
      title: 'Pause this voucher?',
      description: `Members can't claim "${reward?.title ?? 'this voucher'}" until you resume it. Those already claimed keep working.`,
      confirmLabel: 'Pause',
      tone: 'warning',
    },
    reject: {
      title: 'Send this voucher back to draft?',
      description:
        'Whoever submitted it sees your reason and can change it before submitting again.',
      confirmLabel: 'Reject',
      tone: 'error',
    },
  };

  return (
    <ConfirmDialog
      open={!!request}
      onOpenChange={(open) => !open && onClose()}
      {...copies[action]}
      loading={run.isPending}
      onConfirm={() => {
        if (!reward || (action === 'reject' && !reason.trim())) return;
        run.mutate({ reward, action, reason: reason.trim() }, { onSuccess: onClose });
      }}
    >
      {(action === 'approve' || action === 'reject') && reward && (
        <SubmittedBy reward={reward} className="text-sm" />
      )}
      {action === 'reject' && (
        <FormField label="Reason" hint="1 to 500 characters.">
          <TextInput
            value={reason}
            maxLength={500}
            autoFocus
            onChange={(event) => setReason(event.target.value)}
          />
        </FormField>
      )}
      {(action === 'activate' || action === 'submit' || action === 'approve') && reward && (
        <ActivationSummary reward={reward} />
      )}
    </ConfirmDialog>
  );
}

/** One labelled fact in the activation summary. */
function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 py-1">
      <dt className="opacity-60">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}

/**
 * The refund rules this reward will lock in. Only the Owner can read the policy, so a Developer
 * sees where the terms come from instead.
 */
function RefundSummaryRows() {
  const { data: policy } = useRefundPolicy();
  if (!policy) return <SummaryRow label="Refunds">Current refund policy</SummaryRow>;
  return describeRefundRules(policy).map((row) => (
    <SummaryRow key={row.label} label={row.label}>
      {row.value}
    </SummaryRow>
  ));
}

/** What activating freezes on-chain, and what the Owner can still change afterwards. */
function ActivationSummary({ reward }: { reward: Reward }) {
  const draft = fromReward(reward);
  const { icon: KindIcon, label: kindLabel } = KINDS[draft.kind];

  return (
    <div className="min-h-0 overflow-y-auto rounded-box border border-base-300 text-sm">
      <header className="flex items-center gap-3 bg-base-200/50 p-3">
        <span
          title={kindLabel}
          className="flex size-10 shrink-0 items-center justify-center rounded-field bg-primary/10 text-primary"
        >
          <KindIcon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold" title={reward.title}>
            {reward.title}
          </p>
          <p className="truncate font-mono text-xs opacity-60">{reward.code}</p>
        </div>
        <span className="shrink-0 font-semibold tabular-nums">
          {describePoints(reward.pointsCost)}
        </span>
      </header>

      <section className="border-t border-base-300 px-3 py-2.5">
        <h3 className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
          <LockSimple size={14} weight="fill" className="text-warning" aria-hidden />
          Locked once published
        </h3>
        <dl>
          <SummaryRow label="Offer">{describeOffer(draft)}</SummaryRow>
          {draft.minOrderVnd && (
            <SummaryRow label="Minimum order">{fmtVnd(Number(draft.minOrderVnd))}</SummaryRow>
          )}
          {draft.appliesTo && <SummaryRow label="Applies to">{draft.appliesTo}</SummaryRow>}
          {draft.description && (
            <SummaryRow label="Description">
              <span className="line-clamp-3">{draft.description}</span>
            </SummaryRow>
          )}
          <SummaryRow label="Claims">{describeClaimDates(draft)}</SummaryRow>
          <SummaryRow label="Validity">{describeValidity(draft)}</SummaryRow>
          <RefundSummaryRows />
        </dl>
      </section>

      <section className="border-t border-base-300 px-3 py-2.5">
        <h3 className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
          <PencilSimple size={14} className="text-success" aria-hidden />
          Can change later
        </h3>
        <dl>
          <SummaryRow label="Available">
            {reward.totalSupply == null ? 'Unlimited' : fmtNumber(reward.totalSupply)}
          </SummaryRow>
          <SummaryRow label="Per member">
            {reward.perMemberLimit == null
              ? 'No limit'
              : `Up to ${fmtNumber(reward.perMemberLimit)}`}
          </SummaryRow>
        </dl>
      </section>
    </div>
  );
}

const QUICK_ADD = [10, 50, 100];

const asText = (value: number | null | undefined) => (value == null ? '' : String(value));

/**
 * Changes how many of a published reward are left, and how many one member may hold. Stays
 * mounted, so it animates in and out; `reward` opens it.
 */
export function AvailabilityDialog({
  reward: requested,
  onDone,
  onClose,
}: {
  reward: Reward | null;
  onDone: RewardReport;
  onClose: () => void;
}) {
  const reward = useExitValue(requested);
  const save = useRewardAvailability(onDone);
  const [supply, setSupply] = useState(asText(requested?.totalSupply));
  const [limit, setLimit] = useState(asText(requested?.perMemberLimit));
  const [session, setSession] = useState(requested);
  if (requested !== session) {
    setSession(requested);
    if (requested) {
      setSupply(asText(requested.totalSupply));
      setLimit(asText(requested.perMemberLimit));
    }
  }
  const claimed = reward?.claimedCount ?? 0;
  const supplyNumber = supply.trim() ? Number(supply) : null;
  const limitNumber = limit.trim() ? Number(limit) : null;
  const supplyError =
    supply.trim() && !(Number.isInteger(supplyNumber) && supplyNumber! >= claimed)
      ? `A whole number, at least the ${fmtNumber(claimed)} already claimed`
      : undefined;
  const limitError =
    limit.trim() && !(Number.isInteger(limitNumber) && limitNumber! > 0)
      ? 'A positive whole number, or empty for no limit'
      : undefined;

  return (
    <Modal
      open={!!requested}
      onOpenChange={(open) => !open && onClose()}
      title="Edit availability"
      description={reward?.title}
      size="sm"
      footer={
        <>
          <Button className="btn-ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="btn-primary"
            disabled={!!supplyError || !!limitError}
            loading={save.isPending}
            onClick={() =>
              reward &&
              save.mutate(
                { reward, totalSupply: supplyNumber, perMemberLimit: limitNumber },
                { onSuccess: onClose },
              )
            }
          >
            Save
          </Button>
        </>
      }
    >
      {reward && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <p className="text-sm">{describeSupply(reward)}</p>
            {reward.totalSupply != null && (
              <UsageBar value={reward.claimedCount} max={reward.totalSupply} />
            )}
          </div>
          <FormField label="Number available" error={supplyError} hint="Empty for unlimited.">
            <TextInput
              value={supply}
              inputMode="numeric"
              placeholder="Unlimited"
              invalid={!!supplyError}
              onChange={(event) => setSupply(event.target.value)}
            />
          </FormField>
          <div className="-mt-3 flex gap-2">
            {QUICK_ADD.map((add) => (
              <Button
                key={add}
                className="btn-xs btn-outline min-w-0 font-normal"
                onClick={() => setSupply(String((supplyNumber ?? claimed) + add))}
              >
                +{add}
              </Button>
            ))}
          </div>
          <FormField
            label="Per-member limit"
            error={limitError}
            hint="Used vouchers count, cancelled ones don't."
          >
            <TextInput
              value={limit}
              inputMode="numeric"
              placeholder="No limit"
              invalid={!!limitError}
              onChange={(event) => setLimit(event.target.value)}
            />
          </FormField>
        </div>
      )}
    </Modal>
  );
}
