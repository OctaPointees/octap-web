import { Form } from '@base-ui/react/form';
import { useMutation } from '@tanstack/react-query';
import { LockSimple, PencilSimple } from 'phosphor-react';
import { useState, type ReactNode } from 'react';
import { MAX_VALID_FOR_DAYS, type ConsoleVoucher, type ConsoleVoucherInput } from '@octap/services';
import { useAuth } from '@octap/shared/authentication';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { Button } from '@/components/shared/Button';
import { FormField, TextInput } from '@/components/shared/Controls';
import { ConfirmDialog, SidePanel } from '@/components/shared/Modal';
import { cn } from '@/utils/cn';
import { fmtNumber } from '@/utils/format';
import { notify } from '@/utils/toast';
import { rewardsApi } from './api';
import {
  BENEFIT_KINDS,
  TEMPLATES,
  describeBenefit,
  describeClaimWindow,
  describeMemberLimit,
  describeValidity,
  emptyDraft,
  fromVoucher,
  isLocked,
  suggestCode,
  toVoucherInput,
  vndEcho,
  type BenefitKind,
  type DraftErrors,
  type DraftField,
  type RewardDraft,
} from './benefit';
import { coreErrors } from './errors';
import { KIND_ICONS } from './kindIcons';

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
      className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-box border border-base-300 p-3"
    >
      <header className="col-span-2 flex flex-wrap items-center justify-between gap-2">
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

/** "Claims open on  optional": optional fields say so next to the label, not in a hint line. */
const optional = (label: string) => (
  <>
    {label} <span className="font-normal opacity-50">optional</span>
  </>
);

/**
 * Creates, edits or shows a reward in a panel from the right. Two columns, so it fits a laptop
 * screen without scrolling: the offer on the left; points, dates, availability and the summary
 * on the right. A published reward opens read-only here: its availability changes in the
 * smaller "Edit availability" dialog.
 */
