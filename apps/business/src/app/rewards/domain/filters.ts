import { fmtDate, fmtNumber } from '@/utils/format';
import { kindOf, type Reward } from './draft';
import { KIND_ORDER, KINDS, type BenefitKind } from './kinds';
import { stageOf, type Stage } from './stage';

/** The statuses people filter by. Each covers one or more stages that mean the same to them. */
export const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', stages: ['draft', 'failed'] },
  { value: 'rejected', label: 'Rejected', stages: ['rejected'] },
  { value: 'awaiting', label: 'Awaiting approval', stages: ['pending_approval'] },
  { value: 'live', label: 'Live', stages: ['publishing', 'scheduled', 'live'] },
  { value: 'paused', label: 'Paused', stages: ['paused'] },
  { value: 'ended', label: 'Ended', stages: ['claims_closed', 'sold_out', 'expired'] },
  // Drafts of an archived import (OCT-303): they never went live and can't any more.
  { value: 'archived', label: 'Archived', stages: ['archived'] },
] as const satisfies readonly { value: string; label: string; stages: readonly Stage[] }[];
export type StatusOption = (typeof STATUS_OPTIONS)[number]['value'];

/** An inclusive range of whole numbers. */
export type Range = [number, number];

/**
 * What the voucher list is narrowed to. Empty lists and `null` mean "any". Kept in the URL, so a
 * filtered list survives a reload and can be shared.
 */
export interface RewardFilters {
  status: StatusOption[];
  kinds: BenefitKind[];
  points: Range | null;
  claimed: Range | null;
  /** Claims close on or after this day (`yyyy-mm-dd`). */
  closesFrom: string | null;
  /** Claims close on or before this day (`yyyy-mm-dd`). */
  closesTo: string | null;
}

export type FilterKey = keyof RewardFilters;

export const NO_FILTERS: RewardFilters = {
  status: [],
  kinds: [],
  points: null,
  claimed: null,
  closesFrom: null,
  closesTo: null,
};

/* ------------------------------------------------------------------ URL */

const PARAM = {
  status: 'status',
  kinds: 'type',
  points: 'points',
  claimed: 'claimed',
  closesFrom: 'closesFrom',
  closesTo: 'closesTo',
} as const satisfies Record<FilterKey, string>;

const DAY = /^\d{4}-\d{2}-\d{2}$/;

function readList<T extends string>(value: string | null, allowed: readonly T[]): T[] {
  if (!value) return [];
  const wanted = new Set(value.split(','));
  return allowed.filter((item) => wanted.has(item));
}

function readRange(value: string | null): Range | null {
  const match = value?.match(/^(\d+)-(\d+)$/);
  if (!match) return null;
  const [low, high] = [Number(match[1]), Number(match[2])];
  return low <= high ? [low, high] : [high, low];
}

const readDay = (value: string | null) => (value && DAY.test(value) ? value : null);

/** The filters in a URL. Anything unknown or malformed is ignored, never an error. */
export function readFilters(params: URLSearchParams): RewardFilters {
  return {
    status: readList(
      params.get(PARAM.status),
      STATUS_OPTIONS.map((option) => option.value),
    ),
    kinds: readList(params.get(PARAM.kinds), KIND_ORDER),
    points: readRange(params.get(PARAM.points)),
    claimed: readRange(params.get(PARAM.claimed)),
    closesFrom: readDay(params.get(PARAM.closesFrom)),
    closesTo: readDay(params.get(PARAM.closesTo)),
  };
}

/** Writes the filters into `params`, leaving every other parameter alone. */
export function writeFilters(params: URLSearchParams, filters: RewardFilters) {
  const next = new URLSearchParams(params);
  const set = (key: FilterKey, value: string | null) =>
    value ? next.set(PARAM[key], value) : next.delete(PARAM[key]);
  set('status', filters.status.join(','));
  set('kinds', filters.kinds.join(','));
  set('points', filters.points && filters.points.join('-'));
  set('claimed', filters.claimed && filters.claimed.join('-'));
  set('closesFrom', filters.closesFrom);
  set('closesTo', filters.closesTo);
  return next;
}

