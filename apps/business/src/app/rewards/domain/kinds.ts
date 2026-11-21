import {
  Coffee,
  CurrencyCircleDollar,
  Gift,
  Percent,
  ShoppingBag,
  Tag,
  Truck,
  type Icon,
} from 'phosphor-react';
import { fmtVnd } from '@/utils/format';

/**
 * What a reward gives the member. Core stores three kinds as `discountType` (percent off, amount
 * off, free item); the rest live only in `terms`. Everything in `terms` is published on-chain when
 * the reward is activated, and Core does not enforce it: the merchant applies it at checkout.
 */
export type BenefitKind =
  | 'PERCENT_OFF'
  | 'AMOUNT_OFF'
  | 'FREE_ITEM'
  | 'BUY_X_GET_Y'
  | 'FREE_SHIPPING'
  | 'FIXED_PRICE'
  | 'CUSTOM';

/** Marks `terms` written in this shape, so whoever reads them knows which fields to expect. */
export const BENEFIT_SCHEMA = 'octap.benefit.v1';

/** The longest `validForDays` Core and the contract accept. */
export const MAX_VALID_FOR_DAYS = 3650;

export const KINDS: Record<BenefitKind, { label: string; hint: string; icon: Icon }> = {
  PERCENT_OFF: {
    label: 'Percent off',
    hint: `e.g. 20% off, up to ${fmtVnd(50000)}`,
    icon: Percent,
  },
  AMOUNT_OFF: {
    label: 'Amount off',
    hint: `e.g. ${fmtVnd(30000)} off an order`,
    icon: CurrencyCircleDollar,
  },
  FREE_ITEM: { label: 'Free item', hint: 'e.g. a free drink or a free upsize', icon: Coffee },
  BUY_X_GET_Y: { label: 'Buy X get Y', hint: 'e.g. buy 1 get 1 free', icon: ShoppingBag },
  FREE_SHIPPING: {
    label: 'Free delivery',
    hint: `e.g. free delivery up to ${fmtVnd(20000)}`,
    icon: Truck,
  },
  FIXED_PRICE: { label: 'Special price', hint: `e.g. a combo for ${fmtVnd(99000)}`, icon: Tag },
  CUSTOM: { label: 'Custom', hint: 'Any other gift or experience', icon: Gift },
};

export const KIND_ORDER = Object.keys(KINDS) as BenefitKind[];

/** The kinds Core stores as `discountType`. */
export const DISCOUNT_TYPES = {
  PERCENT_OFF: 'PERCENTAGE',
  AMOUNT_OFF: 'FIXED_AMOUNT',
  FREE_ITEM: 'FREE_ITEM',
} as const satisfies Partial<Record<BenefitKind, string>>;

/**
 * Core cannot clear a draft's `discountType`, so a draft saved as one of the three discount kinds
 * cannot become a kind that has none.
 */
export const hasDiscountType = (kind: BenefitKind) => kind in DISCOUNT_TYPES;
