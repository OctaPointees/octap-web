import { Menu } from '@base-ui/react/menu';
import { useOrganization } from '@/app/organization/context';
import { List, MagnifyingGlass } from 'phosphor-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { cn } from '../../utils/cn';
import type { NavOption } from './SidePanel';
import { OrganizationMenu, PageMenu, PanelMenu } from './ToolbarMenus';

export type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  type: string;
  to: string;
};

type Props = {
  nav: NavOption[];
  placeholder?: string;
  /** Hook-like search source: receives the debounced query, returns results. */
  useResults: (q: string) => { data?: SearchResult[]; isFetching: boolean };
  actions?: ReactNode;
  subtitle: string;
};

function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

/** A breadcrumb divider, as in Supabase's bar. Decorative only. */
const Slash = ({ className }: { className?: string }) => (
  <span
    aria-hidden
    className={cn('select-none text-lg font-light text-base-content/20', className)}
  >
    /
  </span>
);

/**
 * The top bar, laid out like Supabase's: logo / organization / panel on the left, then search
 * (Ctrl K or Cmd K focuses it) and the account menu on the right. Full width, flat, with a
 * bottom border; `PortalLayout` makes it sticky.
 */
export default function MainToolbar({
  nav,
  placeholder = 'Search…',
  useResults,
  actions,
  subtitle,
}: Props) {
  const organization = useOrganization();
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const debounced = useDebounced(q);
  const { data, isFetching } = useResults(debounced);
  const home = organization.selected
    ? organization.owner
      ? '/merchant'
      : '/developer'
    : '/organizations';

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        input.current?.focus();
        input.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const pageHits: SearchResult[] = q.trim()
    ? nav
        .filter((n) => !n.external && n.label.toLowerCase().includes(q.toLowerCase()))
        .map((n) => ({
          id: n.path,
          title: n.label,
          subtitle: 'Go to page',
          type: 'page',
          to: n.path,
        }))
    : [];
  const results = [...pageHits, ...(data ?? [])];

  const go = (r: SearchResult) => {
    navigate(r.to);
    setOpen(false);
    setQ('');
    input.current?.blur();
  };

  return (
    <div className="flex h-14 items-center gap-2 border-b border-base-300 bg-base-100 px-4">
      <Menu.Root>
        <Menu.Trigger
          className="btn btn-ghost btn-square btn-sm -ml-1 md:hidden"
          aria-label="Open navigation"
        >
          <List size={20} />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={6} align="start" className="z-50">
            <Menu.Popup className="min-w-56 rounded-box border border-base-300 bg-base-100 p-1 shadow-lg outline-none">
              {nav.map((n) => (
                <Menu.Item
                  key={n.path}
                  onClick={() => (n.external ? window.location.assign(n.path) : navigate(n.path))}
                  className="flex cursor-pointer items-center gap-2 rounded-field px-3 py-2 text-sm outline-none data-highlighted:bg-primary/10"
                >
                  <n.icon size={18} /> {n.label}
                </Menu.Item>
              ))}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1">
        <Link
          to={home}
          aria-label="OctaP Credit System home"
          className="flex size-9 shrink-0 items-center justify-center rounded-field hover:bg-base-200"
        >
          <img src="/icons/logo_light.png" className="h-7" alt="" />
        </Link>
        <Slash />
        <OrganizationMenu label={subtitle} />
        <PanelBreadcrumb nav={nav} />
      </nav>

      {/* Phones get pages from the menu button instead: the bar has no room for search. */}
      <div className="relative max-sm:hidden">
        <label className="input input-sm h-9 w-56 gap-2 rounded-field lg:w-72">
          <MagnifyingGlass size={16} className="shrink-0 opacity-60" />
          <input
            ref={input}
            value={q}
            placeholder={placeholder}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setActive(0);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') setActive((a) => Math.min(a + 1, results.length - 1));
              if (e.key === 'ArrowUp') setActive((a) => Math.max(a - 1, 0));
              if (e.key === 'Enter' && results[active]) go(results[active]);
              if (e.key === 'Escape') {
                setOpen(false);
                e.currentTarget.blur();
              }
            }}
            role="combobox"
            aria-label="Search"
            aria-expanded={open && !!q}
            aria-controls="global-search-results"
          />
          {isFetching ? (
            <span className="loading loading-spinner loading-xs opacity-50" />
          ) : (
            <kbd className="kbd kbd-xs shrink-0 opacity-70">{isMac ? '⌘ K' : 'Ctrl K'}</kbd>
          )}
        </label>
        {open && q.trim().length > 0 && (
          <ul
            id="global-search-results"
            role="listbox"
            className="absolute top-full right-0 z-40 mt-1 max-h-96 w-96 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-box border border-base-300 bg-base-100 p-1 shadow-lg"
          >
            {results.length === 0 && (
              <li className="px-3 py-4 text-center text-sm opacity-60">
                {isFetching || q !== debounced ? 'Searching…' : 'No matches'}
              </li>
            )}
            {results.map((r, i) => (
              <li key={r.type + r.id} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(r)}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-field px-3 py-2 text-left',
                    i === active && 'bg-primary/10',
                  )}
                >
                  <span className="badge badge-ghost badge-sm w-16 justify-center capitalize">
                    {r.type}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{r.title}</span>
                    {r.subtitle && (
                      <span className="block truncate text-xs opacity-60">{r.subtitle}</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">{actions}</div>
    </div>
  );
}

/**
 * The panel and page segments, shown only inside the Business or Developer panel. Below `md`
 * the page segment hides (the menu button lists pages); below `sm` the panel hides too.
 */
function PanelBreadcrumb({ nav }: { nav: NavOption[] }) {
  const { pathname } = useLocation();
  if (!pathname.startsWith('/merchant') && !pathname.startsWith('/developer')) return null;
  return (
    <>
      <Slash className="max-sm:hidden" />
      <span className="flex min-w-0 shrink max-sm:hidden">
        <PanelMenu />
      </span>
      <Slash className="max-md:hidden" />
      <span className="flex min-w-0 shrink max-md:hidden">
        <PageMenu pages={nav} />
      </span>
    </>
  );
}
