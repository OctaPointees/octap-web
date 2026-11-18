import { ArrowSquareOut, type Icon } from 'phosphor-react';
import { NavLink } from 'react-router';
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
  footer?: React.ReactNode;
} & React.ComponentProps<'aside'>;

/** Labels hide on md–lg, where the panel is an icon rail; they stay as the accessible name. */
const label = 'truncate max-lg:sr-only';
const row = 'btn btn-block h-11 justify-between px-4 max-lg:justify-center max-lg:px-0 font-medium';

export default function SidePanel({ options, footer, className }: Props) {
  const pages = options.filter((opt) => !opt.external);
  const external = options.filter((opt) => opt.external);

  return (
    <aside
      className={cn(
        'flex w-72 shrink-0 flex-col gap-2 overflow-y-auto rounded-box bg-primary p-3 text-primary-content max-md:hidden max-lg:w-18',
        className,
      )}
      style={{
        background: 'linear-gradient(165deg, var(--color-primary) 0%, #a2007b 48%, #7a1068 100%)',
      }}
    >
      {/* Switching between the Business and Developer panels lives in the top bar. */}
      <nav aria-label="Pages" className="flex flex-col gap-1">
        {pages.map((opt) => (
          <NavLink key={opt.path} to={opt.path} end={opt.end} title={opt.label}>
            {({ isActive: pathActive }) => {
              const isActive = opt.active ? opt.active(opt.path) : pathActive;

              return (
                <span
                  className={cn(
                    row,
                    isActive
                      ? 'border-none bg-base-100 text-primary shadow-sm'
                      : 'btn-ghost text-primary-content hover:bg-primary-content/15 hover:text-primary-content border-none',
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={label}>{opt.label}</span>
                    {!!opt.badge && (
                      <span
                        className={cn(
                          'badge badge-sm max-lg:hidden',
                          isActive ? 'badge-primary' : 'badge-neutral',
                        )}
                      >
                        {opt.badge}
                      </span>
                    )}
                  </span>
                  <opt.icon
                    size="1.4em"
                    weight={isActive ? 'fill' : 'regular'}
                    className="shrink-0"
                  />
                </span>
              );
            }}
          </NavLink>
        ))}
      </nav>

      <div className="flex-1" />

      {footer}

      {external.length > 0 && (
        <nav
          aria-label="Other apps"
          className="flex flex-col gap-1 border-t border-primary-content/25 pt-2"
        >
          {external.map((opt) => (
            <a
              key={opt.path}
              href={opt.path}
              title={opt.label}
              className={cn(
                row,
                'btn-ghost border-none text-sm text-primary-content/85 hover:bg-primary-content/15 hover:text-primary-content',
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <opt.icon size="1.2em" className="shrink-0 max-lg:hidden" />
                <span className={label}>{opt.label}</span>
              </span>
              <ArrowSquareOut size="1.2em" className="shrink-0" aria-hidden />
            </a>
          ))}
        </nav>
      )}
    </aside>
  );
}
