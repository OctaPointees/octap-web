import { Form } from '@base-ui/react/form';
import { useMutation } from '@tanstack/react-query';
import { Info, LockSimple, PencilSimple } from 'phosphor-react';
import { useState, type ReactNode } from 'react';
import { MAX_VALID_FOR_DAYS, type ConsoleVoucher, type ConsoleVoucherInput } from '@octap/services';
import { useConsoleAuth } from '@octap/shared/google-auth';
import { Button } from '@/components/shared/Button';
import { FormField, TextInput } from '@/components/shared/Controls';
import { Modal } from '@/components/shared/Modal';
import { cn } from '@/utils/cn';
import { fmtNumber } from '@/utils/format';
import { notify } from '@/utils/toast';
import { rewardsApi } from './api';
import {
  BENEFIT_KINDS,
  TEMPLATES,
  describeBenefit,
  describeMemberLimit,
  describeValidity,
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

/**
 * One group of the form. `frozen` groups are published on-chain when the reward is activated and
 * never change; the other group stays editable, so the merchant sees which is which before saving.
 */
function Group({
  title,
  frozen,
  children,
}: {
  title: string;
  frozen: boolean;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="grid gap-4 rounded-box border border-base-300 p-4 sm:col-span-2 sm:grid-cols-2"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span
          className={cn(
            'badge badge-soft badge-sm gap-1',
            frozen ? 'badge-warning' : 'badge-success',
          )}
        >
          {frozen ? <LockSimple size={12} /> : <PencilSimple size={12} />}
          {frozen ? 'Locked when activated' : 'Editable after activation'}
        </span>
      </header>
      {children}
    </section>
  );
}

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
      // The validity rule and the per-member limit still fit a copy; absolute dates do not.
      const copy = fromVoucher(mode.from);
      return { ...copy, code: `${copy.code.slice(0, 76)}-2`, startsOn: '', closesOn: '' };
    }
    return emptyDraft();
  });
  const [codeTouched, setCodeTouched] = useState(
    Boolean(editing || (mode.kind === 'create' && mode.from)),
  );
  const [localErrors, setLocalErrors] = useState<DraftErrors>({});

  const save = useMutation({
    mutationFn: (input: ConsoleVoucherInput) => {
      const api = rewardsApi(auth);
      if (!editing) return api.create(orgId, input);
      // A published reward keeps its promise; only supply and the per-member limit can change.
      if (locked)
        return api.update(orgId, editing.id, {
          totalSupply: input.totalSupply,
          perMemberLimit: input.perMemberLimit,
        });
      return api.update(orgId, editing.id, {
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
  const field = (key: DraftField, isDisabled = disabled) => ({
    value: draft[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => set(key, event.target.value as never),
    invalid: Boolean(errors[key]),
    disabled: isDisabled,
  });
  const kindDisabled = (kind: BenefitKind) =>
    disabled || Boolean(editing?.discountType && TERMS_ONLY.includes(kind));
  const showValue = draft.kind === 'PERCENT_OFF' || draft.kind === 'AMOUNT_OFF';
  const showItem = ['FREE_ITEM', 'BUY_X_GET_Y', 'FIXED_PRICE'].includes(draft.kind);
  const byDays = draft.expiry === 'days';

  const title = readOnly
    ? 'Reward details'
    : editing
      ? locked
        ? 'Change availability'
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
          ? 'Published rewards keep their terms on-chain. Only the number available and the per-member limit can change.'
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

          <Group title="Offer" frozen>
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
              className="sm:col-span-2"
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
            <FormField
              label="Applies to"
              error={errors.appliesTo}
              hint="Optional, e.g. drinks only."
            >
              <TextInput {...field('appliesTo')} />
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
          </Group>

          <Group title="Price and validity" frozen>
            <FormField
              label="Points to claim"
              error={errors.pointsCost}
              hint="0 makes it free to claim."
              className="sm:col-span-2"
            >
              <TextInput {...field('pointsCost')} inputMode="numeric" placeholder="e.g. 500" />
            </FormField>
            <FormField label="Claims open on" error={errors.startsOn} hint="Optional.">
              <TextInput {...field('startsOn')} type="date" />
            </FormField>
            <FormField
              label="Claims close on"
              error={errors.closesOn}
              hint={
                byDays
                  ? 'Optional: leave empty to keep claims open. No voucher can be used after this day.'
                  : 'Optional. Every voucher expires at the end of this day. At least a day away when you activate it.'
              }
            >
              <TextInput {...field('closesOn')} type="date" />
            </FormField>
            <fieldset className="flex flex-col gap-2 sm:col-span-2" disabled={disabled}>
              <legend className="mb-1 text-sm font-medium">How long a voucher can be used</legend>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  className="radio radio-sm"
                  name="expiry"
                  checked={!byDays}
                  onChange={() => set('expiry', 'closes')}
                />
                Until claims close
              </label>
              <label className="flex flex-wrap items-center gap-2 text-sm">
                <input
                  type="radio"
                  className="radio radio-sm"
                  name="expiry"
                  checked={byDays}
                  onChange={() => set('expiry', 'days')}
                />
                For a number of days after each member claims it
              </label>
              {byDays && (
                <FormField
                  label="Days after claiming"
                  error={errors.validForDays}
                  hint={`1 to ${fmtNumber(MAX_VALID_FOR_DAYS)} days, never past the day claims close.`}
                >
                  <TextInput {...field('validForDays')} inputMode="numeric" placeholder="e.g. 14" />
                </FormField>
              )}
            </fieldset>
          </Group>

          <Group title="Availability" frozen={false}>
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
                {...field('totalSupply', readOnly)}
                inputMode="numeric"
                placeholder="Unlimited"
              />
            </FormField>
            <FormField
              label="Per-member limit"
              error={errors.perMemberLimit}
              hint={
                locked
                  ? 'Leave empty for no limit. Used vouchers count, cancelled ones do not. Lowering it only stops new claims.'
                  : 'Leave empty for no limit. Used vouchers count, cancelled ones do not.'
              }
            >
              <TextInput
                {...field('perMemberLimit', readOnly)}
                inputMode="numeric"
                placeholder="No limit"
              />
            </FormField>
          </Group>

          {!readOnly && (
            <div className="alert alert-info alert-soft text-xs sm:col-span-2">
              {locked ? <LockSimple size={16} /> : <Info size={16} />}
              {locked
                ? 'The offer, points, dates and validity are frozen on-chain. To change them, duplicate this reward.'
                : 'When you activate a reward, the offer, points, dates and validity are published on-chain for good. Do not include personal information.'}
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
            <p className="text-xs">{describeValidity(draft)}</p>
            <p className="text-xs opacity-60">
              {draft.totalSupply
                ? `${fmtNumber(Number(draft.totalSupply) || 0)} available`
                : 'Unlimited'}
              {draft.perMemberLimit.trim() && ` · ${describeMemberLimit(draft).toLowerCase()}`}
            </p>
            {draft.description && <p className="text-xs opacity-70">{draft.description}</p>}
          </div>
        </aside>
      </div>
    </Modal>
  );
}