/* ------------------------------------------------------------ Matching */

/** The smallest and largest values in the list, for a slider's ends. */
export function boundsOf(rewards: Reward[], value: (reward: Reward) => number): Range {
  if (!rewards.length) return [0, 0];
  const values = rewards.map(value);
  return [Math.min(...values), Math.max(...values)];
}

/** The day part of an ISO time, in the viewer's time zone, to compare with a date field. */
function localDay(iso: string) {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const inRange = (value: number, range: Range | null) =>
  !range || (value >= range[0] && value <= range[1]);

export function matchesFilters(reward: Reward, filters: RewardFilters, now = Date.now()) {
  if (filters.status.length) {
    const stage = stageOf(reward, now);
    const wanted = STATUS_OPTIONS.filter((option) => filters.status.includes(option.value));
    if (!wanted.some((option) => (option.stages as readonly Stage[]).includes(stage))) return false;
  }
  if (filters.kinds.length && !filters.kinds.includes(kindOf(reward))) return false;
  if (!inRange(reward.pointsCost, filters.points)) return false;
  if (!inRange(reward.claimedCount, filters.claimed)) return false;
  if (filters.closesFrom || filters.closesTo) {
    // A voucher with no closing date never matches a closing-date filter.
    if (!reward.expiresAt) return false;
    const day = localDay(reward.expiresAt);
    if (filters.closesFrom && day < filters.closesFrom) return false;
    if (filters.closesTo && day > filters.closesTo) return false;
  }
  return true;
}

/* --------------------------------------------------------------- Chips */

/** One active filter, as a removable chip. `keys` are what removing it clears. */
export interface FilterChip {
  id: string;
  label: string;
  keys: FilterKey[];
}

/** "Live, Paused" or "Live, Paused +2": short enough for a chip. */
function listLabel(labels: string[]) {
  return labels.length <= 2
    ? labels.join(', ')
    : `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`;
}

const dayLabel = (day: string) => fmtDate(`${day}T00:00:00`);

/** The active filters as chips, in the order the panel shows them. */
export function filterChips(filters: RewardFilters): FilterChip[] {
  const chips: FilterChip[] = [];
  if (filters.status.length)
    chips.push({
      id: 'status',
      keys: ['status'],
      label: listLabel(
        STATUS_OPTIONS.filter((option) => filters.status.includes(option.value)).map(
          (option) => option.label,
        ),
      ),
    });
  if (filters.kinds.length)
    chips.push({
      id: 'kinds',
      keys: ['kinds'],
      label: listLabel(filters.kinds.map((kind) => KINDS[kind].label)),
    });
  if (filters.points)
    chips.push({
      id: 'points',
      keys: ['points'],
      label: `${fmtNumber(filters.points[0])} – ${fmtNumber(filters.points[1])} points`,
    });
  if (filters.claimed)
    chips.push({
      id: 'claimed',
      keys: ['claimed'],
      label: `${fmtNumber(filters.claimed[0])} – ${fmtNumber(filters.claimed[1])} claimed`,
    });
  if (filters.closesFrom || filters.closesTo)
    chips.push({
      id: 'closes',
      keys: ['closesFrom', 'closesTo'],
      label:
        filters.closesFrom && filters.closesTo
          ? `Closes ${dayLabel(filters.closesFrom)} – ${dayLabel(filters.closesTo)}`
          : filters.closesFrom
            ? `Closes from ${dayLabel(filters.closesFrom)}`
            : `Closes by ${dayLabel(filters.closesTo!)}`,
    });
  return chips;
}

/** `filters` without the given ones. */
export function withoutFilters(filters: RewardFilters, keys: FilterKey[]): RewardFilters {
  const next = { ...filters };
  for (const key of keys) (next as Record<FilterKey, unknown>)[key] = NO_FILTERS[key];
  return next;
}
