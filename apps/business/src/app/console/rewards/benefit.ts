import type { ConsoleVoucher, ConsoleVoucherInput } from '@octap/shared/google-auth';
import { fmtNumber, fmtVnd } from '@/utils/format';

/**
 * Every reward kind a merchant commonly offers. Core stores three of them as `discountType`
 * (percent off, amount off, free item); the rest are described only by `terms`, which Core
 * allows when `discountType` is left out. Everything in `terms` is published on-chain when the
 * reward is activated, and Core does not enforce it: the merchant applies it at checkout.
 */
export type BenefitKind =
  | 'PERCENT_OFF'
  | 'AMOUNT_OFF'
  | 'FREE_ITEM'
  | 'BUY_X_GET_Y'
  | 'FREE_SHIPPING'
  | 'FIXED_PRICE'
  | 'CUSTOM';

/** Marks `terms` written in this shape, so a reader knows which fields to expect. */
export const BENEFIT_SCHEMA = 'octap.benefit.v1';

export const BENEFIT_KINDS: { kind: BenefitKind; label: string; hint: string }[] = [
  { kind: 'PERCENT_OFF', label: 'Percent off', hint: 'e.g. 20% off, up to 50,000 ₫' },
  { kind: 'AMOUNT_OFF', label: 'Amount off', hint: 'e.g. 30,000 ₫ off an order' },
  { kind: 'FREE_ITEM', label: 'Free item', hint: 'e.g. a free drink or a free upsize' },
  { kind: 'BUY_X_GET_Y', label: 'Buy X get Y', hint: 'e.g. buy 1 get 1 free' },
  { kind: 'FREE_SHIPPING', label: 'Free delivery', hint: 'e.g. free delivery up to 20,000 ₫' },
  { kind: 'FIXED_PRICE', label: 'Special price', hint: 'e.g. a combo for 99,000 ₫' },
  { kind: 'CUSTOM', label: 'Custom', hint: 'Any other gift or experience' },
];

/** The reward form's state. Numbers stay strings so an input can be cleared while typing. */
export interface RewardDraft {
  kind: BenefitKind;
  title: string;
  code: string;
  description: string;
  pointsCost: string;
  /** Percent for PERCENT_OFF, VND for AMOUNT_OFF. */
  value: string;
  maxDiscountVnd: string;
  minOrderVnd: string;
  item: string;
  buyQuantity: string;
  getQuantity: string;
  priceVnd: string;
  /** CUSTOM: the benefit in the merchant's own words. */
  benefit: string;
  appliesTo: string;
  /** Empty means unlimited. */
  totalSupply: string;
  /** `YYYY-MM-DD`, as a date input gives it. */
  startsOn: string;
  expiresOn: string;
}

export type DraftField = keyof RewardDraft;
export type DraftErrors = Partial<Record<DraftField | 'form', string>>;

export function emptyDraft(kind: BenefitKind = 'PERCENT_OFF'): RewardDraft {
  return {
    kind,
    title: '',
    code: '',
    description: '',
    pointsCost: '',
    value: '',
    maxDiscountVnd: '',
    minOrderVnd: '',
    item: '',
    buyQuantity: '1',
    getQuantity: '1',
    priceVnd: '',
    benefit: '',
    appliesTo: '',
    totalSupply: '',
    startsOn: '',
    expiresOn: '',
  };
}

export const TEMPLATES: { id: string; label: string; draft: Partial<RewardDraft> }[] = [
  {
    id: 'b1g1',
    label: 'Buy 1 get 1',
    draft: { kind: 'BUY_X_GET_Y', title: 'Buy 1 get 1 free', buyQuantity: '1', getQuantity: '1' },
  },
  {
    id: 'percent',
    label: '20% off, up to 50,000 ₫',
    draft: {
      kind: 'PERCENT_OFF',
      title: '20% off your order',
      value: '20',
      maxDiscountVnd: '50000',
    },
  },
  {
    id: 'amount',
    label: '30,000 ₫ off from 150,000 ₫',
    draft: { kind: 'AMOUNT_OFF', title: '30,000 ₫ off', value: '30000', minOrderVnd: '150000' },
  },
  {
    id: 'free-drink',
    label: 'Free drink',
    draft: { kind: 'FREE_ITEM', title: 'A free drink', item: 'Any drink, size M' },
  },
  {
    id: 'delivery',
    label: 'Free delivery',
    draft: { kind: 'FREE_SHIPPING', title: 'Free delivery', maxDiscountVnd: '20000' },
  },
];

