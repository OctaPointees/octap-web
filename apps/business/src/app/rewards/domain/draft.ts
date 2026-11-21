import type {
  ConsoleRewardsCreateInput,
  ConsoleRewardsUpdateInput,
  VoucherDto,
} from '@octap/internal-sdk';
import { fmtNumber, fmtVnd } from '@/utils/format';
import {
  BENEFIT_SCHEMA,
  DISCOUNT_TYPES,
  KINDS,
  MAX_VALID_FOR_DAYS,
  type BenefitKind,
} from './kinds';

/** A reward as Core returns it. */
export type Reward = VoucherDto;

/** The body that creates a draft. The form never sets a status: activating is its own step. */
export type RewardInput = Omit<ConsoleRewardsCreateInput, 'status'>;

/** The reward form's state. Numbers stay strings, so an input can be cleared while typing. */
export interface RewardDraft {
  kind: BenefitKind;
  title: string;
  code: string;
  description: string;
  pointsCost: string;
  /** The percent for PERCENT_OFF, the VND amount for AMOUNT_OFF. */
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
  /** Empty means no limit; used vouchers count, cancelled ones don't. */
  perMemberLimit: string;
  /** `YYYY-MM-DD`, as a date input gives it: when claims open. */
  startsOn: string;
  /** When claims close; also the latest any member's voucher can be used. */
  closesOn: string;
  /** `closes`: every voucher expires when claims close. `days`: each lasts `validForDays`. */
  expiry: 'closes' | 'days';
  validForDays: string;
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
    perMemberLimit: '',
    startsOn: '',
    closesOn: '',
    expiry: 'closes',
    validForDays: '',
  };
}

