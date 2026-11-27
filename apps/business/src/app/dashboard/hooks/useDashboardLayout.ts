import { useState, useSyncExternalStore } from 'react';
import { GRID } from '../grid';

/** A part's size in grid cells: columns across, rows down. */
export interface PartSize {
  w: number;
  h: number;
}

/** What the layout needs to know about a part. */
export interface PartSpec {
  id: string;
  /** Its size until the person resizes it. */
  size: PartSize;
  /** The smallest it may get. Defaults to one column by two rows. */
  min?: PartSize;
}

/** The order of a dashboard's parts, which are hidden, and their sizes, as one person left them. */
export interface DashboardLayout {
  order: string[];
  hidden: string[];
  sizes: Record<string, PartSize>;
}

/** The widest the grid gets. Narrower screens show fewer columns. */
export const MAX_COLUMNS: number = GRID.columns.wide;
/** The tallest a part can be made, in rows. */
export const MAX_ROWS: number = GRID.tallestPart;
const DEFAULT_MIN: PartSize = { w: 1, h: 2 };

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** Keeps a size whole and within the part's minimum and the grid's maximum. */
export function fitSize(size: PartSize, spec: PartSpec): PartSize {
  const min = spec.min ?? DEFAULT_MIN;
  return {
    w: clamp(Math.round(size.w), min.w, MAX_COLUMNS),
    h: clamp(Math.round(size.h), min.h, MAX_ROWS),
  };
}

const storageKey = (dashboard: string) => `octap.business.dashboardLayout.${dashboard}`;

const defaults = (specs: PartSpec[]): DashboardLayout => ({
  order: specs.map((spec) => spec.id),
  hidden: [],
  sizes: Object.fromEntries(specs.map((spec) => [spec.id, spec.size])),
});

/**
 * Lines a saved layout up with the parts the dashboard has now: parts that no longer exist drop
 * out, new ones join at the end at their default size, and saved sizes are kept in bounds.
 */
function reconcile(saved: Partial<DashboardLayout> | null, specs: PartSpec[]): DashboardLayout {
  const known = new Map(specs.map((spec) => [spec.id, spec]));
  const order = (saved?.order ?? []).filter((id) => known.has(id));
  for (const spec of specs) if (!order.includes(spec.id)) order.push(spec.id);
  const sizes: Record<string, PartSize> = {};
  for (const spec of specs) {
    const kept = saved?.sizes?.[spec.id];
    sizes[spec.id] =
      kept && Number.isFinite(kept.w) && Number.isFinite(kept.h) ? fitSize(kept, spec) : spec.size;
  }
  return { order, hidden: (saved?.hidden ?? []).filter((id) => known.has(id)), sizes };
}

function read(dashboard: string, specs: PartSpec[]) {
  try {
    const raw = localStorage.getItem(storageKey(dashboard));
    return reconcile(raw ? (JSON.parse(raw) as Partial<DashboardLayout>) : null, specs);
  } catch {
    return defaults(specs);
  }
}

function write(dashboard: string, layout: DashboardLayout) {
  try {
    localStorage.setItem(storageKey(dashboard), JSON.stringify(layout));
  } catch {
    /* Storage can be unavailable (private mode, blocked site data). Kept for this visit. */
  }
}

/**
 * How one person arranged a dashboard, kept in this browser. `specs` lists every part in the
 * default order at its default size; Reset goes back to that with nothing hidden.
 */
export function useDashboardLayout(dashboard: string, specs: PartSpec[]) {
  const [layout, setLayout] = useState(() => read(dashboard, specs));
  const update = (next: DashboardLayout) => {
    setLayout(next);
    write(dashboard, next);
  };
  const initial = defaults(specs);

  const visible = layout.order.filter((id) => !layout.hidden.includes(id));
  const isDefault =
    !layout.hidden.length &&
    layout.order.every((id, index) => id === initial.order[index]) &&
    specs.every(({ id, size }) => layout.sizes[id]?.w === size.w && layout.sizes[id]?.h === size.h);

  /** Puts `id` where `over` is, among the visible parts. Hidden parts keep their place. */
  const moveTo = (id: string, over: string) => {
    if (id === over) return;
    const order = layout.order.filter((item) => item !== id);
    const target = order.indexOf(over);
    const after = layout.order.indexOf(id) < layout.order.indexOf(over);
    order.splice(after ? target + 1 : target, 0, id);
    update({ ...layout, order });
  };

  return {
    visible,
    hidden: layout.order.filter((id) => layout.hidden.includes(id)),
    isDefault,
    sizeOf: (id: string) => layout.sizes[id] ?? DEFAULT_MIN,
    moveTo,
    /** One step earlier (-1) or later (1) among the visible parts. */
    step: (id: string, by: -1 | 1) => {
      const neighbour = visible[visible.indexOf(id) + by];
      if (neighbour) moveTo(id, neighbour);
    },
    /** `size` in whole cells and within the part's bounds, as `resize` would save it. */
    fit: (id: string, size: PartSize) => {
      const spec = specs.find((item) => item.id === id);
      return spec ? fitSize(size, spec) : size;
    },
    resize: (id: string, size: PartSize) => {
      const spec = specs.find((item) => item.id === id);
      if (!spec) return;
      const next = fitSize(size, spec);
      const current = layout.sizes[id];
      if (current?.w === next.w && current.h === next.h) return;
      update({ ...layout, sizes: { ...layout.sizes, [id]: next } });
    },
    hide: (id: string) => update({ ...layout, hidden: [...layout.hidden, id] }),
    show: (id: string) =>
      update({ ...layout, hidden: layout.hidden.filter((item) => item !== id) }),
    reset: () => update(initial),
  };
}
export type DashboardLayoutControls = ReturnType<typeof useDashboardLayout>;

/* How many columns the grid has at each screen size is set in `GRID`. */
const WIDE = `(min-width: ${GRID.wideFrom})`;
const MEDIUM = `(min-width: ${GRID.tabletFrom})`;
const columns = () =>
  window.matchMedia(WIDE).matches
    ? GRID.columns.wide
    : window.matchMedia(MEDIUM).matches
      ? GRID.columns.tablet
      : GRID.columns.phone;
function subscribe(listener: () => void) {
  const queries = [window.matchMedia(WIDE), window.matchMedia(MEDIUM)];
  queries.forEach((query) => query.addEventListener('change', listener));
  return () => queries.forEach((query) => query.removeEventListener('change', listener));
}

/** How many columns the dashboard grid has at the current screen width. */
export function useGridColumns() {
  return useSyncExternalStore(subscribe, columns, () => MAX_COLUMNS);
}
