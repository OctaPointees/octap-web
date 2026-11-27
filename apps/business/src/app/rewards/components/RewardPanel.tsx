import { useState, type ReactNode } from 'react';
import { Field } from '@base-ui/react/field';
import { LockSimple, PencilSimple } from 'phosphor-react';
import { Button, ConfirmDialog, SidePanel } from '@octap/shared/components';
import { describeRefundRules } from '@/app/settings/domain/refundPolicy';
import { cn } from '@/utils/cn';
import {
  describeBenefit,
  describeClaimWindow,
  describeMemberLimit,
  describePoints,
  describeValidity,
} from '../domain/describe';
import {
  emptyDraft,
  fromReward,
  suggestCode,
  TEMPLATES,
  toRewardInput,
  vndEcho,
  type DraftErrors,
  type DraftField,
  type Reward,
  type RewardDraft,
} from '../domain/draft';
import { coreErrors } from '../domain/errors';
import { hasDiscountType, KIND_ORDER, KINDS, MAX_VALID_FOR_DAYS } from '../domain/kinds';
import { isLocked } from '../domain/stage';
import { useSaveReward, type RewardReport } from '../hooks/useRewards';
import { ApprovalNotice, RejectionNotice } from './RejectionNotice';
import { useOrganization } from '@/app/organization/hooks/useOrganization';

/** What the panel is for: a new reward (maybe from a copy), editing a draft, or viewing one. */
export type RewardPanelMode =
  | { type: 'create'; from?: RewardDraft }
  | { type: 'edit'; reward: Reward }
  | { type: 'view'; reward: Reward };

/** Shown while nothing has been opened yet. */
const CREATE: RewardPanelMode = { type: 'create' };

/** A form section, marked with whether activation freezes it on-chain. */
function Section({
  title,
  locked,
  children,
}: {
  title: string;
  locked: boolean;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-b border-base-300 py-6 last:border-b-0">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{title}</h3>
        <span
          className={cn(
            'flex items-center gap-1 text-xs',
            locked ? 'text-warning-content/80' : 'text-success',
          )}
        >
          {locked ? <LockSimple size={13} /> : <PencilSimple size={13} />}
          {locked ? 'Locked once activated' : 'Can change after activation'}
        </span>
      </header>
      {children}
    </section>
  );
}

/** A labelled input with its hint or error underneath. */
function Input({
  label,
  optional,
  hint,
  error,
  className,
  ...props
}: {
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  className?: string;
} & React.ComponentProps<'input'>) {
  return (
    <Field.Root className={cn('flex min-w-0 flex-col gap-1', className)} invalid={!!error}>
      <Field.Label className="text-sm font-medium">
        {label} {optional && <span className="font-normal opacity-50">optional</span>}
      </Field.Label>
      <Field.Control
        {...props}
        className={cn('input w-full', error && 'input-error')}
        aria-invalid={!!error || undefined}
      />
      {error ? (
        <p className="text-xs text-error">{error}</p>
      ) : (
        hint && <Field.Description className="text-xs opacity-60">{hint}</Field.Description>
      )}
    </Field.Root>
  );
}

/** Creates, edits or shows a reward in a panel from the right. */
/** The form a panel session starts from: the reward, the copy, or an empty draft. */
const initialDraft = (mode: RewardPanelMode) =>
  mode.type !== 'create' ? fromReward(mode.reward) : (mode.from ?? emptyDraft());

/**
 * Stays mounted, so the panel slides in and out: `open` shows it, and `mode` keeps the last
 * reward on screen while it slides away. Each new `mode` starts the form afresh.
 */
