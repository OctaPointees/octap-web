import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowSquareOut, CaretDoubleLeft, CaretDoubleRight, type Icon } from 'phosphor-react';
import { NavLink, useLocation } from 'react-router';
import { cn } from '../../utils/cn';

export type NavOption = {
  label: string;
  path: string;
  icon: Icon;
  /** Count badge, e.g. items awaiting review. */
  badge?: number;
  end?: boolean;
  /** Another app (e.g. the admin portal): listed apart from this portal's pages. */
  external?: boolean;

  active?: (path: string) => boolean;
};

type Props = {
  options: NavOption[];
  /** Above the pages, such as a menu switch. Told whether the panel is a rail. */
  header?: (retracted: boolean) => React.ReactNode;
  footer?: React.ReactNode;
} & React.ComponentProps<'aside'>;

/**
 * The panel retracts to an icon rail, `--size-sidebar-retract` wide: always on md–lg, and on
 * larger screens when the user retracts it with the toggle at the bottom. Labels stay as the
 * accessible name while hidden.
 */
const label = (retracted: boolean) => cn('truncate max-lg:sr-only', retracted && 'sr-only');
const row = (retracted: boolean) =>
  cn(
    'btn btn-block h-12 justify-between rounded-none px-5 max-lg:justify-center max-lg:px-0 font-medium',
    retracted && 'justify-center px-0',
  );
/** Hidden whenever the panel is a rail. */
const railHidden = (retracted: boolean) => cn('max-lg:hidden', retracted && 'hidden');

/** The user's choice survives reloads. Storage can be unavailable, so it falls back to open. */
const retractedKey = 'octap.business.sidebarRetracted';
const savedRetracted = () => {
  try {
    return localStorage.getItem(retractedKey) === 'true';
  } catch {
    return false;
  }
};

/**
 * The line beside the active page. When the page changes it stays where it was, stretches until
 * it reaches the new page, then lets go of the old one, like an inchworm. It sits at the active
 * row at once on first render, and without motion when the user asks for reduced motion.
 */
function useActiveLine(pathname: string, pages: string) {
  const nav = useRef<HTMLElement>(null);
  const line = useRef<HTMLSpanElement>(null);
  const last = useRef<{ top: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const list = nav.current;
    const bar = line.current;
    if (!list || !bar) return;
    const active = list.querySelector<HTMLElement>('[data-active]');
    if (!active) {
      bar.style.opacity = '0';
      last.current = null;
      return;
    }
    const box = active.getBoundingClientRect();
    const top = box.top - list.getBoundingClientRect().top;
    const next = { top, height: box.height };
    const from = last.current;
    last.current = next;

    bar.style.opacity = '1';
    bar.style.top = `${next.top}px`;
    bar.style.height = `${next.height}px`;
    if (!from || from.top === next.top) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Stretch to cover both rows, then shrink onto the new one.
    const spanTop = Math.min(from.top, next.top);
    const spanBottom = Math.max(from.top + from.height, next.top + next.height);
    const animation = bar.animate(
      [
        { top: `${from.top}px`, height: `${from.height}px` },
        { top: `${spanTop}px`, height: `${spanBottom - spanTop}px`, offset: 0.5 },
        { top: `${next.top}px`, height: `${next.height}px` },
      ],
      { duration: 250, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' },
    );
    return () => animation.cancel();
  }, [pathname, pages]);

  return { nav, line };
}

