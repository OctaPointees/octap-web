import { ArrowsLeftRight, SignOut, type Icon } from 'phosphor-react';
import { NavLink, useLocation, useNavigate } from 'react-router';
import { useSession } from '../../queries/useSession';
import { authService } from '../../services/auth.service';
import { cn } from '../../utils/cn';
import { toTitle } from '../../utils/format';
import { Button } from '../shared/Button';

export type NavOption = {
  label: string;
  path: string;
  icon: Icon;
  /** Count badge, e.g. items awaiting review. */
  badge?: number;
  end?: boolean;

  active?: (path: string) => boolean;
};

type Props = {
  options: NavOption[];
  roleLabel: string;
  footer?: React.ReactNode;
} & React.ComponentProps<'aside'>;

export default function SidePanel({ options, roleLabel, footer, className }: Props) {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const user = session?.user;

  const isDeveloperMode = location.pathname.startsWith('/developer');

  const clss = cn(
    'flex w-80 shrink-0 flex-col max-lg:hidden p-3 rounded-box bg-primary text-primary-content',
    className,
  );

  return (
    <aside
      className={clss}
      style={{
        background: 'linear-gradient(165deg, var(--color-primary) 0%, #a2007b 48%, #7a1068 100%)',
      }}
    >
      <div className="flex items-center gap-4 rounded-field bg-base-100 text-base-content p-2">
        <img src={user?.avatarUrl} className="size-16 rounded-box object-cover" alt="" />
        <div className="min-w-0">
          <div className="text-sm">
            {user?.merchantRole ? `${roleLabel} ${toTitle(user.merchantRole)}` : roleLabel}
          </div>
          <div className="truncate font-bold">{user?.displayName}</div>
          <div className="truncate text-xs italic opacity-67">{user?.email}</div>
        </div>
      </div>

      <Button
        className="btn-block justify-start btn-primary justify-between mt-2"
        onClick={() => navigate(isDeveloperMode ? '/merchant' : '/developer')}
      >
        Switch to {isDeveloperMode ? 'Business' : 'Developer'} mode
        <ArrowsLeftRight size="1.5em" />
      </Button>

      <div className="border-b-2 border-dashed border-primary-content/67 my-2"></div>

      <nav className="space-y-1">
        {options.map((opt) => (
          <NavLink key={opt.path} to={opt.path} end={opt.end}>
            {({ isActive: pathActive }) => {
              const isActive = opt.active ? opt.active(opt.path) : pathActive;

              return (
                <span
                  className={cn(
                    'btn btn-block justify-between p-4',
                    isActive ? '' : 'btn-ghost not-hover:text-white',
                  )}
                >
                  <span className="flex items-center gap-2">
                    {opt.label}
                    {!!opt.badge && (
                      <span
                        className={cn(
                          'badge badge-sm',
                          isActive ? 'badge-neutral' : 'badge-primary',
                        )}
                      >
                        {opt.badge}
                      </span>
                    )}
                  </span>
                  <opt.icon size="1.8em" weight={isActive ? 'fill' : 'regular'} />
                </span>
              );
            }}
          </NavLink>
        ))}
      </nav>

      <div className="flex-1"></div>

      {footer}

      <Button
        className="btn-block btn-soft btn-error justify-between"
        onClick={() => authService.logout().then(() => navigate('/login', { replace: true }))}
      >
        Log-out
        <SignOut size="1.8em" />
      </Button>
    </aside>
  );
}
