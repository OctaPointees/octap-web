import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Slider } from '@base-ui/react/slider';
import { CaretDown, Funnel, X } from 'phosphor-react';
import { Button } from '@octap/shared/components';
import { cn } from '@/utils/cn';
import { fmtNumber } from '@/utils/format';
import {
  boundsOf,
  filterChips,
  STATUS_OPTIONS,
  withoutFilters,
  type FilterChip,
  type Range,
  type RewardFilters,
} from '../domain/filters';
import { kindOf, type Reward } from '../domain/draft';
import { KIND_ORDER, KINDS } from '../domain/kinds';
import { stageOf, type Stage } from '../domain/stage';

/* --------------------------------------------------------------- Panel */

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-2 px-5 py-4">
      <legend className="mb-1 float-left w-full text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

function CheckRow({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
      <input
        type="checkbox"
        className="checkbox checkbox-primary checkbox-sm"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="text-xs opacity-50 tabular-nums">{fmtNumber(count)}</span>
    </label>
  );
}

const toggled = <T,>(list: T[], item: T, on: boolean) =>
  on ? [...list, item] : list.filter((value) => value !== item);

/**
 * A two-handle slider between the list's smallest and largest value. It follows the handles while
 * dragging and only filters once they are let go, so the list and URL don't churn. Pulled back to
 * both ends, it means "any".
 */
function RangeField({
  label,
  unit,
  bounds,
  value,
  onCommit,
}: {
  label: string;
  unit: string;
  bounds: Range;
  value: Range | null;
  onCommit: (value: Range | null) => void;
}) {
  const [min, max] = bounds;
  const committed: Range = value
    ? [Math.max(min, Math.min(value[0], max)), Math.min(max, Math.max(value[1], min))]
    : bounds;
  const [dragging, setDragging] = useState<Range | null>(null);
  const shown = dragging ?? committed;
  const labelId = useId();
  const flat = min === max;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span id={labelId} className="font-medium">
          {label}
        </span>
        <span className="text-xs tabular-nums opacity-70">
          {fmtNumber(shown[0])} – {fmtNumber(shown[1])} {unit}
        </span>
      </div>
      <Slider.Root
        aria-labelledby={labelId}
        value={shown}
        min={min}
        max={max}
        disabled={flat}
        onValueChange={(next) => setDragging(next as Range)}
        onValueCommitted={(next) => {
          const [low, high] = next as Range;
          setDragging(null);
          onCommit(low <= min && high >= max ? null : [low, high]);
        }}
      >
        <Slider.Control className="flex h-6 w-full touch-none items-center select-none">
          <Slider.Track className="relative h-1 w-full rounded-full bg-base-300">
            <Slider.Indicator className="rounded-full bg-primary" />
            {[0, 1].map((index) => (
              <Slider.Thumb
                key={index}
                index={index}
                getAriaLabel={(thumb) => `${label}, ${thumb === 0 ? 'lowest' : 'highest'}`}
                className="size-4 rounded-full border-2 border-primary bg-base-100 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-[dragging]:scale-110"
              />
            ))}
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      {flat && <p className="text-xs opacity-50">Every voucher has the same value.</p>}
    </div>
  );
}

