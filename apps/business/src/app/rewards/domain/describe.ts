import { fmtDate, fmtNumber, fmtVnd } from '@/utils/format';
import type { Reward, RewardDraft } from './draft';

const plural = (n: number, word: string) => `${fmtNumber(n)} ${word}${n === 1 ? '' : 's'}`;
const endOf = (day: string) => fmtDate(`${day}T23:59:59`);
const vnd = (value: string) =>
  value.trim() && Number.isFinite(Number(value)) ? fmtVnd(Number(value)) : '…';

/** The offer alone, without its conditions: "20% off, up to 50.000 ₫". */
export function describeOffer(draft: RewardDraft): string {
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
  return parts.join(', ');
}

/** What the member gets, in one line: "20% off, up to 50.000 ₫, orders from 200.000 ₫". */
export function describeBenefit(draft: RewardDraft): string {
  const parts = [describeOffer(draft)];
  if (draft.minOrderVnd) parts.push(`orders from ${vnd(draft.minOrderVnd)}`);
  if (draft.appliesTo) parts.push(draft.appliesTo);
  return parts.join(', ');
}

/**
 * How long a member can use their voucher: "Use within 14 days of claiming, by 31 Dec 2027 at the
 * latest", "Use by 31 Dec 2027", or "No expiry".
 */
export function describeValidity(draft: Pick<RewardDraft, 'expiry' | 'validForDays' | 'closesOn'>) {
  const days = Number(draft.validForDays);
  if (draft.expiry === 'days') {
    const own = `Use within ${days > 0 ? plural(days, 'day') : '… days'} of claiming`;
    return draft.closesOn ? `${own}, by ${endOf(draft.closesOn)} at the latest` : own;
  }
  return draft.closesOn ? `Use by ${endOf(draft.closesOn)}` : 'No expiry';
}

/** The claim dates under their own label: "1 Dec to 31 Dec 2026", "Until …", or "Open, …". */
export function describeClaimDates(draft: Pick<RewardDraft, 'startsOn' | 'closesOn'>) {
  const opens = draft.startsOn ? fmtDate(`${draft.startsOn}T00:00:00`) : '';
  const closes = draft.closesOn ? endOf(draft.closesOn) : '';
  if (opens && closes) return `${opens} to ${closes}`;
  if (closes) return `Until ${closes}`;
  if (opens) return `From ${opens}, no closing date`;
  return 'Open, no closing date';
}

/** When members can claim it: "Claims 1 Dec to 31 Dec 2026", "Claims until …", or open. */
export function describeClaimWindow(draft: Pick<RewardDraft, 'startsOn' | 'closesOn'>) {
  const dates = describeClaimDates(draft);
  return `Claims ${dates[0]!.toLowerCase()}${dates.slice(1)}`;
}

/** "Up to 3 per member", or "No per-member limit". */
export function describeMemberLimit(draft: Pick<RewardDraft, 'perMemberLimit'>) {
  const limit = Number(draft.perMemberLimit);
  return limit > 0 ? `Up to ${fmtNumber(limit)} per member` : 'No per-member limit';
}

/** "12 of 100 claimed, 88 left", or "12 claimed, unlimited". */
export function describeSupply(reward: Pick<Reward, 'totalSupply' | 'claimedCount'>) {
  if (reward.totalSupply == null) return `${fmtNumber(reward.claimedCount)} claimed, unlimited`;
  const left = Math.max(reward.totalSupply - reward.claimedCount, 0);
  return `${fmtNumber(reward.claimedCount)} of ${fmtNumber(reward.totalSupply)} claimed, ${fmtNumber(left)} left`;
}

/** "Free", or "500 points". */
export const describePoints = (points: number) =>
  points === 0 ? 'Free' : `${fmtNumber(points)} point${points === 1 ? '' : 's'}`;
