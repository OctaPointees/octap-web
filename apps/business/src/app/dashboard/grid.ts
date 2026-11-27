/**
 * Dashboard grid settings, all in one place. Change a number here and both dashboards follow.
 *
 * People's saved layouts keep working after a change: a part saved bigger than the new limits
 * shrinks to fit, and a part saved smaller than its new minimum grows to it.
 */

export const GRID = {
  /** Columns at each screen size. `wide` is also the widest a part can be. */
  columns: { phone: 1, tablet: 2, wide: 5 },
  /** Screen widths where tablet and wide begin (48rem = 768px, 80rem = 1280px). */
  tabletFrom: '48rem',
  wideFrom: '80rem',
  /** Height of one row. 4rem = 64px. */
  rowHeight: '4rem',
  /** Space between cells. 1rem = 16px. */
  gap: '1rem',
  /** The tallest a part can be made, in rows. */
  tallestPart: 12,
} as const;

/**
 * Each part's size when someone first sees it, or after Reset: `w` columns wide, `h` rows tall.
 * `minW` and `minH` are the smallest it can be resized to (1 column and 2 rows if left out).
 */
export interface PartSizeSetting {
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

/** The Business dashboard, in its default order. */
export const BUSINESS_PARTS = {
  stats: { w: 5, h: 2, minW: 2, minH: 2 },
  members: { w: 5, h: 6, minW: 2, minH: 4 },
  top: { w: 2, h: 6, minH: 3 },
  pipeline: { w: 2, h: 6, minH: 3 },
  closing: { w: 1, h: 6 },
} satisfies Record<string, PartSizeSetting>;

/** The Developer dashboard, in its default order. */
export const DEVELOPER_PARTS = {
  stats: { w: 5, h: 2, minW: 2, minH: 2 },
  setup: { w: 3, h: 6, minH: 3 },
  keys: { w: 2, h: 3 },
  webhooks: { w: 2, h: 3 },
} satisfies Record<string, PartSizeSetting>;

/** A setting above as the size and minimum the layout works with. */
export function sizing({ w, h, minW = 1, minH = 2 }: PartSizeSetting) {
  return { size: { w, h }, min: { w: minW, h: minH } };
}
