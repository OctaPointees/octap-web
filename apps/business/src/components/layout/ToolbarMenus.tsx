import { Menu } from '@base-ui/react/menu';
import { useAuth } from '@octap/shared/authentication';
import {
  ArrowClockwise,
  Buildings,
  CaretDown,
  Check,
  ListBullets,
  PlusCircle,
  SignOut,
} from 'phosphor-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { notify } from '@octap/shared/components';
import { useCurrentOrganization } from '@/app/organization/hooks/useOrganization';
import { dashboardPath } from '@/app/organization/utils';
import { FOCUSES, useFocus, useSwitchFocus, type Focus } from '@/app/workspace/focus';
import { cn } from '../../utils/cn';
import type { NavOption } from './SidePanel';

const popup = 'min-w-60 rounded-box border border-base-300 bg-base-100 p-1 shadow-lg outline-none';
const item =
  'flex cursor-pointer items-center gap-2 rounded-field px-3 py-2 text-sm outline-none data-highlighted:bg-primary/10 data-disabled:cursor-default data-disabled:opacity-50';
const separator = 'my-1 h-px bg-base-300';
/** A breadcrumb segment in the top bar: flat until hovered, like the rest of the bar. */
const segment =
  'flex h-8 min-w-0 shrink items-center gap-2 rounded-field px-2 text-sm font-medium outline-none hover:bg-base-200 focus-visible:ring-2 focus-visible:ring-primary data-popup-open:bg-base-200';
const tag =
  'badge badge-outline badge-xs shrink-0 border-base-300 font-semibold uppercase tracking-wider text-base-content/60';