export default function RewardForm({
  mode,
  onClose,
}: {
  mode: RewardFormMode;
  onClose: () => void;
}) {
  const auth = useAuth();
  const organization = useOrganization();
  const orgId = organization.organizationId;
  const editing = mode.kind === 'edit' ? mode.voucher : undefined;
  const locked = editing ? isLocked(editing) : false;
  const readOnly = (mode.kind === 'edit' && mode.readOnly) || locked;
  const [initial] = useState<RewardDraft>(() => {
    if (editing) return fromVoucher(editing);
    if (mode.kind === 'create' && mode.from) {
      // The validity rule and the per-member limit still fit a copy; absolute dates do not.
      const copy = fromVoucher(mode.from);
      return { ...copy, code: `${copy.code.slice(0, 76)}-2`, startsOn: '', closesOn: '' };
    }
    return emptyDraft();
  });
  const [draft, setDraft] = useState<RewardDraft>(initial);
  // What the form held when it opened or a template was last applied: anything else was typed.
  const [baseline, setBaseline] = useState<RewardDraft>(initial);
  const [pendingTemplate, setPendingTemplate] = useState<Partial<RewardDraft> | null>(null);
  const [codeTouched, setCodeTouched] = useState(
    Boolean(editing || (mode.kind === 'create' && mode.from)),
  );
  const [localErrors, setLocalErrors] = useState<DraftErrors>({});

  const save = useMutation({
    mutationFn: (input: ConsoleVoucherInput) => {
      const api = rewardsApi(auth);
      if (!editing) return api.create(orgId, input);
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
    // Core's error was about the value being changed: drop it rather than show it under new input.
    if (save.error) save.reset();
  };
  const applyTemplate = (template: Partial<RewardDraft>) => {
    const next = { ...emptyDraft(), ...template, pointsCost: draft.pointsCost };
    if (!codeTouched) next.code = suggestCode(next.title);
    setDraft(next);
    setBaseline(next);
    setPendingTemplate(null);
    setLocalErrors({});
    save.reset();
  };
  const typed = (Object.keys(draft) as DraftField[]).some(
    (key) => key !== 'pointsCost' && draft[key] !== baseline[key],
  );

  const disabled = readOnly;
  const field = (key: DraftField) => ({
    className: 'h-9 text-sm',
    value: draft[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => set(key, event.target.value as never),
    invalid: Boolean(errors[key]),
    disabled,
  });
  /** A VND field echoes its value formatted ("= 5.000.000 ₫") in place of its hint. */
  const vndField = (
    key: 'value' | 'maxDiscountVnd' | 'minOrderVnd' | 'priceVnd',
    hint?: string,
  ) => ({
    error: errors[key],
    hint: vndEcho(draft[key]) ?? hint,
  });
  const keepsDiscountType = (kind: BenefitKind) =>
    Boolean(editing?.discountType && TERMS_ONLY.includes(kind));
  const showValue = draft.kind === 'PERCENT_OFF' || draft.kind === 'AMOUNT_OFF';
  const showItem = ['FREE_ITEM', 'BUY_X_GET_Y', 'FIXED_PRICE'].includes(draft.kind);
  const byDays = draft.expiry === 'days';
  const selectedKind = BENEFIT_KINDS.find((k) => k.kind === draft.kind);

  const title = readOnly
    ? 'Reward details'
    : editing
      ? 'Edit draft'
      : mode.kind === 'create' && mode.from
        ? 'Duplicate reward'
        : 'New reward';

  return (
    <SidePanel
      open
      onOpenChange={(open) => !open && onClose()}
      title={title}
      description={
        locked
          ? 'Published on-chain: these terms never change. To offer something different, duplicate it.'
          : readOnly
            ? 'Only the Owner can change rewards.'
            : 'Saved as a draft until you activate it. Activation publishes the locked fields on-chain for good, so leave out personal information.'
      }
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
      <Form
        id="reward-form"
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const { input, errors: found } = toVoucherInput(draft);
          setLocalErrors(found);
          save.reset();
          if (input) save.mutate(input);
        }}
      >
        {errors.form && (
          <p role="alert" className="alert alert-error alert-soft text-sm">
            {errors.form}
          </p>
        )}
        {!editing && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs opacity-60">Start from:</span>
            {TEMPLATES.map((template) => (
              <Button
                key={template.id}
                className="btn-outline btn-xs"
                onClick={() =>
                  typed ? setPendingTemplate(template.draft) : applyTemplate(template.draft)
                }
              >
                {template.label}
              </Button>
            ))}
          </div>
        )}

        <div className="grid items-start gap-3 lg:grid-cols-2">
          <Group title="Offer" frozen>
            <fieldset className="col-span-2" disabled={disabled}>
              <legend className="mb-1.5 text-sm font-medium">Reward type</legend>
              <div className="flex flex-wrap gap-1.5">
                {BENEFIT_KINDS.map(({ kind, label }) => {
                  const KindIcon = KIND_ICONS[kind];
                  return (
                    <button
                      key={kind}
                      type="button"
                      aria-pressed={draft.kind === kind}
                      disabled={disabled || keepsDiscountType(kind)}
                      onClick={() => set('kind', kind)}
                      className={cn(
                        'btn btn-sm gap-1.5 font-medium',
                        draft.kind === kind ? 'btn-primary btn-soft' : 'btn-outline',
                      )}
                    >
                      <KindIcon size={14} />
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs opacity-60">
                {selectedKind?.hint}
                {editing?.discountType &&
                  !disabled &&
                  '. Buy X get Y, free delivery, special price and custom need a new reward: Core cannot remove this draft’s discount type.'}
              </p>
            </fieldset>
            <FormField label="Title" error={errors.title}>
              <TextInput {...field('title')} placeholder="e.g. Free signature drink" />
            </FormField>
            <FormField label="Code" error={errors.code} hint="Unique; part of each serial.">
              <TextInput
                {...field('code')}
                onChange={(event) => {
                  setCodeTouched(true);
                  set('code', event.target.value.toUpperCase());
                }}
              />
            </FormField>
            {showValue && (
              <FormField
                label={draft.kind === 'PERCENT_OFF' ? 'Percent off' : 'Amount off (VND)'}
                {...(draft.kind === 'AMOUNT_OFF' ? vndField('value') : { error: errors.value })}
              >
                <TextInput {...field('value')} inputMode="decimal" />
              </FormField>
            )}
            {(draft.kind === 'PERCENT_OFF' || draft.kind === 'FREE_SHIPPING') && (
              <FormField label={optional('Up to (VND)')} {...vndField('maxDiscountVnd')}>
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
              <FormField label="Special price (VND)" {...vndField('priceVnd')}>
                <TextInput {...field('priceVnd')} inputMode="numeric" />
              </FormField>
            )}
            {draft.kind === 'CUSTOM' && (
              <FormField
                label="What the customer gets"
                error={errors.benefit}
                className="col-span-2"
              >
                <TextInput {...field('benefit')} placeholder="e.g. One 60-minute spa treatment" />
              </FormField>
            )}
            <FormField label={optional('Minimum order (VND)')} {...vndField('minOrderVnd')}>
              <TextInput {...field('minOrderVnd')} inputMode="numeric" />
            </FormField>
            <FormField label={optional('Applies to')} error={errors.appliesTo}>
              <TextInput {...field('appliesTo')} placeholder="e.g. Drinks only" />
            </FormField>
            <FormField
              label={optional('Description')}
              error={errors.description}
              className="col-span-2"
            >
              <textarea
                className={cn('textarea w-full text-sm', errors.description && 'textarea-error')}
                rows={2}
                value={draft.description}
                disabled={disabled}
                placeholder="Conditions, or how to redeem it"
                onChange={(event) => set('description', event.target.value)}
              />
            </FormField>
          </Group>

          <div className="flex flex-col gap-3">
            <Group title="Price and validity" frozen>
              <FormField
                label="Points to claim"
                error={errors.pointsCost}
                hint="0 makes it free to claim."
                className="col-span-2"
              >
                <TextInput {...field('pointsCost')} inputMode="numeric" placeholder="e.g. 500" />
              </FormField>
              <FormField label={optional('Claims open on')} error={errors.startsOn}>
                <TextInput {...field('startsOn')} type="date" />
              </FormField>
              <FormField label={optional('Claims close on')} error={errors.closesOn}>
                <TextInput {...field('closesOn')} type="date" />
              </FormField>
              <fieldset className="col-span-2" disabled={disabled}>
                <legend className="mb-1.5 text-sm font-medium">Vouchers can be used</legend>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="join">
                    <input
                      type="radio"
                      name="expiry"
                      className="join-item btn btn-sm"
                      aria-label="Until claims close"
                      checked={!byDays}
                      onChange={() => set('expiry', 'closes')}
                    />
                    <input
                      type="radio"
                      name="expiry"
                      className="join-item btn btn-sm"
                      aria-label="Days after claiming"
                      checked={byDays}
                      onChange={() => set('expiry', 'days')}
                    />
                  </div>
                  {byDays && (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        className={cn('input input-sm w-20', errors.validForDays && 'input-error')}
                        aria-label="Number of days"
                        aria-invalid={Boolean(errors.validForDays) || undefined}
                        inputMode="numeric"
                        placeholder="14"
                        value={draft.validForDays}
                        disabled={disabled}
                        onChange={(event) => set('validForDays', event.target.value)}
                      />
                      days
                    </label>
                  )}
                </div>
                <p
                  className={cn('mt-1 text-xs', errors.validForDays ? 'text-error' : 'opacity-60')}
                >
                  {errors.validForDays ??
                    (byDays
                      ? `Counted from each claim, 1 to ${MAX_VALID_FOR_DAYS} days, and never past the closing day.`
                      : 'Every voucher expires at the end of the closing day; none if it is empty.')}
                </p>
              </fieldset>
            </Group>

            <Group title="Availability" frozen={false}>
              <FormField
                label="Number available"
                error={errors.totalSupply}
                hint={
                  editing && editing.claimedCount > 0
                    ? `${fmtNumber(editing.claimedCount)} claimed. Empty = unlimited.`
                    : 'Empty = unlimited.'
                }
              >
                <TextInput {...field('totalSupply')} inputMode="numeric" placeholder="Unlimited" />
              </FormField>
              <FormField
                label="Per-member limit"
                error={errors.perMemberLimit}
                hint="Used vouchers count, cancelled don’t."
              >
                <TextInput
                  {...field('perMemberLimit')}
                  inputMode="numeric"
                  placeholder="No limit"
                />
              </FormField>
            </Group>

            <aside
              aria-label="Summary"
              className="flex flex-col gap-1 rounded-box border border-base-300 bg-base-200 p-3"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs font-medium opacity-60">Summary</span>
                <span className="text-lg font-bold">
                  {draft.pointsCost ? fmtNumber(Number(draft.pointsCost) || 0) : '…'}{' '}
                  <span className="text-xs font-normal opacity-60">points</span>
                </span>
              </div>
              <h3 className="font-semibold">{draft.title || 'Reward title'}</h3>
              <p className="text-sm">{describeBenefit(draft)}</p>
              <p className="text-xs">{describeValidity(draft)}</p>
              <p className="text-xs opacity-60">
                {describeClaimWindow(draft)} ·{' '}
                {draft.totalSupply
                  ? `${fmtNumber(Number(draft.totalSupply) || 0)} available`
                  : 'unlimited'}
                {draft.perMemberLimit.trim() && ` · ${describeMemberLimit(draft).toLowerCase()}`}
              </p>
            </aside>
          </div>
        </div>
      </Form>
      <ConfirmDialog
        open={Boolean(pendingTemplate)}
        onOpenChange={(open) => !open && setPendingTemplate(null)}
        title="Replace what you entered?"
        description="The template fills in the offer and clears the other fields. Points stay as they are."
        confirmLabel="Replace"
        tone="warning"
        onConfirm={() => pendingTemplate && applyTemplate(pendingTemplate)}
      />
    </SidePanel>
  );
}
