import { useState } from 'react';
import { Info, Warning } from 'phosphor-react';
import type { VoucherRefundPolicyDto } from '@octap/internal-sdk';
import { FormField, Segmented, Switch, TextInput } from '@/components/shared/Controls';
import { ErrorState, LoadingBlock } from '@/components/shared/Display';
import {
  MAX_REFUND_WINDOW_DAYS,
  refundRuleChanges,
  refundWindowError,
  toRefundDraft,
  toRefundRules,
  type RefundDraft,
  type RefundRuleChange,
} from '../domain/refundPolicy';
import { usePublishRefundPolicy, useRefundPolicy } from '../hooks/useRefundPolicy';
import { PublishRefundPolicyDialog } from './PublishRefundPolicyDialog';
import { RefundPolicyHistory } from './RefundPolicyHistory';
import { SettingsForm } from './SettingsForms';

/** The Owner's refund policy: the current rules and every version published before them. */
export function RefundPolicySection() {
  const policy = useRefundPolicy();
  if (policy.isPending) return <LoadingBlock rows={4} />;
  if (policy.isError) return <ErrorState error={policy.error} onRetry={() => policy.refetch()} />;
  return (
    <div className="flex flex-col gap-4">
      <RefundPolicyForm policy={policy.data} />
      <RefundPolicyHistory />
    </div>
  );
}

function RefundPolicyForm({ policy }: { policy: VoucherRefundPolicyDto }) {
  const publish = usePublishRefundPolicy();
  const [base, setBase] = useState(policy);
  const [draft, setDraft] = useState(() => toRefundDraft(policy));
  const [review, setReview] = useState<RefundRuleChange[] | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [notice, setNotice] = useState('');
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // A new version arrived: start from it, and say so if it replaced edits that weren't this one.
  if (policy.version !== base.version) {
    const edited = toRefundRules(draft, base);
    const lostEdits =
      edited === null ||
      (refundRuleChanges(base, edited).length > 0 && refundRuleChanges(policy, edited).length > 0);
    setNotice(
      lostEdits
        ? `Another Owner published version ${policy.version}. Review it and make your changes again.`
        : '',
    );
    setBase(policy);
    setDraft(toRefundDraft(policy));
    setReview(null);
    setShowErrors(false);
  }

  const rules = toRefundRules(draft, base);
  const changes = rules ? refundRuleChanges(base, rules) : [];
  const dirty = rules === null || changes.length > 0;
  const windowError = refundWindowError(draft);
  const set = (next: Partial<RefundDraft>) => {
    setDraft((current) => ({ ...current, ...next }));
    setNotice('');
  };

  return (
    <>
      <SettingsForm
        dirty={dirty}
        busy={publish.isPending}
        savedAt={savedAt}
        submitLabel="Review and publish"
        onCancel={() => {
          setDraft(toRefundDraft(base));
          setShowErrors(false);
          setNotice('');
        }}
        onSubmit={(event) => {
          event.preventDefault();
          setShowErrors(true);
          if (rules && changes.length > 0) setReview(changes);
        }}
      >
        {notice && (
          <p role="status" className="alert alert-warning alert-soft text-sm">
            <Warning size={16} aria-hidden />
            {notice}
          </p>
        )}
        <p className="flex items-start gap-2 text-sm opacity-70">
          <Info size={18} className="mt-0.5 shrink-0" aria-hidden />
          These rules decide what your integration can refund through the API. Vouchers keep the
          version they were activated with.
        </p>

        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold">Which vouchers can be refunded</h3>
          <Switch
            label="Unused"
            description="Cancels the voucher and returns the customer's points."
            checked={draft.allowUnused}
            onCheckedChange={(allowUnused) => set({ allowUnused })}
          />
          <div className="ml-4 border-l border-base-300 pl-4">
            <Switch
              label="Return to stock"
              description="A refunded voucher can be claimed again. Off means each claim uses up the allocation for good."
              checked={draft.restockUnused}
              disabled={!draft.allowUnused}
              onCheckedChange={(restockUnused) => set({ restockUnused })}
            />
          </div>
          <Switch
            label="Expired"
            description="Returns the points. The voucher stays expired and never returns to stock."
            checked={draft.allowExpired}
            onCheckedChange={(allowExpired) => set({ allowExpired })}
          />
          <Switch
            label="Already used"
            description="For putting right a benefit delivered incorrectly. The voucher stays used."
            checked={draft.allowRedeemed}
            onCheckedChange={(allowRedeemed) => set({ allowRedeemed })}
          />
          {draft.allowRedeemed && (
            <p className="alert alert-warning alert-soft text-sm">
              <Warning size={16} aria-hidden />
              Customers can get their points back and keep the benefit they already received.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Refund window</h3>
          <Segmented
            value={draft.limited ? 'days' : 'none'}
            onValueChange={(value) => set({ limited: value === 'days' })}
            options={[
              { value: 'none', label: 'No limit' },
              { value: 'days', label: 'Limited' },
            ]}
          />
          {draft.limited && (
            <FormField
              label="Days after claiming"
              className="sm:max-w-xs"
              error={showErrors || draft.windowDays.trim() ? windowError : undefined}
              hint={`1 to ${MAX_REFUND_WINDOW_DAYS}. Refunds close when this many days have passed.`}
            >
              <TextInput
                value={draft.windowDays}
                inputMode="numeric"
                placeholder="e.g. 30"
                invalid={!!windowError && (showErrors || !!draft.windowDays.trim())}
                onChange={(event) => set({ windowDays: event.target.value })}
              />
            </FormField>
          )}
        </div>
      </SettingsForm>

      <PublishRefundPolicyDialog
        changes={review}
        allowsUsedRefunds={!base.allowRedeemed && draft.allowRedeemed}
        loading={publish.isPending}
        onClose={() => setReview(null)}
        onConfirm={(reason) => {
          if (!rules) return;
          publish.mutate(
            { baseVersion: base.version, rules, reason },
            {
              onSuccess: () => {
                setSavedAt(Date.now());
                setReview(null);
              },
            },
          );
        }}
      />
    </>
  );
}
