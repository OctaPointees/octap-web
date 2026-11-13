import { Form } from '@base-ui/react/form';
import { useMutation } from '@tanstack/react-query';
import { Info, LockSimple } from 'phosphor-react';
import { useState } from 'react';
import {
  useConsoleAuth,
  type ConsoleVoucher,
  type ConsoleVoucherInput,
} from '@octap/shared/google-auth';
import { Button } from '@/components/shared/Button';
import { FormField, TextInput } from '@/components/shared/Controls';
import { Modal } from '@/components/shared/Modal';
import { cn } from '@/utils/cn';
import { fmtDate, fmtNumber } from '@/utils/format';
import { notify } from '@/utils/toast';
import {
  BENEFIT_KINDS,
  TEMPLATES,
  describeBenefit,
  emptyDraft,
  fromVoucher,
  isLocked,
  suggestCode,
  toVoucherInput,
  type BenefitKind,
  type DraftErrors,
  type DraftField,
  type RewardDraft,
} from './benefit';
import { coreErrors } from './errors';

/** Kinds stored only in `terms`: Core cannot clear an existing `discountType` on a draft. */
const TERMS_ONLY: BenefitKind[] = ['BUY_X_GET_Y', 'FREE_SHIPPING', 'FIXED_PRICE', 'CUSTOM'];

export type RewardFormMode =
  | { kind: 'create'; from?: ConsoleVoucher }
  | { kind: 'edit'; voucher: ConsoleVoucher; readOnly: boolean };