export function RewardPanel({
  open,
  mode: current,
  onSaved,
  onClose,
}: {
  open: boolean;
  mode: RewardPanelMode | null;
  onSaved: RewardReport;
  onClose: () => void;
}) {
  const mode = current ?? CREATE;
  const reward = mode.type === 'create' ? undefined : mode.reward;
  const readOnly = mode.type === 'view' || (reward ? isLocked(reward) : false);
  // With approval on, a Developer's draft goes to the Owner, not straight on-chain.
  const { owner, organization } = useOrganization();
  const submits = !owner && organization.voucherApprovalRequired;
  const [draft, setDraft] = useState(() => initialDraft(mode));
  // What the form held when it opened or a template was applied: anything else was typed.
  const [baseline, setBaseline] = useState(draft);
  const [pendingTemplate, setPendingTemplate] = useState<Partial<RewardDraft> | null>(null);
  const [codeTouched, setCodeTouched] = useState(
    !!reward || (mode.type === 'create' && !!mode.from),
  );
  const [localErrors, setLocalErrors] = useState<DraftErrors>({});
  const save = useSaveReward(mode.type === 'edit' ? reward : undefined, onSaved);

  // A new session (another reward, or New reward again): start the form from it.
  const [session, setSession] = useState(mode);
  if (mode !== session) {
    const initial = initialDraft(mode);
    setSession(mode);
    setDraft(initial);
    setBaseline(initial);
    setPendingTemplate(null);
    setCodeTouched(!!reward || (mode.type === 'create' && !!mode.from));
    setLocalErrors({});
  }
  const close = () => {
    save.reset();
    onClose();
  };
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
  const input = (key: DraftField) => ({
    value: String(draft[key]),
    error: errors[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => set(key, event.target.value as never),
  });
  const applyTemplate = (template: Partial<RewardDraft>) => {
    const next = { ...emptyDraft(), ...template, pointsCost: draft.pointsCost };
    if (!codeTouched) next.code = suggestCode(next.title ?? '');
    setDraft(next);
    setBaseline(next);
    setPendingTemplate(null);
    setLocalErrors({});
    save.reset();
  };
  const typed = (Object.keys(draft) as DraftField[]).some(
    (key) => key !== 'pointsCost' && draft[key] !== baseline[key],
  );
  // Core cannot clear a saved discount type, so such a draft keeps to the discount kinds.
  const kindLocked = (kind: typeof draft.kind) => !!reward?.discountType && !hasDiscountType(kind);

  const title = readOnly
    ? 'Voucher details'
    : mode.type === 'edit'
      ? 'Edit draft'
      : mode.type === 'create' && mode.from
        ? 'Duplicate voucher'
        : 'New voucher';
  const description =
    reward && isLocked(reward)
      ? 'Published on-chain, so these terms never change. To offer something different, duplicate it.'
      : readOnly
        ? 'You can view this voucher. Only its draft can be edited.'
        : submits
          ? 'Saved as a draft until you submit it for approval. Once the Owner approves it, the locked parts are published on-chain for good, so leave out personal information.'
          : 'Saved as a draft until it is activated. Activation publishes the locked parts on-chain for good, so leave out personal information.';

  const kind = KINDS[draft.kind];
  const showValue = draft.kind === 'PERCENT_OFF' || draft.kind === 'AMOUNT_OFF';
  const showItem = ['FREE_ITEM', 'BUY_X_GET_Y', 'FIXED_PRICE'].includes(draft.kind);
  const showMaxDiscount = draft.kind === 'PERCENT_OFF' || draft.kind === 'FREE_SHIPPING';

  return (
    <SidePanel
      open={open}
      onOpenChange={(next) => !next && close()}
      className="max-w-none md:w-6/10"
      title={title}
      description={description}
      footer={
        readOnly ? (
          <Button className="btn-ghost" onClick={close}>
            Close
          </Button>
        ) : (
          <>
            <Button className="btn-ghost" onClick={close}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="reward-form"
              className="btn-primary"
              loading={save.isPending}
            >
              {mode.type === 'edit' ? 'Save draft' : 'Save as draft'}
            </Button>
          </>
        )
      }
    >
      <form
        id="reward-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const { input: body, errors: found } = toRewardInput(draft);
          setLocalErrors(found);
          save.reset();
          if (body) save.mutate(body, { onSuccess: close });
        }}
      >
        <fieldset disabled={readOnly} className="contents">
          {/* Stays at the top while the form scrolls, so every change shows as members will see it. */}
          <div className="sticky top-0 z-10 -mx-6 bg-base-100 px-6 pt-1 pb-3">
            <section
              aria-label="Summary"
              className="rounded-box p-5 bg-pattern-blur-blobs ring-2 ring-base-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide opacity-50">
                    As members see it
                  </p>
                  <p className="mt-1 truncate text-lg font-semibold">
                    {draft.title || 'Voucher title'}
                  </p>
                  <p className="text-sm">{describeBenefit(draft)}</p>
                </div>
                <span className="shrink-0 font-semibold tabular-nums">
                  {draft.pointsCost.trim() ? describePoints(Number(draft.pointsCost)) : '… points'}
                </span>
              </div>
              <ul className="mt-3 flex flex-col gap-0.5 text-sm opacity-70">
                <li>{describeValidity(draft)}</li>
                <li>{describeClaimWindow(draft)}</li>
                <li>
                  {describeMemberLimit(draft)},{' '}
                  {draft.totalSupply.trim() ? `${draft.totalSupply} available` : 'unlimited'}
                </li>
              </ul>
            </section>
          </div>

          <RejectionNotice reward={reward} />
          <ApprovalNotice reward={reward} />

          {errors.form && (
            <p role="alert" className="alert alert-error alert-soft mt-4 text-sm">
              {errors.form}
            </p>
          )}

          {mode.type === 'create' && !mode.from && (
            <div className="flex flex-wrap items-center gap-2 pt-4">
              <span className="text-sm opacity-60">Start from</span>
              {TEMPLATES.map((template) => (
                <Button
                  key={template.id}
                  className="btn-sm btn-outline min-w-0 font-normal"
                  onClick={() =>
                    typed ? setPendingTemplate(template.draft) : applyTemplate(template.draft)
                  }
                >
                  {template.label}
                </Button>
              ))}
            </div>
          )}

          <Section title="Offer" locked>
            <div role="radiogroup" aria-label="Voucher type" className="flex flex-col gap-2">
              <span className="text-sm font-medium">Voucher type</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {KIND_ORDER.map((option) => {
                  const { label, icon: KindIcon } = KINDS[option];
                  const selected = draft.kind === option;
                  return (
                    <Button
                      key={option}
                      role="radio"
                      aria-checked={selected}
                      disabled={kindLocked(option)}
                      onClick={() => set('kind', option)}
                      className={cn(
                        'h-auto min-w-0 rounded-field border px-3 py-2 text-left text-sm font-normal shadow-none transition-colors disabled:opacity-40',
                        selected
                          ? 'border-primary bg-primary/10 font-medium text-primary'
                          : 'border-base-300 bg-transparent hover:border-base-content/30',
                      )}
                    >
                      <span className="flex w-full min-w-0 items-center gap-2">
                        <KindIcon size={16} className="shrink-0" />
                        <span className="truncate">{label}</span>
                      </span>
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs opacity-60">{kind.hint}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {showValue && (
                <Input
                  label={draft.kind === 'PERCENT_OFF' ? 'Percent off' : 'Amount off (VND)'}
                  inputMode="decimal"
                  hint={draft.kind === 'AMOUNT_OFF' ? vndEcho(draft.value) : undefined}
                  {...input('value')}
                />
              )}
              {showMaxDiscount && (
                <Input
                  label="Up to (VND)"
                  optional
                  inputMode="numeric"
                  hint={vndEcho(draft.maxDiscountVnd)}
                  {...input('maxDiscountVnd')}
                />
              )}
              {draft.kind === 'BUY_X_GET_Y' && (
                <>
                  <Input label="Buy" inputMode="numeric" {...input('buyQuantity')} />
                  <Input label="Get free" inputMode="numeric" {...input('getQuantity')} />
                </>
              )}
              {showItem && (
                <Input
                  label={draft.kind === 'FIXED_PRICE' ? 'What it is for' : 'Item'}
                  placeholder={
                    draft.kind === 'FIXED_PRICE' ? 'e.g. Breakfast combo' : 'e.g. Any drink, size M'
                  }
                  {...input('item')}
                />
              )}
              {draft.kind === 'FIXED_PRICE' && (
                <Input
                  label="Special price (VND)"
                  inputMode="numeric"
                  hint={vndEcho(draft.priceVnd)}
                  {...input('priceVnd')}
                />
              )}
              {draft.kind === 'CUSTOM' && (
                <Input
                  label="What the member gets"
                  className="sm:col-span-2"
                  placeholder="e.g. A private tasting for two"
                  {...input('benefit')}
                />
              )}
              <Input
                label="Minimum order (VND)"
                optional
                inputMode="numeric"
                hint={vndEcho(draft.minOrderVnd)}
                {...input('minOrderVnd')}
              />
              <Input
                label="Applies to"
                optional
                placeholder="e.g. Drinks only"
                {...input('appliesTo')}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Title" placeholder="e.g. Free signature drink" {...input('title')} />
              <Input
                label="Code"
                hint="Unique in your catalog, and part of every voucher's serial."
                {...input('code')}
                onChange={(event) => {
                  setCodeTouched(true);
                  set('code', event.target.value);
                }}
              />
            </div>
            <Field.Root className="flex flex-col gap-1" invalid={!!errors.description}>
              <Field.Label className="text-sm font-medium">
                Description <span className="font-normal opacity-50">optional</span>
              </Field.Label>
              <Field.Control
                render={<textarea rows={3} />}
                className={cn('textarea w-full', errors.description && 'textarea-error')}
                placeholder="Conditions, or how to redeem it"
                value={draft.description}
                onChange={(event) => set('description', event.target.value)}
              />
              {errors.description && <p className="text-xs text-error">{errors.description}</p>}
            </Field.Root>
          </Section>

          <Section title="Price and validity" locked>
            <Input
              label="Points to claim"
              inputMode="numeric"
              placeholder="e.g. 500"
              hint="0 makes it free to claim."
              className="sm:max-w-xs"
              {...input('pointsCost')}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Claims open on" optional type="date" {...input('startsOn')} />
              <Input label="Claims close on" optional type="date" {...input('closesOn')} />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Vouchers can be used</span>
              <div role="radiogroup" aria-label="Vouchers can be used" className="join">
                {(
                  [
                    ['closes', 'Until claims close'],
                    ['days', 'For a number of days after claiming'],
                  ] as const
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    role="radio"
                    aria-checked={draft.expiry === value}
                    onClick={() => set('expiry', value)}
                    className={cn(
                      'btn-sm join-item min-w-0 font-normal',
                      draft.expiry === value ? 'btn-primary' : 'btn-outline',
                    )}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              {draft.expiry === 'days' ? (
                <Input
                  label="Days after claiming"
                  inputMode="numeric"
                  hint={`1 to ${MAX_VALID_FOR_DAYS}. Never later than the closing day.`}
                  className="sm:max-w-xs"
                  {...input('validForDays')}
                />
              ) : (
                <p className="text-xs opacity-60">
                  Every voucher expires at the end of the closing day, or never if there is none.
                </p>
              )}
            </div>
          </Section>

          {reward?.refundPolicy && isLocked(reward) && (
            <Section title="Refund terms" locked>
              <dl className="flex flex-col gap-1 text-sm">
                {describeRefundRules(reward.refundPolicy).map((row) => (
                  <div key={row.label} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3">
                    <dt className="opacity-60">{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-xs opacity-60">
                {reward.refundPolicy.version === 0
                  ? 'From the default refund policy.'
                  : `From refund policy version ${reward.refundPolicy.version}.`}
              </p>
            </Section>
          )}

          <Section title="Availability" locked={false}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Number available"
                optional
                inputMode="numeric"
                placeholder="Unlimited"
                {...input('totalSupply')}
              />
              <Input
                label="Per-member limit"
                optional
                inputMode="numeric"
                placeholder="No limit"
                hint="Used vouchers count, cancelled ones don't."
                {...input('perMemberLimit')}
              />
            </div>
          </Section>
        </fieldset>
      </form>

      <ConfirmDialog
        open={!!pendingTemplate}
        onOpenChange={(open) => !open && setPendingTemplate(null)}
        title="Replace what you've entered?"
        description="The template fills the offer from scratch. Points stay as they are."
        confirmLabel="Use template"
        onConfirm={() => pendingTemplate && applyTemplate(pendingTemplate)}
      />
    </SidePanel>
  );
}
