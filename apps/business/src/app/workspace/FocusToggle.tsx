import { useRef, useState } from 'react';
import { cn } from '@/utils/cn';
import { FOCUSES, useFocus, useSwitchFocus, type Focus } from './focus';

const BAR = 'var(--size-sidebar-thumb)';
const DURATION = 470;

const rest: Record<Focus, string> = {
  business: `inset(0 calc(100% - ${BAR}) 0 0)`,
  developer: `inset(0 0 0 calc(100% - ${BAR}))`,
};
const covered = 'inset(0 0 0 0)';

export function FocusToggle({ compact = false }: { compact?: boolean }) {
  const focus = useFocus();
  const switchTo = useSwitchFocus();

  const fill = useRef<HTMLSpanElement>(null);
  const [switching, setSwitching] = useState(false);

  const next: Focus = focus === 'business' ? 'developer' : 'business';
  const { label, icon: ModeIcon } = FOCUSES[focus];

  const toggle = () => {
    if (switching) return;

    const layer = fill.current;

    if (!layer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      switchTo(next);
      return;
    }

    setSwitching(true);

    const animation = layer.animate(
      [{ clipPath: rest[focus] }, { clipPath: covered, offset: 0.5 }, { clipPath: rest[next] }],
      { duration: DURATION, easing: 'cubic-bezier(0.70, 0.12, 0, 1.00)' },
    );

    window.setTimeout(() => switchTo(next), DURATION / 2);

    void animation.finished.catch(() => {}).finally(() => setSwitching(false));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`${label} mode. Switch to ${FOCUSES[next].label} mode`}
      title={`${label} mode: ${FOCUSES[focus].description}. Click for ${FOCUSES[next].label} mode.`}
      className="bg-pattern-blur-blobs relative flex h-13 w-full items-center justify-center overflow-hidden font-medium outline-none hover:border-base-content/30 focus-visible:ring-2 focus-visible:ring-primary cursor-pointer transition-all"
    >
      <span className="flex min-w-0 items-center gap-2 px-3">
        <ModeIcon size="1.5em" className={cn('shrink-0 block')} />
        <span className={cn('truncate max-lg:sr-only', compact && 'sr-only')}>{label} Mode</span>
      </span>
      <span
        ref={fill}
        aria-hidden
        className={cn('pointer-events-none absolute inset-0 bg-primary')}
        style={{ clipPath: rest[focus] }}
      />
    </button>
  );
}