/** Common rewards to start from. Applying one keeps the points already typed. */
export const TEMPLATES: { id: string; label: string; draft: Partial<RewardDraft> }[] = [
  {
    id: 'b1g1',
    label: 'Buy 1 get 1',
    draft: { kind: 'BUY_X_GET_Y', title: 'Buy 1 get 1 free', buyQuantity: '1', getQuantity: '1' },
  },
  {
    id: 'percent',
    label: `20% off, up to ${fmtVnd(50000)}`,
    draft: {
      kind: 'PERCENT_OFF',
      title: '20% off your order',
      value: '20',
      maxDiscountVnd: '50000',
    },
  },
  {
    id: 'amount',
    label: `${fmtVnd(30000)} off from ${fmtVnd(150000)}`,
    draft: {
      kind: 'AMOUNT_OFF',
      title: `${fmtVnd(30000)} off`,
      value: '30000',
      minOrderVnd: '150000',
    },
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

/** `Trà sữa trân châu!` gives `TRA-SUA-TRAN-CHAU`: a readable code the merchant can still edit. */
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

function isoToDay(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "= 5.000.000 ₫" under a VND input, so 5000000 and 500000 are easy to tell apart. */
export function vndEcho(value: string): string | undefined {
  return /^\d+$/.test(value.trim()) ? `= ${fmtVnd(Number(value))}` : undefined;
}

const CODE_PATTERN = /^[A-Za-z0-9_-]{1,80}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const wholeNumber = (value: string) => /^\d+$/.test(value.trim());
const positiveWhole = (value: string) => wholeNumber(value) && Number(value) > 0;
const positiveAmount = (value: string) =>
  /^\d{1,10}(\.\d{1,2})?$/.test(value.trim()) && Number(value) > 0;

/**
 * Checks what can be checked before calling Core, and builds the create body. Core validates
 * everything again; its errors come back through `fieldOfCoreError`.
 */
export function toRewardInput(draft: RewardDraft): {
  input?: RewardInput;
  errors: DraftErrors;
} {
  const errors: DraftErrors = {};
  const title = draft.title.trim();
  const code = draft.code.trim();
  const text = (key: DraftField) => String(draft[key]).trim();

  if (!title) errors.title = 'Enter a title';
  else if (title.length > 200) errors.title = 'At most 200 characters';
  if (!CODE_PATTERN.test(code)) errors.code = 'Letters, numbers, - and _ only (at most 80)';
  if (!wholeNumber(draft.pointsCost)) errors.pointsCost = 'Enter whole points (0 for free)';
  if (text('totalSupply') && !positiveWhole(draft.totalSupply))
    errors.totalSupply = 'A positive whole number, or empty for unlimited';
  if (text('perMemberLimit') && !positiveWhole(draft.perMemberLimit))
    errors.perMemberLimit = 'A positive whole number, or empty for no limit';
  if (
    draft.expiry === 'days' &&
    !(positiveWhole(draft.validForDays) && Number(draft.validForDays) <= MAX_VALID_FOR_DAYS)
  )
    errors.validForDays = `Whole days from 1 to ${fmtNumber(MAX_VALID_FOR_DAYS)}`;
  for (const key of ['startsOn', 'closesOn'] as const)
    if (draft[key] && !DATE_PATTERN.test(draft[key])) errors[key] = 'Pick a date';
  if (draft.startsOn && draft.closesOn && draft.startsOn > draft.closesOn)
    errors.closesOn = 'On or after the opening date';
  const optionalVnd = (key: 'maxDiscountVnd' | 'minOrderVnd' | 'priceVnd') => {
    if (text(key) && !wholeNumber(draft[key])) errors[key] = 'Enter an amount in VND';
  };

  // Everything here is published on-chain on activation, in the `octap.benefit.v1` shape.
  const terms: Record<string, unknown> = { schema: BENEFIT_SCHEMA, kind: draft.kind };
  const setNumber = (key: string, value: string) => {
    if (value.trim()) terms[key] = Number(value);
  };
  optionalVnd('minOrderVnd');
  setNumber('minOrderVnd', draft.minOrderVnd);
  if (text('appliesTo')) terms.appliesTo = text('appliesTo');

  let discountValue: string | undefined;
  switch (draft.kind) {
    case 'PERCENT_OFF':
      if (!positiveAmount(draft.value) || Number(draft.value) > 100)
        errors.value = 'A percentage above 0, at most 100';
      optionalVnd('maxDiscountVnd');
      setNumber('maxDiscountVnd', draft.maxDiscountVnd);
      discountValue = text('value');
      break;
    case 'AMOUNT_OFF':
      if (!positiveAmount(draft.value)) errors.value = 'Enter an amount in VND';
      discountValue = text('value');
      break;
    case 'FREE_ITEM':
      if (!text('item')) errors.item = 'Say which item is free';
      terms.item = text('item');
      break;
    case 'BUY_X_GET_Y':
      if (!positiveWhole(draft.buyQuantity)) errors.buyQuantity = 'At least 1';
      if (!positiveWhole(draft.getQuantity)) errors.getQuantity = 'At least 1';
      if (!text('item')) errors.item = 'Say which item it applies to';
      terms.buyQuantity = Number(draft.buyQuantity);
      terms.getQuantity = Number(draft.getQuantity);
      terms.item = text('item');
      break;
    case 'FREE_SHIPPING':
      optionalVnd('maxDiscountVnd');
      setNumber('maxDiscountVnd', draft.maxDiscountVnd);
      break;
    case 'FIXED_PRICE':
      if (!text('priceVnd')) errors.priceVnd = 'Enter the special price';
      optionalVnd('priceVnd');
      if (!text('item')) errors.item = 'Say what the price is for';
      setNumber('priceVnd', draft.priceVnd);
      terms.item = text('item');
      break;
    case 'CUSTOM':
      if (!text('benefit')) errors.benefit = 'Describe what the member gets';
      terms.benefit = text('benefit');
      break;
  }
  if (Object.keys(errors).length) return { errors };

  const discountType = DISCOUNT_TYPES[draft.kind as keyof typeof DISCOUNT_TYPES];
  return {
    errors,
    input: {
      code,
      title,
      ...(text('description') && { description: text('description') }),
      pointsCost: Number(draft.pointsCost),
      ...(discountType && { discountType }),
      ...(discountValue && { discountValue }),
      terms,
      totalSupply: text('totalSupply') ? Number(draft.totalSupply) : null,
      perMemberLimit: text('perMemberLimit') ? Number(draft.perMemberLimit) : null,
      startsAt: draft.startsOn ? dayToIso(draft.startsOn, 'start') : null,
      expiresAt: draft.closesOn ? dayToIso(draft.closesOn, 'end') : null,
      validForDays: draft.expiry === 'days' ? Number(draft.validForDays) : null,
    },
  };
}

/**
 * The PATCH that saves an edited draft. Clearing a field means sending it empty: a blank
 * description and a `null` discount value (when a draft moves from percent off to a free item).
 */
export function toRewardPatch(input: RewardInput): ConsoleRewardsUpdateInput {
  return {
    ...input,
    description: input.description ?? '',
    // The spec types discountValue as a string only; Core accepts null to clear it.
    discountValue: (input.discountValue ?? null) as string | undefined,
  };
}

/** The kind of a stored reward: from its `terms`, or failing that its `discountType`. */
export function kindOf(reward: Pick<Reward, 'terms' | 'discountType'>): BenefitKind {
  const kind = reward.terms?.kind;
  if (typeof kind === 'string' && kind in KINDS) return kind as BenefitKind;
  const stored = Object.entries(DISCOUNT_TYPES).find(([, type]) => type === reward.discountType);
  return (stored?.[0] as BenefitKind | undefined) ?? 'CUSTOM';
}

/** A stored reward back as form state, to edit, view or duplicate it. */
export function fromReward(reward: Reward): RewardDraft {
  const terms = reward.terms ?? {};
  const text = (key: string) =>
    terms[key] === undefined || terms[key] === null ? '' : String(terms[key]);
  return {
    ...emptyDraft(kindOf(reward)),
    title: reward.title,
    code: reward.code,
    description: reward.description ?? '',
    pointsCost: String(reward.pointsCost),
    value: reward.discountValue ? String(Number(reward.discountValue)) : '',
    maxDiscountVnd: text('maxDiscountVnd'),
    minOrderVnd: text('minOrderVnd'),
    item: text('item'),
    buyQuantity: text('buyQuantity') || '1',
    getQuantity: text('getQuantity') || '1',
    priceVnd: text('priceVnd'),
    benefit: text('benefit'),
    appliesTo: text('appliesTo'),
    totalSupply: reward.totalSupply == null ? '' : String(reward.totalSupply),
    perMemberLimit: reward.perMemberLimit == null ? '' : String(reward.perMemberLimit),
    startsOn: isoToDay(reward.startsAt),
    closesOn: isoToDay(reward.expiresAt),
    expiry: reward.validForDays ? 'days' : 'closes',
    validForDays: reward.validForDays ? String(reward.validForDays) : '',
  };
}

/** A copy of a reward to start a new one from: its offer and rules, without its dates. */
export function duplicateOf(reward: Reward): RewardDraft {
  const copy = fromReward(reward);
  return { ...copy, code: `${copy.code.slice(0, 76)}-2`, startsOn: '', closesOn: '' };
}