function FilterPanel({
  id,
  rewards,
  filters,
  onChange,
}: {
  id: string;
  rewards: Reward[];
  filters: RewardFilters;
  onChange: (next: RewardFilters) => void;
}) {
  const stages = rewards.map((reward) => stageOf(reward));
  const kinds = rewards.map((reward) => kindOf(reward));
  const statusCount = (wanted: readonly Stage[]) =>
    stages.filter((stage) => wanted.includes(stage)).length;
  const set = (patch: Partial<RewardFilters>) => onChange({ ...filters, ...patch });

  return (
    <div
      id={id}
      className="grid divide-base-300 max-md:divide-y md:grid-cols-[1fr_1fr_1.5fr] md:divide-x"
    >
      <Column title="Status">
        {STATUS_OPTIONS.map((option) => (
          <CheckRow
            key={option.value}
            label={option.label}
            count={statusCount(option.stages)}
            checked={filters.status.includes(option.value)}
            onChange={(on) => set({ status: toggled(filters.status, option.value, on) })}
          />
        ))}
      </Column>
      <Column title="Type">
        {KIND_ORDER.map((kind) => (
          <CheckRow
            key={kind}
            label={KINDS[kind].label}
            count={kinds.filter((item) => item === kind).length}
            checked={filters.kinds.includes(kind)}
            onChange={(on) => set({ kinds: toggled(filters.kinds, kind, on) })}
          />
        ))}
      </Column>
      <Column title="Numbers and dates">
        <div className="flex flex-col gap-5">
          <RangeField
            label="Points"
            unit="points"
            bounds={boundsOf(rewards, (reward) => reward.pointsCost)}
            value={filters.points}
            onCommit={(points) => set({ points })}
          />
          <RangeField
            label="Claimed"
            unit="claimed"
            bounds={boundsOf(rewards, (reward) => reward.claimedCount)}
            value={filters.claimed}
            onCommit={(claimed) => set({ claimed })}
          />
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Claims close between</span>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs">
                <span className="opacity-60">From</span>
                <input
                  type="date"
                  className="input input-sm w-full"
                  value={filters.closesFrom ?? ''}
                  max={filters.closesTo ?? undefined}
                  onChange={(event) => set({ closesFrom: event.target.value || null })}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="opacity-60">To</span>
                <input
                  type="date"
                  className="input input-sm w-full"
                  value={filters.closesTo ?? ''}
                  min={filters.closesFrom ?? undefined}
                  onChange={(event) => set({ closesTo: event.target.value || null })}
                />
              </label>
            </div>
            <p className="text-xs opacity-50">Vouchers with no closing date are left out.</p>
          </div>
        </div>
      </Column>
    </div>
  );
}

/* ----------------------------------------------------------------- Bar */

function Chip({ chip, onRemove }: { chip: FilterChip; onRemove?: () => void }) {
  return (
    <span className="badge badge-soft badge-primary h-7 shrink-0 gap-1 pr-1 whitespace-nowrap">
      {chip.label}
      <button
        type="button"
        tabIndex={onRemove ? undefined : -1}
        aria-label={`Remove filter: ${chip.label}`}
        className="flex size-5 cursor-pointer items-center justify-center rounded-full hover:bg-primary/15"
        onClick={onRemove}
      >
        <X size={12} weight="bold" aria-hidden />
      </button>
    </span>
  );
}

/** Pixels the bar's fixed parts take besides its chips: padding, the label, the caret, gaps. */
const BAR_GAP = 8;
const MORE_WIDTH = 40;
/** From this width the open panel pushes the list down instead of floating over it (`lg`). */
const INLINE_FROM = '(min-width: 64rem)';

/**
 * Narrows the voucher list. Collapsed, it is a bar of the active filters as chips that grows and
 * shrinks with them, with "+N" for those that don't fit and Clear riding along beside it. Opened,
 * the bar becomes the tab of a panel with every filter.
 */