/** The signed-in person: who they are, plus refresh and sign-out. The only sign-out in the shell. */
export function AccountMenu() {
  const auth = useAuth();
  const organization = useCurrentOrganization();
  const [refreshing, setRefreshing] = useState(false);
  const user = auth.identity?.user;
  if (!user) return null;

  const refresh = () => {
    setRefreshing(true);
    auth
      .refresh()
    notify.info('Refreshing access. . .');
      .then(
        () => notify.success('Access refreshed'),
        (cause) => notify.error(cause, 'That did not work'),
      )
      .finally(() => setRefreshing(false));
  };

  const access = [
    organization ? (organization.owner ? 'Business Owner' : 'Business Developer') : null,
    auth.identity?.user.systemRole === 'SYSTEM_ADMIN' ? 'System Admin' : null,
  ].filter((role): role is string => !!role);

  return (
    <Menu.Root>
      <Menu.Trigger
        className="flex size-9 shrink-0 items-center justify-center rounded-full outline-none ring-offset-2 ring-offset-base-100 hover:ring-2 hover:ring-base-300 focus-visible:ring-2 focus-visible:ring-primary data-popup-open:ring-2 data-popup-open:ring-base-300"
        aria-label="Account menu"
        title={user.fullName}
      >
        <img
          src={user.avatarUrl || '/icons/logo_light.png'}
          className="size-8 rounded-full border border-base-300 object-cover"
          alt=""
        />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="end" className="z-50">
          <Menu.Popup className={popup}>
            <div className="flex items-center gap-3 px-3 py-2">
              <img
                src={user.avatarUrl || '/icons/logo_light.png'}
                className="size-10 rounded-full object-cover"
                alt=""
              />
              <div className="min-w-0">
                <div className="truncate font-semibold">{user.fullName}</div>
                <div className="truncate text-xs opacity-65">{user.email}</div>
                {access.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {access.map((role) => (
                      <span key={role} className="badge badge-primary badge-soft badge-xs">
                        {role}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className={separator} />
            <Menu.Item className={item} disabled={refreshing} onClick={refresh}>
              <ArrowClockwise size={16} /> Refresh access
            </Menu.Item>
            <Menu.Item
              className={cn(item, 'text-error')}
              disabled={refreshing}
              onClick={auth.signOut}
            >
              <SignOut size={16} /> Sign out
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** The organization segment: name, your role, and a switcher when signed in with Google. */
export function OrganizationMenu({ label }: { label: string }) {
  const { identity } = useAuth();
  const organization = useCurrentOrganization();
  const navigate = useNavigate();
  const name = organization?.membership.name ?? label;
  const role = organization ? (organization.owner ? 'Owner' : 'Developer') : null;
  const content = (
    <>
      <Buildings size={16} className="shrink-0 opacity-70" />
      <span className="min-w-0 truncate">{name}</span>
      {role && <span className={cn(tag, 'max-sm:hidden')}>{role}</span>}
    </>
  );

  if (!identity) return <span className={cn(segment, 'hover:bg-transparent')}>{content}</span>;

  return (
    <Menu.Root>
      <Menu.Trigger className={segment} aria-label={`Switch organization (current: ${name})`}>
        {content}
        <CaretDown size={14} className="shrink-0 opacity-50" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="start" className="z-50">
          <Menu.Popup className={popup}>
            {identity.organizations.length > 0 && (
              <>
                <div className="px-3 pt-1 pb-1 text-xs font-medium opacity-60">Organizations</div>
                {identity.organizations.map((org) => {
                  const current = org.organizationId === organization?.organizationId;
                  return (
                    <Menu.Item
                      key={org.organizationId}
                      className={item}
                      onClick={() => !current && navigate(dashboardPath(org))}
                    >
                      <Check size={16} className={cn(!current && 'invisible')} />
                      <span className="min-w-0 flex-1 truncate">{org.name}</span>
                      <span className={tag}>
                        {org.persona === 'BUSINESS_OWNER' ? 'Owner' : 'Developer'}
                      </span>
                    </Menu.Item>
                  );
                })}
                <div className={separator} />
              </>
            )}
            <Menu.Item className={item} onClick={() => navigate('/organizations')}>
              <ListBullets size={16} /> All organizations
            </Menu.Item>
            <Menu.Item className={item} onClick={() => navigate('/onboarding')}>
              <PlusCircle size={16} /> Organization onboarding
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/**
 * The focus segment (Business or Developer), in place of Supabase's branch. It picks which menu the
 * sidebar shows and keeps the URL as it is. Both roles can switch: what each may do on a page is
 * still up to their role. Use it only inside an organization.
 */
export function FocusMenu() {
  const focus = useFocus();
  const switchTo = useSwitchFocus();
  const current = FOCUSES[focus];

  return (
    <Menu.Root>
      <Menu.Trigger className={segment} aria-label={`Switch menu (current: ${current.label})`}>
        <current.icon size={16} className="shrink-0 opacity-70" />
        <span className="truncate">{current.label}</span>
        <CaretDown size={14} className="shrink-0 opacity-50" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="start" className="z-50">
          <Menu.Popup className={popup}>
            <div className="px-3 pt-1 pb-1 text-xs font-medium opacity-60">Menu</div>
            {(Object.keys(FOCUSES) as Focus[]).map((option) => {
              const { label, description, icon: OptionIcon } = FOCUSES[option];
              return (
                <Menu.Item key={option} className={item} onClick={() => switchTo(option)}>
                  <Check size={16} className={cn(option !== focus && 'invisible')} />
                  <OptionIcon size={18} className="shrink-0 opacity-70" />
                  <span className="min-w-0">
                    <span className="block">{label}</span>
                    <span className="block text-xs opacity-60">{description}</span>
                  </span>
                </Menu.Item>
              );
            })}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** The page in `pages` the URL is on: an exact match for `end` pages, else the longest prefix. */
function currentPage(pages: NavOption[], pathname: string) {
  return pages
    .filter((page) =>
      page.end
        ? pathname === page.path
        : pathname === page.path || pathname.startsWith(`${page.path}/`),
    )
    .sort((a, b) => b.path.length - a.path.length)[0];
}

/**
 * The page segment: the panel page you are on (Rewards, Members, ...), with a menu of the
 * panel's other pages. Other apps (`external` links) stay in the side panel.
 */
export function PageMenu({ pages }: { pages: NavOption[] }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const local = pages.filter((page) => !page.external);
  const current = currentPage(local, pathname);
  if (!current) return null;

  return (
    <Menu.Root>
      <Menu.Trigger className={segment} aria-label={`Switch page (current: ${current.label})`}>
        <current.icon size={16} className="shrink-0 opacity-70" />
        <span className="truncate">{current.label}</span>
        <CaretDown size={14} className="shrink-0 opacity-50" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="start" className="z-50">
          <Menu.Popup className={cn(popup, 'max-h-[70dvh] overflow-y-auto')}>
            <div className="px-3 pt-1 pb-1 text-xs font-medium opacity-60">Pages</div>
            {local.map((page) => (
              <Menu.Item
                key={page.path}
                className={item}
                onClick={() => page !== current && navigate(page.path)}
              >
                <Check size={16} className={cn(page !== current && 'invisible')} />
                <page.icon size={18} className="shrink-0 opacity-70" />
                <span className="min-w-0 flex-1 truncate">{page.label}</span>
                {!!page.badge && <span className="badge badge-primary badge-xs">{page.badge}</span>}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
