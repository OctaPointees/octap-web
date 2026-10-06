import { differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { format, isPast, parseISO } from 'date-fns';

// * --- Number format --- * //

const numberFmt = new Intl.NumberFormat('en-US');
const compactFmt = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const vndFmt = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export const fmtNumber = (n: number) => numberFmt.format(Math.round(n));
export const fmtCompact = (n: number) => compactFmt.format(n);
export const fmtVnd = (n: number) => vndFmt.format(n);
export const fmtCompactVnd = (n: number) => `${compactFmt.format(n)} ₫`;
export const fmtPercent = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`;
export const fmtSui = (mist: number) => `${(mist / 1e9).toFixed(4)} SUI`;

// * --- Date Format (date-fns) --- * //

/** dd MMM yyyy (06 Oct 2026) */
export const fmtDate = (iso: string) => format(parseISO(iso), 'dd MMM yyyy');

/** dd MMM, HH:mm (06 Oct, 14:30) */
export const fmtDateTime = (iso: string) => format(parseISO(iso), 'dd MMM, HH:mm');

/** "just now", "5m ago", "3h from now", "12d ago", or a plain date after 30 days */
export function fmtRelative(iso: string) {
  const date = parseISO(iso);
  const now = new Date();
  const suffix = isPast(date) ? 'ago' : 'from now';

  const minutes = Math.abs(differenceInMinutes(now, date));
  const hours = Math.abs(differenceInHours(now, date));
  const days = Math.abs(differenceInDays(now, date));

  if (minutes < 1) return 'just now';
  if (hours < 1) return `${minutes}m ${suffix}`;
  if (days < 1) return `${hours}h ${suffix}`;
  if (days < 30) return `${days}d ${suffix}`;

  return fmtDate(iso);
}

// * --- String Format --- * //

/** 0x1234…abcd */
export function shortHash(hash: string, head = 6, tail = 4) {
  if (hash.length <= head + tail + 1) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

export function toTitle(s: string) {
  return s.replace(/[_.-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
