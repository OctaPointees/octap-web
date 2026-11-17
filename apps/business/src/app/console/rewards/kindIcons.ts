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
import type { BenefitKind } from './benefit';

/** One icon per reward kind, so a card or a type chip reads at a glance. */
export const KIND_ICONS: Record<BenefitKind, Icon> = {
  PERCENT_OFF: Percent,
  AMOUNT_OFF: CurrencyCircleDollar,
  FREE_ITEM: Coffee,
  BUY_X_GET_Y: ShoppingBag,
  FREE_SHIPPING: Truck,
  FIXED_PRICE: Tag,
  CUSTOM: Gift,
};
