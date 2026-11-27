import type { VoucherRefundPolicySnapshot } from '@octap/internal-sdk';

/** The settings of a refund policy, without its version or who published it. */
export type RefundRules = Pick<
  VoucherRefundPolicySnapshot,
  'allowUnused' | 'allowExpired' | 'allowRedeemed' | 'restockUnused' | 'refundWindowDays'
>;

/** Core's version 0, which applies until an Owner publishes a policy. */
export const DEFAULT_REFUND_RULES: RefundRules = {
  allowUnused: true,
  allowExpired: false,
  allowRedeemed: false,
  restockUnused: true,
  refundWindowDays: null,
};

export const MAX_REFUND_WINDOW_DAYS = 3650;

/** The form's state. The window stays a string, so its input can be cleared while typing. */
export interface RefundDraft {
  allowUnused: boolean;
  allowExpired: boolean;
  allowRedeemed: boolean;
  restockUnused: boolean;
  limited: boolean;
  windowDays: string;
}

export const toRefundDraft = (rules: RefundRules): RefundDraft => ({
  allowUnused: rules.allowUnused,
  allowExpired: rules.allowExpired,
  allowRedeemed: rules.allowRedeemed,
  restockUnused: rules.restockUnused,
  limited: rules.refundWindowDays !== null,
  windowDays: rules.refundWindowDays === null ? '' : String(rules.refundWindowDays),
});

export function refundWindowError({ limited, windowDays }: RefundDraft) {
  if (!limited) return undefined;
  const days = Number(windowDays.trim());
  return /^\d+$/.test(windowDays.trim()) && days >= 1 && days <= MAX_REFUND_WINDOW_DAYS
    ? undefined
    : `A whole number from 1 to ${MAX_REFUND_WINDOW_DAYS}`;
}

/**
 * The rules to publish, or `null` while the window is invalid. Restocking only applies to unused
 * refunds, so with those off it keeps the published value.
 */
export function toRefundRules(draft: RefundDraft, base: RefundRules): RefundRules | null {
  if (refundWindowError(draft)) return null;
  return {
    allowUnused: draft.allowUnused,
    allowExpired: draft.allowExpired,
    allowRedeemed: draft.allowRedeemed,
    restockUnused: draft.allowUnused ? draft.restockUnused : base.restockUnused,
    refundWindowDays: draft.limited ? Number(draft.windowDays.trim()) : null,
  };
}

const refundable = (allowed: boolean) => (allowed ? 'Refundable' : 'Not refundable');

/** The rules in plain words, one row each. */
export function describeRefundRules(rules: RefundRules) {
  const restock = rules.restockUnused ? 'Yes' : 'No';
  return [
    { label: 'Unused', value: refundable(rules.allowUnused) },
    { label: 'Expired', value: refundable(rules.allowExpired) },
    { label: 'Already used', value: refundable(rules.allowRedeemed) },
    { label: 'Return to stock', value: rules.allowUnused ? restock : 'Does not apply' },
    {
      label: 'Refund window',
      value:
        rules.refundWindowDays === null
          ? 'No limit'
          : `Within ${rules.refundWindowDays} ${rules.refundWindowDays === 1 ? 'day' : 'days'} of claiming`,
    },
  ];
}

export type RefundRuleChange = { label: string; before: string; after: string };

/** What differs between two policies, as a merchant would read it. */
export function refundRuleChanges(before: RefundRules, after: RefundRules): RefundRuleChange[] {
  const previous = describeRefundRules(before);
  return describeRefundRules(after).flatMap((row, index) =>
    row.value === previous[index].value
      ? []
      : [{ label: row.label, before: previous[index].value, after: row.value }],
  );
}