export default function SidePanel({ options, header, footer, className }: Props) {
  const pages = options.filter((opt) => !opt.external);
  const external = options.filter((opt) => opt.external);
  const [retracted, setRetracted] = useState(savedRetracted);
  const { pathname } = useLocation();
  // The line follows the page, and the menu too: another menu can list the same page elsewhere.
  const { nav: navRef, line: lineRef } = useActiveLine(
    pathname,
    pages.map((page) => page.path).join('|'),
  );
  const toggle = () => {
    setRetracted(!retracted);
    try {
      localStorage.setItem(retractedKey, String(!retracted));
    } catch {
      /* Storage can be unavailable (private mode, blocked site data). */
    }
  };

  return (
    <aside
      className={cn(
        // Background turned off for now: 'bg-primary'
        'flex w-72 shrink-0 flex-col overflow-x-hidden overflow-y-auto border-r border-base-300 bg-base-100 text-base-content transition-[width] duration-200 max-md:hidden max-lg:w-(--size-sidebar-retract) shadow-md',
        retracted && 'w-(--size-sidebar-retract)',
        className,
      )}
      // style={{
      //   background: 'linear-gradient(165deg, var(--color-primary) 0%, #a2007b 48%, #7a1068 100%)',
      // }}
    >
      {header && <div className="border-b border-base-300">{header(retracted)}</div>}
      <nav ref={navRef} aria-label="Pages" className="relative flex flex-col">
        <span
          ref={lineRef}
          aria-hidden
          className="pointer-events-none absolute right-0 z-4 w-(--size-sidebar-thumb) bg-primary opacity-0"
        />
        {pages.map((opt) => (
          <NavLink key={opt.path} to={opt.path} end={opt.end} title={opt.label}>
            {({ isActive: pathActive }) => {
              const isActive = opt.active ? opt.active(opt.path) : pathActive;

              return (
                <span
                  data-active={isActive || undefined}
                  className={cn(
                    row(retracted),
                    isActive
                      ? 'border-none bg-primary/10 text-primary'
                      : 'btn-ghost border-none text-base-content/80 hover:bg-base-200 hover:text-base-content',
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={label(retracted)}>{opt.label}</span>
                    {!!opt.badge && (
                      <span
                        className={cn(
                          'badge badge-sm',
                          railHidden(retracted),
                          isActive ? 'badge-primary' : 'badge-neutral',
                        )}
                      >
                        {opt.badge}
                      </span>
                    )}
                  </span>
                  <opt.icon
                    size="1.90em"
                    weight={isActive ? 'fill' : 'regular'}
                    className={cn(
                      'shrink-0 transition-transform duration-(--motion-base) ease-enter',
                      { '-translate-x-1': isActive },
                    )}
                  />
                </span>
              );
            }}
          </NavLink>
        ))}
      </nav>

      <div className="flex-1 flex items-end">
        <div
          className="bg-pattern-grid size-full max-h-36 transition-opacity"
          style={{ backgroundSize: '29px 29px', opacity: retracted ? 0.03 : 0.05 }}
        />
      </div>

      {footer}

      {external.length > 0 && (
        <nav aria-label="Other apps" className="flex flex-col border-t border-base-300">
          {external.map((opt) => (
            <a
              key={opt.path}
              href={opt.path}
              title={opt.label}
              className={cn(
                row(retracted),
                'btn-ghost border-none text-sm text-base-content/70 hover:bg-base-200 hover:text-base-content',
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <opt.icon size="1.2em" className={cn('shrink-0', railHidden(retracted))} />
                <span className={label(retracted)}>{opt.label}</span>
              </span>
              <ArrowSquareOut size="1.2em" className="shrink-0" aria-hidden />
            </a>
          ))}
        </nav>
      )}

      {/* Below lg the panel is always a rail, so the toggle only shows on larger screens. */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!retracted}
        title={retracted ? 'Expand sidebar' : 'Collapse sidebar'}
        className={cn(
          row(retracted),
          'btn-ghost border-x-0 border-b-0 border-t border-base-300 text-sm text-base-content/70 hover:bg-base-200 hover:text-base-content max-lg:hidden',
        )}
      >
        <span className={label(retracted)}>
          {retracted ? 'Expand sidebar' : 'Collapse sidebar'}
        </span>
        {retracted ? (
          <CaretDoubleRight size="1.2em" className="shrink-0" aria-hidden />
        ) : (
          <CaretDoubleLeft size="1.2em" className="shrink-0" aria-hidden />
        )}
      </button>
    </aside>
  );
}
