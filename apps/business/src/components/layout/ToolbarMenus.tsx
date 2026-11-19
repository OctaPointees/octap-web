import { Menu } from '@base-ui/react/menu';
import { useAuth } from '@octap/shared/authentication';
import {
  ArrowClockwise,
  Buildings,
  CaretDown,
  Check,
  Code,
  ListBullets,
  PlusCircle,
  SignOut,
  Storefront,
} from 'phosphor-react';
import { useLocation, useNavigate } from 'react-router';
import { useOrganization } from '@/app/organization/context';
import { useSession } from '../../queries/useSession';
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
  const organization = useOrganization();
  const user = useSession()?.user;
  if (!user) return null;

  const access = [
    organization.selected ? (organization.owner ? 'Business Owner' : 'Business Developer') : null,
    auth.identity?.user.systemRole === 'SYSTEM_ADMIN' ? 'System Admin' : null,
  ].filter((role): role is string => !!role);

  return (
    <Menu.Root>
      <Menu.Trigger
        className="flex size-9 shrink-0 items-center justify-center rounded-full outline-none ring-offset-2 ring-offset-base-100 hover:ring-2 hover:ring-base-300 focus-visible:ring-2 focus-visible:ring-primary data-popup-open:ring-2 data-popup-open:ring-base-300"
        aria-label="Account menu"
        title={user.displayName}
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
                <div className="truncate font-semibold">{user.displayName}</div>
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
            <Menu.Item
              className={item}
              disabled={organization.busy}
              onClick={() => void organization.perform(async () => {}, 'Access refreshed')}
            >
              <ArrowClockwise size={16} /> Refresh access
            </Menu.Item>
            <Menu.Item
              className={cn(item, 'text-error')}
              disabled={organization.busy}
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
  const organization = useOrganization();
  const navigate = useNavigate();
  const name = organization.selected?.name ?? label;
  const role = organization.selected ? (organization.owner ? 'Owner' : 'Developer') : null;
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
                  const current = org.organizationId === organization.organizationId;
                  return (
                    <Menu.Item
                      key={org.organizationId}
                      className={item}
                      onClick={() => !current && organization.choose(org.organizationId)}
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

const PANELS = [
  {
    path: '/merchant',
    label: 'Business',
    description: 'Members, rewards and campaigns',
    icon: Storefront,
  },
  {
    path: '/developer',
    label: 'Developer',
    description: 'API keys, webhooks and MCP tools',
    icon: Code,
  },
] as const;

/**
 * The panel segment (Business or Developer), in place of Supabase's branch. Owners switch
 * between both; a Developer has only the Developer panel, so it is a plain label. Hidden on
 * pages outside a panel, such as the organization picker.
 */
export function PanelMenu() {
  const { owner } = useOrganization();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const current = PANELS.find((panel) => pathname.startsWith(panel.path));
  if (!current) return null;
  const available = owner ? PANELS : PANELS.filter((panel) => panel.path === '/developer');
  const content = (
    <>
      <current.icon size={16} className="shrink-0 opacity-70" />
      <span className="truncate">{current.label}</span>
    </>
  );

  if (available.length < 2)
    return <span className={cn(segment, 'hover:bg-transparent')}>{content}</span>;

  return (
    <Menu.Root>
      <Menu.Trigger className={segment} aria-label={`Switch panel (current: ${current.label})`}>
        {content}
        <CaretDown size={14} className="shrink-0 opacity-50" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="start" className="z-50">
          <Menu.Popup className={popup}>
            <div className="px-3 pt-1 pb-1 text-xs font-medium opacity-60">Panels</div>
            {available.map((panel) => (
              <Menu.Item
                key={panel.path}
                className={item}
                onClick={() => panel !== current && navigate(panel.path)}
              >
                <Check size={16} className={cn(panel !== current && 'invisible')} />
                <panel.icon size={18} className="shrink-0 opacity-70" />
                <span className="min-w-0">
                  <span className="block">{panel.label}</span>
                  <span className="block text-xs opacity-60">{panel.description}</span>
                </span>
              </Menu.Item>
            ))}
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