const CODE_PATTERN = /^[A-Za-z0-9_-]{1,80}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** `Trà sữa trân châu!` → `TRA-SUA-TRAN-CHAU`: a readable code the merchant can still edit. */
export function suggestCode(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

/** A date input's day as the start or the end of that day in the browser's time zone. */
export function dayToIso(day: string, edge: 'start' | 'end'): string {
  return new Date(`${day}T${edge === 'start' ? '00:00:00' : '23:59:59'}`).toISOString();
}

function isoToDay(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const wholeNumber = (value: string) => /^\d+$/.test(value.trim());
const positiveAmount = (value: string) =>
  /^\d{1,10}(\.\d{1,2})?$/.test(value.trim()) && Number(value) > 0;

/**
 * Checks what the form can check before calling Core, and builds the create body. Core still
 * validates everything; its errors come back through `fieldOfCoreError`.
 */
export function toVoucherInput(draft: RewardDraft): {
  input?: ConsoleVoucherInput;
  errors: DraftErrors;
} {
  const errors: DraftErrors = {};
  const title = draft.title.trim();
  const code = draft.code.trim();
  if (!title) errors.title = 'Enter a title';
  else if (title.length > 200) errors.title = 'At most 200 characters';
  if (!CODE_PATTERN.test(code)) errors.code = 'Letters, numbers, - and _ only (at most 80)';
  if (!wholeNumber(draft.pointsCost))
    errors.pointsCost = 'Enter a whole number of points (0 for free)';
  if (
    draft.totalSupply.trim() &&
    !(wholeNumber(draft.totalSupply) && Number(draft.totalSupply) > 0)
  )
    errors.totalSupply = 'Enter a positive whole number, or leave empty for unlimited';
  for (const key of ['startsOn', 'expiresOn'] as const)
    if (draft[key] && !DATE_PATTERN.test(draft[key])) errors[key] = 'Pick a date';
  if (draft.startsOn && draft.expiresOn && draft.startsOn > draft.expiresOn)
    errors.expiresOn = 'Must be on or after the start date';
  const optionalVnd = (key: 'maxDiscountVnd' | 'minOrderVnd' | 'priceVnd') => {
    if (draft[key].trim() && !wholeNumber(draft[key])) errors[key] = 'Enter an amount in VND';
  };
  optionalVnd('minOrderVnd');

  const terms: Record<string, unknown> = { schema: BENEFIT_SCHEMA, kind: draft.kind };
  const setNumber = (key: string, value: string) => {
    if (value.trim()) terms[key] = Number(value);
  };
  setNumber('minOrderVnd', draft.minOrderVnd);
  if (draft.appliesTo.trim()) terms.appliesTo = draft.appliesTo.trim();

  let discountType: ConsoleVoucherInput['discountType'];
  let discountValue: string | undefined;
  switch (draft.kind) {
    case 'PERCENT_OFF':
      if (!positiveAmount(draft.value) || Number(draft.value) > 100)
        errors.value = 'Enter a percentage between 0 and 100';
      optionalVnd('maxDiscountVnd');
      setNumber('maxDiscountVnd', draft.maxDiscountVnd);
      discountType = 'PERCENTAGE';
      discountValue = draft.value.trim();
      break;
    case 'AMOUNT_OFF':
      if (!positiveAmount(draft.value)) errors.value = 'Enter an amount in VND';
      discountType = 'FIXED_AMOUNT';
      discountValue = draft.value.trim();
      break;
    case 'FREE_ITEM':
      if (!draft.item.trim()) errors.item = 'Say which item is free';
      terms.item = draft.item.trim();
      discountType = 'FREE_ITEM';
      break;
    case 'BUY_X_GET_Y':
      if (!(wholeNumber(draft.buyQuantity) && Number(draft.buyQuantity) > 0))
        errors.buyQuantity = 'At least 1';
      if (!(wholeNumber(draft.getQuantity) && Number(draft.getQuantity) > 0))
        errors.getQuantity = 'At least 1';
      if (!draft.item.trim()) errors.item = 'Say which item it applies to';
      terms.buyQuantity = Number(draft.buyQuantity);
      terms.getQuantity = Number(draft.getQuantity);
      terms.item = draft.item.trim();
      break;
    case 'FREE_SHIPPING':
      optionalVnd('maxDiscountVnd');
      setNumber('maxDiscountVnd', draft.maxDiscountVnd);
      break;
    case 'FIXED_PRICE':
      if (!draft.priceVnd.trim()) errors.priceVnd = 'Enter the special price';
      optionalVnd('priceVnd');
      if (!draft.item.trim()) errors.item = 'Say what the price is for';
      setNumber('priceVnd', draft.priceVnd);
      terms.item = draft.item.trim();
      break;
    case 'CUSTOM':
      if (!draft.benefit.trim()) errors.benefit = 'Describe what the customer gets';
      terms.benefit = draft.benefit.trim();
      break;
  }
  if (Object.keys(errors).length) return { errors };
  return {
    errors,
    input: {
      code,
      title,
      ...(draft.description.trim() ? { description: draft.description.trim() } : {}),
      pointsCost: Number(draft.pointsCost),
      ...(discountType ? { discountType } : {}),
      ...(discountValue ? { discountValue } : {}),
      terms,
      totalSupply: draft.totalSupply.trim() ? Number(draft.totalSupply) : null,
      startsAt: draft.startsOn ? dayToIso(draft.startsOn, 'start') : null,
      expiresAt: draft.expiresOn ? dayToIso(draft.expiresOn, 'end') : null,
    },
  };
}

/** The benefit kind of a stored reward, from its `terms` or, failing that, its `discountType`. */
export function kindOf(voucher: Pick<ConsoleVoucher, 'terms' | 'discountType'>): BenefitKind {
  const kind = voucher.terms?.kind;
  if (typeof kind === 'string' && BENEFIT_KINDS.some((k) => k.kind === kind))
    return kind as BenefitKind;
  if (voucher.discountType === 'PERCENTAGE') return 'PERCENT_OFF';
  if (voucher.discountType === 'FIXED_AMOUNT') return 'AMOUNT_OFF';
  if (voucher.discountType === 'FREE_ITEM') return 'FREE_ITEM';
  return 'CUSTOM';
}

/** A stored reward back as form state, for editing or duplicating it. */
export function fromVoucher(voucher: ConsoleVoucher): RewardDraft {
  const terms = voucher.terms ?? {};
  const text = (key: string) =>
    terms[key] === undefined || terms[key] === null ? '' : String(terms[key]);
  return {
    ...emptyDraft(kindOf(voucher)),
    title: voucher.title,
    code: voucher.code,
    description: voucher.description ?? '',
    pointsCost: String(voucher.pointsCost),
    value: voucher.discountValue ? String(Number(voucher.discountValue)) : '',
    maxDiscountVnd: text('maxDiscountVnd'),
    minOrderVnd: text('minOrderVnd'),
    item: text('item'),
    buyQuantity: text('buyQuantity') || '1',
    getQuantity: text('getQuantity') || '1',
    priceVnd: text('priceVnd'),
    benefit: text('benefit'),
    appliesTo: text('appliesTo'),
    totalSupply: voucher.totalSupply === null ? '' : String(voucher.totalSupply),
    startsOn: isoToDay(voucher.startsAt),
    expiresOn: isoToDay(voucher.expiresAt),
  };
}

/** One line a customer can read: "20% off · up to 50,000 ₫ · orders from 200,000 ₫". */
export function describeBenefit(draft: RewardDraft): string {
  const vnd = (value: string) =>
    value.trim() && Number.isFinite(Number(value)) ? fmtVnd(Number(value)) : '…';
  const parts: string[] = [];
  switch (draft.kind) {
    case 'PERCENT_OFF':
      parts.push(`${draft.value || '…'}% off`);
      if (draft.maxDiscountVnd) parts.push(`up to ${vnd(draft.maxDiscountVnd)}`);
      break;
    case 'AMOUNT_OFF':
      parts.push(`${vnd(draft.value)} off`);
      break;
    case 'FREE_ITEM':
      parts.push(`Free ${draft.item || 'item'}`);
      break;
    case 'BUY_X_GET_Y':
      parts.push(
        `Buy ${draft.buyQuantity || '…'} get ${draft.getQuantity || '…'} free${draft.item ? `: ${draft.item}` : ''}`,
      );
      break;
    case 'FREE_SHIPPING':
      parts.push('Free delivery');
      if (draft.maxDiscountVnd) parts.push(`up to ${vnd(draft.maxDiscountVnd)}`);
      break;
    case 'FIXED_PRICE':
      parts.push(`${draft.item || 'Special offer'} for ${vnd(draft.priceVnd)}`);
      break;
    case 'CUSTOM':
      parts.push(draft.benefit || 'Custom reward');
      break;
  }
  if (draft.minOrderVnd) parts.push(`orders from ${vnd(draft.minOrderVnd)}`);
  if (draft.appliesTo) parts.push(draft.appliesTo);
  return parts.join(' · ');
}

/** Where a reward is in its lifecycle, from Core's `status` and `publishStatus`. */
export type Stage = 'draft' | 'publishing' | 'failed' | 'live' | 'paused' | 'sold_out';

export function stageOf(voucher: Pick<ConsoleVoucher, 'status' | 'publishStatus'>): Stage {
  if (voucher.status === 'DEPLETED') return 'sold_out';
  if (voucher.publishStatus === 'PUBLISHING') return 'publishing';
  if (voucher.status === 'DRAFT') return voucher.publishStatus === 'FAILED' ? 'failed' : 'draft';
  return voucher.status === 'PAUSED' ? 'paused' : 'live';
}

/** Once publishing starts, the promise fields are frozen on-chain; only supply can change. */
export const isLocked = (voucher: Pick<ConsoleVoucher, 'publishStatus'>) =>
  voucher.publishStatus === 'PUBLISHING' || voucher.publishStatus === 'PUBLISHED';

export function remainingLabel(
  voucher: Pick<ConsoleVoucher, 'totalSupply' | 'claimedCount'>,
): string {
  return voucher.totalSupply === null
    ? `${fmtNumber(voucher.claimedCount)} claimed · unlimited`
    : `${fmtNumber(voucher.claimedCount)} of ${fmtNumber(voucher.totalSupply)} claimed · ${fmtNumber(Math.max(voucher.totalSupply - voucher.claimedCount, 0))} left`;
}

/**
 * Core answers a 400/409 with one sentence that starts with the field it is about (OCT-236's
 * `validateVoucher`). Map it to the form field, so the message shows under the right input.
 */
export function fieldOfCoreError(message: string): DraftField | 'form' {
  const rules: [RegExp, DraftField][] = [
    [/^code\b|code .*already exists|^Voucher with code/i, 'code'],
    [/^title\b|^code, title/i, 'title'],
    [/^description\b|must fit in \d+ bytes/i, 'description'],
    [/^pointsCost\b/i, 'pointsCost'],
    [/^discountValue\b|^Percentage discount/i, 'value'],
    [/^totalSupply\b|^Supply cannot/i, 'totalSupply'],
    [/^startsAt\b/i, 'startsOn'],
    [/^expiresAt\b|stay valid for at least 24 hours/i, 'expiresOn'],
  ];
  return rules.find(([pattern]) => pattern.test(message))?.[1] ?? 'form';
}