export default function RewardForm({
  mode,
  onClose,
}: {
  mode: RewardFormMode;
  onClose: () => void;
}) {
  const auth = useConsoleAuth()!;
  const orgId = auth.organizationId;
  const editing = mode.kind === 'edit' ? mode.voucher : undefined;
  const locked = editing ? isLocked(editing) : false;
  const readOnly = mode.kind === 'edit' && mode.readOnly;
  const [draft, setDraft] = useState<RewardDraft>(() => {
    if (editing) return fromVoucher(editing);
    if (mode.kind === 'create' && mode.from) {
      const copy = fromVoucher(mode.from);
      return { ...copy, code: `${copy.code.slice(0, 76)}-2`, startsOn: '', expiresOn: '' };
    }
    return emptyDraft();
  });
  const [codeTouched, setCodeTouched] = useState(
    Boolean(editing || (mode.kind === 'create' && mode.from)),
  );
  const [localErrors, setLocalErrors] = useState<DraftErrors>({});

  const save = useMutation({
    mutationFn: (input: ConsoleVoucherInput) => {
      const client = auth.client();
      if (!editing) return client.createConsoleVoucher(orgId, input);
      // A published reward keeps its promise; only its supply can change.
      if (locked)
        return client.updateConsoleVoucher(orgId, editing.id, { totalSupply: input.totalSupply });
      return client.updateConsoleVoucher(orgId, editing.id, {
        ...input,
        description: input.description ?? '',
        discountValue: input.discountValue ?? null,
      });
    },
    onSuccess: (saved) => {
      notify.success(editing ? 'Reward saved' : 'Draft saved', saved.title);
      onClose();
    },
  });
  const errors: DraftErrors = { ...localErrors, ...coreErrors(save.error) };

  const set = <K extends DraftField>(key: K, value: RewardDraft[K]) => {
    setDraft((current) => {
      const next = { ...current, [key]: value };
      if (key === 'title' && !codeTouched) next.code = suggestCode(String(value));
      return next;
    });
    setLocalErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  };
  const applyTemplate = (template: Partial<RewardDraft>) => {
    const next = { ...emptyDraft(), ...template, pointsCost: draft.pointsCost };
    if (!codeTouched) next.code = suggestCode(next.title);
    setDraft(next);
    setLocalErrors({});
    save.reset();
  };
  const disabled = readOnly || locked;
  const field = (key: DraftField) => ({
    value: draft[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => set(key, event.target.value as never),
    invalid: Boolean(errors[key]),
    disabled,
  });
  const kindDisabled = (kind: BenefitKind) =>
    disabled || Boolean(editing?.discountType && TERMS_ONLY.includes(kind));
  const showValue = draft.kind === 'PERCENT_OFF' || draft.kind === 'AMOUNT_OFF';
  const showItem = ['FREE_ITEM', 'BUY_X_GET_Y', 'FIXED_PRICE'].includes(draft.kind);

  const title = readOnly
    ? 'Reward details'
    : editing
      ? locked
        ? 'Change supply'
        : 'Edit draft'
      : mode.kind === 'create' && mode.from
        ? 'Duplicate reward'
        : 'New reward';

  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title={title}
      description={
        locked
          ? 'Published rewards keep their terms on-chain. Only the number available can change.'
          : 'Rewards are saved as drafts. Activate one when it is ready.'
      }
      size="xl"
      footer={
        readOnly ? (
          <Button className="btn-ghost" onClick={onClose}>
            Close
          </Button>
        ) : (
          <>
            <Button className="btn-ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="reward-form"
              className="btn-primary"
              disabled={save.isPending}
            >
              {save.isPending && <span className="loading loading-spinner loading-sm" />}
              {editing ? 'Save' : 'Save as draft'}
            </Button>
          </>
        )
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <Form
          id="reward-form"
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const { input, errors: found } = toVoucherInput(draft);
            setLocalErrors(found);
            save.reset();
            if (input) save.mutate(input);
          }}
        >
          {errors.form && (
            <p role="alert" className="alert alert-error alert-soft text-sm sm:col-span-2">
              {errors.form}
            </p>
          )}
          {!editing && (
            <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
              <span className="text-xs opacity-60">Start from:</span>
              {TEMPLATES.map((template) => (
                <Button
                  key={template.id}
                  className="btn-outline btn-xs"
                  onClick={() => applyTemplate(template.draft)}
                >
                  {template.label}
                </Button>
              ))}
            </div>
          )}
          <fieldset className="sm:col-span-2" disabled={disabled}>
            <legend className="mb-2 text-sm font-medium">Reward type</legend>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {BENEFIT_KINDS.map(({ kind, label, hint }) => (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={draft.kind === kind}
                  disabled={kindDisabled(kind)}
                  title={
                    kindDisabled(kind) && !disabled
                      ? 'This draft has a discount type Core cannot remove; create a new reward instead.'
                      : hint
                  }
                  onClick={() => set('kind', kind)}
                  className={cn(
                    'rounded-box border p-2 text-left text-sm disabled:opacity-40',
                    draft.kind === kind ? 'border-primary bg-primary/10' : 'border-base-300',
                  )}
                >
                  <span className="font-medium">{label}</span>
                  <span className="block text-xs opacity-60">{hint}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <FormField label="Title" error={errors.title} className="sm:col-span-2">
            <TextInput {...field('title')} placeholder="e.g. Free signature drink" />
          </FormField>
          <FormField
            label="Code"
            error={errors.code}
            hint="Part of every voucher's serial code. Unique in your organization."
          >
            <TextInput
              {...field('code')}
              disabled={disabled || Boolean(editing)}
              onChange={(event) => {
                setCodeTouched(true);
                set('code', event.target.value.toUpperCase());
              }}
            />
          </FormField>
          <FormField
            label="Points to claim"
            error={errors.pointsCost}
            hint="0 makes it free to claim."
          >
            <TextInput {...field('pointsCost')} inputMode="numeric" placeholder="e.g. 500" />
          </FormField>
          {showValue && (
            <FormField
              label={draft.kind === 'PERCENT_OFF' ? 'Percent off' : 'Amount off (VND)'}
              error={errors.value}
            >
              <TextInput {...field('value')} inputMode="decimal" />
            </FormField>
          )}
          {(draft.kind === 'PERCENT_OFF' || draft.kind === 'FREE_SHIPPING') && (
            <FormField label="Up to (VND)" error={errors.maxDiscountVnd} hint="Optional cap.">
              <TextInput {...field('maxDiscountVnd')} inputMode="numeric" />
            </FormField>
          )}
          {showItem && (
            <FormField
              label={draft.kind === 'FIXED_PRICE' ? 'What the price is for' : 'Item'}
              error={errors.item}
            >
              <TextInput {...field('item')} placeholder="e.g. Latte, size M" />
            </FormField>
          )}
          {draft.kind === 'BUY_X_GET_Y' && (
            <>
              <FormField label="Buy" error={errors.buyQuantity}>
                <TextInput {...field('buyQuantity')} inputMode="numeric" />
              </FormField>
              <FormField label="Get free" error={errors.getQuantity}>
                <TextInput {...field('getQuantity')} inputMode="numeric" />
              </FormField>
            </>
          )}
          {draft.kind === 'FIXED_PRICE' && (
            <FormField label="Special price (VND)" error={errors.priceVnd}>
              <TextInput {...field('priceVnd')} inputMode="numeric" />
            </FormField>
          )}
          {draft.kind === 'CUSTOM' && (
            <FormField
              label="What the customer gets"
              error={errors.benefit}
              className="sm:col-span-2"
            >
              <TextInput {...field('benefit')} placeholder="e.g. One 60-minute spa treatment" />
            </FormField>
          )}
          <FormField label="Minimum order (VND)" error={errors.minOrderVnd} hint="Optional.">
            <TextInput {...field('minOrderVnd')} inputMode="numeric" />
          </FormField>
          <FormField label="Applies to" error={errors.appliesTo} hint="Optional, e.g. drinks only.">
            <TextInput {...field('appliesTo')} />
          </FormField>
          <FormField
            label="Number available"
            error={errors.totalSupply}
            hint={
              editing && editing.claimedCount > 0
                ? `${fmtNumber(editing.claimedCount)} already claimed. Leave empty for unlimited.`
                : 'Leave empty for unlimited.'
            }
          >
            <TextInput
              {...field('totalSupply')}
              disabled={readOnly}
              inputMode="numeric"
              placeholder="Unlimited"
            />
          </FormField>
          <FormField label="Starts on" error={errors.startsOn} hint="Optional.">
            <TextInput {...field('startsOn')} type="date" />
          </FormField>
          <FormField
            label="Expires on"
            error={errors.expiresOn}
            hint="Must be at least a day away when you activate it."
          >
            <TextInput {...field('expiresOn')} type="date" />
          </FormField>
          <FormField label="Description" error={errors.description} className="sm:col-span-2">
            <textarea
              className={cn('textarea w-full', errors.description && 'textarea-error')}
              rows={2}
              value={draft.description}
              disabled={disabled}
              onChange={(event) => set('description', event.target.value)}
            />
          </FormField>
          {!readOnly && (
            <div className="alert alert-info alert-soft text-xs sm:col-span-2">
              {locked ? <LockSimple size={16} /> : <Info size={16} />}
              {locked
                ? 'Title, type, points, conditions and dates are frozen on-chain. To change them, duplicate this reward.'
                : 'When you activate a reward, its title, description, type and conditions are published on-chain for good. Do not include personal information.'}
            </div>
          )}
        </Form>
        <aside aria-label="Preview" className="flex flex-col gap-2">
          <span className="text-xs font-medium opacity-60">What customers will see</span>
          <div className="flex flex-col gap-2 rounded-box border border-base-300 bg-base-200 p-4">
            <h3 className="font-semibold">{draft.title || 'Reward title'}</h3>
            <p className="text-sm">{describeBenefit(draft)}</p>
            <p className="text-2xl font-bold">
              {draft.pointsCost ? fmtNumber(Number(draft.pointsCost) || 0) : '…'}{' '}
              <span className="text-sm font-normal opacity-60">points</span>
            </p>
            <p className="text-xs opacity-60">
              {draft.totalSupply
                ? `${fmtNumber(Number(draft.totalSupply) || 0)} available`
                : 'Unlimited'}
              {draft.expiresOn && ` · until ${fmtDate(`${draft.expiresOn}T23:59:59`)}`}
            </p>
            {draft.description && <p className="text-xs opacity-70">{draft.description}</p>}
          </div>
        </aside>
      </div>
    </Modal>
  );
}
