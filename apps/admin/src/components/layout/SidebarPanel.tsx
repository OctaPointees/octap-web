import type { ComponentProps } from 'react';
import { SignOut, type Icon } from 'phosphor-react';
import { NavLink } from 'react-router';

import { Button } from '@octap/shared/components';
import { cn } from '@octap/shared/utils';
import { PageLogo } from '../shared/PageLogo';

import { useAuth } from '@octap/shared/authentication';

export type NavOption = {
  label: string;
  path: string;
  icon: Icon;
  /** Count badge, e.g. items awaiting review. */
  badge?: number;
  end?: boolean;
};

type Props = {
  subtitle?: string;
  options: NavOption[];
  footer?: React.ReactNode;
};

export function SidePanel({ options, footer, className }: Props & ComponentProps<'aside'>) {
  const { signOut } = useAuth();

  return (
    <aside className={cn('flex w-72 shrink-0 flex-col gap-1 max-lg:hidden', className)}>
      <PageLogo />

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

      <div className="flex items-center gap-4 rounded-box bg-base-200 p-2">
        <img src="/placeholder/avatar.png" className="size-16 rounded-box object-cover" alt="" />
        <div className="min-w-0">
          <div className="text-sm">Autheticated · Admin</div>
          <div className="truncate font-bold">John Smith</div>
          <div className="truncate text-xs italic opacity-67">smith.jon@octap.cloud</div>
        </div>
      </div>

      <Button
        className="btn-block btn-soft btn-error justify-between"
        icon={SignOut}
        onClick={signOut}
      >
        Log-out
      </Button>
    </aside>
  );
}
