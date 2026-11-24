import { useState } from 'react';
import { Warning } from 'phosphor-react';
import { ConfirmDialog, useExitValue } from '@octap/shared/components';
import { FormField, TextInput } from '@/components/shared/Controls';
import type { RefundRuleChange } from '../domain/refundPolicy';

const MAX_REASON_LENGTH = 1000;

/**
 * Shows what will change and asks why, because every publish is a permanent version. Stays
 * mounted, so it animates in and out; `changes` opens it.
 */
export function PublishRefundPolicyDialog({
  changes,
  allowsUsedRefunds,
  loading,
  onConfirm,
  onClose,
}: {
  changes: RefundRuleChange[] | null;
  /** This publish turns on refunds for vouchers that were already used. */
  allowsUsedRefunds: boolean;
  loading: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const shown = useExitValue(changes);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [session, setSession] = useState(changes);
  if (changes !== session) {
    setSession(changes);
    if (changes) {
      setReason('');
      setError('');
    }
  }

  return (
    <ConfirmDialog
      open={!!changes}
      onOpenChange={(open) => !open && onClose()}
      title="Publish this refund policy?"
      description="It applies only to vouchers activated from now on. Existing vouchers, including claimed ones, keep their terms."
      confirmLabel="Publish"
      tone={allowsUsedRefunds ? 'warning' : 'primary'}
      loading={loading}
      onConfirm={() => {
        if (!reason.trim()) return setError('Add a reason for the version history.');
        onConfirm(reason.trim());
      }}
    >
      <dl className="rounded-box border border-base-300 px-3 py-2 text-sm">
        {shown?.map((change) => (
          <div key={change.label} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-1">
            <dt className="opacity-60">{change.label}</dt>
            <dd>
              <span className="opacity-60 line-through">{change.before}</span>
              <span className="block font-medium">{change.after}</span>
            </dd>
          </div>
        ))}
      </dl>
      {allowsUsedRefunds && (
        <p className="alert alert-warning alert-soft text-sm">
          <Warning size={16} aria-hidden />
          Customers can get their points back and keep the benefit they already received.
        </p>
      )}
      <FormField label="Reason" error={error} hint={`Up to ${MAX_REASON_LENGTH} characters.`}>
        <TextInput
          value={reason}
          maxLength={MAX_REASON_LENGTH}
          invalid={!!error}
          autoFocus
          onChange={(event) => {
            setReason(event.target.value);
            setError('');
          }}
        />
      </FormField>
    </ConfirmDialog>
  );
}