export function FilterBar({
  rewards,
  filters,
  onChange,
  onClear,
  end,
}: {
  rewards: Reward[];
  /** At the far right of the bar's row, such as the view switch. The open panel spans under it. */
  end?: ReactNode;
  filters: RewardFilters;
  onChange: (next: RewardFilters) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const clear = useRef<HTMLButtonElement>(null);
  const trailing = useRef<HTMLDivElement>(null);
  const measure = useRef<HTMLDivElement>(null);
  const chips = filterChips(filters);
  const chipKey = chips.map((chip) => chip.label).join('|');
  const [fit, setFit] = useState(chips.length);
  const [width, setWidth] = useState<number | null>(null);
  const shownChips = chips.slice(0, fit);
  const hidden = chips.length - shownChips.length;

  // How many chips fit beside Clear. Measured from an invisible copy of every chip.
  useLayoutEffect(() => {
    const bar = row.current;
    const copies = measure.current;
    if (!bar || !copies) return;
    const update = () => {
      const fixed = Array.from(copies.querySelectorAll<HTMLElement>('[data-fixed]')).reduce(
        (sum, element) => sum + element.offsetWidth + BAR_GAP,
        24,
      );
      const room =
        bar.clientWidth -
        (clear.current?.offsetWidth ?? 0) -
        (trailing.current ? trailing.current.offsetWidth + BAR_GAP : 0) -
        BAR_GAP -
        fixed;
      const widths = Array.from(copies.querySelectorAll<HTMLElement>('[data-chip]')).map(
        (element) => element.offsetWidth + BAR_GAP,
      );
      let used = 0;
      let count = 0;
      for (const [index, chipWidth] of widths.entries()) {
        const more = index < widths.length - 1 ? MORE_WIDTH : 0;
        if (used + chipWidth + more > room) break;
        used += chipWidth;
        count += 1;
      }
      setFit(count);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [chipKey]);

  // The bar's width follows its content, so it can animate between sizes.
  useLayoutEffect(() => {
    const element = content.current;
    if (!element) return;
    const update = () => setWidth(element.offsetWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Closes on Escape. Where it floats over the list, a press outside closes it too, like a menu;
  // on big screens it is part of the page, so the list below stays usable while it is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    const onPress = (event: PointerEvent) =>
      !window.matchMedia(INLINE_FROM).matches &&
      wrap.current &&
      !wrap.current.contains(event.target as Node) &&
      setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPress);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPress);
    };
  }, [open]);

  const label = (
    <span data-fixed className="flex shrink-0 items-center gap-1.5 text-sm font-medium">
      <Funnel size={16} aria-hidden />
      Filter
    </span>
  );

  return (
    <div ref={wrap} className="relative min-w-0">
      <div ref={row} className="relative flex items-start gap-2">
        {/* Invisible copies, only for measuring which chips fit. */}
        <div
          ref={measure}
          aria-hidden
          className="pointer-events-none invisible absolute top-0 left-0 flex w-max items-center gap-2"
        >
          {label}
          <span data-fixed className="size-6" />
          {chips.map((chip) => (
            <span key={chip.id} data-chip>
              <Chip chip={chip} />
            </span>
          ))}
        </div>

        <div
          className={cn(
            'relative z-20 h-11 shrink-0 rounded-box border border-base-300 bg-base-100 motion-safe:transition-[width,border-radius] motion-safe:duration-(--motion-base) motion-safe:ease-out',
            open && 'rounded-b-none border-b-transparent',
          )}
          style={width === null ? undefined : { width: width + 2 }}
        >
          <div ref={content} className="flex h-full w-max items-center gap-2 pr-1.5 pl-3">
            {label}
            {shownChips.map((chip) => (
              <Chip
                key={chip.id}
                chip={chip}
                onRemove={() => onChange(withoutFilters(filters, chip.keys))}
              />
            ))}
            {hidden > 0 && (
              <button
                type="button"
                className="badge badge-outline h-7 shrink-0 cursor-pointer tabular-nums"
                aria-label={`${hidden} more filters`}
                onClick={() => setOpen(true)}
              >
                +{hidden}
              </button>
            )}
            {!chips.length && <span className="text-sm opacity-50">None</span>}
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={open ? 'Hide filters' : 'Show filters'}
              className="btn btn-ghost btn-sm btn-square"
              onClick={() => setOpen(!open)}
            >
              <CaretDown
                size={16}
                className={cn('motion-safe:transition-transform', open && 'rotate-180')}
                aria-hidden
              />
            </button>
          </div>
        </div>

        <Button
          ref={clear}
          // Above the open panel's top edge, which runs underneath it.
          className="relative z-20 h-11 shrink-0 border-base-300 bg-base-100"
          disabled={!chips.length}
          onClick={onClear}
        >
          Clear
        </Button>
        {end && (
          <div ref={trailing} className="ml-auto shrink-0 self-center">
            {end}
          </div>
        )}
      </div>

      {/* Big screens: part of the page, pushing the list down. Smaller ones: floats over it. Stays
          mounted so it can slide open and shut: the row grows from 0fr to 1fr, a bit slower in
          than out. */}
      <div
        inert={!open}
        className={cn(
          'z-10 grid w-full motion-safe:transition-[grid-template-rows,opacity,margin] max-lg:absolute max-lg:top-[calc(2.75rem-1px)] max-lg:left-0 lg:relative',
          open
            ? 'grid-rows-[1fr] opacity-100 ease-enter motion-safe:duration-(--motion-slow) lg:-mt-px'
            : 'pointer-events-none grid-rows-[0fr] opacity-0 ease-out motion-safe:duration-(--motion-base)',
        )}
      >
        <div className="min-h-0 overflow-hidden rounded-box rounded-tl-none border border-base-300 bg-base-100 max-lg:shadow-lg">
          <FilterPanel id={panelId} rewards={rewards} filters={filters} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
