import { type Icon } from 'phosphor-react';
import { NavLink } from 'react-router';

import { cn } from '@/utils/cn';

export type NavOption = {
  label: string;
  path: string;
  icon: Icon;

  badge?: number;
  end?: boolean;
};

type Props = {
  subtitle: string;
  options: NavOption[];
  roleLabel: string;
  footer?: React.ReactNode;
};

export default function SidePanel({ subtitle, options, footer }: Props) {
  return (
    <aside className="flex w-72 shrink-0 flex-col gap-1 max-lg:hidden">
      <div className="flex items-center gap-4">
        <div className="size-10 rounded-box bg-primary p-2">
          <img src="/icons/logo_dark.png" className="w-full" alt="" />
        </div>
        <div className="font-bold">OctaP</div>
        <div className="opacity-40">|</div>
        <div className="truncate">{subtitle}</div>
      </div>

      <div className="flex h-4 items-center justify-center">
        <div className="w-6/10 border-b border-primary"></div>
      </div>

      <nav className="space-y-1">
        {options.map((opt) => (
          <NavLink key={opt.path} to={opt.path} end={opt.end}>
            {({ isActive }) => (
              <span
                className={cn(
                  'btn btn-block justify-between p-4',
                  isActive ? 'btn-primary' : 'btn-ghost btn-primary',
                )}
              >
                <span className="flex items-center gap-2">
                  {opt.label}
                  {!!opt.badge && (
                    <span
                      className={cn('badge badge-sm', isActive ? 'badge-neutral' : 'badge-primary')}
                    >
                      {opt.badge}
                    </span>
                  )}
                </span>
                <opt.icon size="1.8em" weight={isActive ? 'fill' : 'regular'} />
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex-1"></div>

      {footer}
    </aside>
  );
}
