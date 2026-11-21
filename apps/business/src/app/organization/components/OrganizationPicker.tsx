import { Menu } from '@base-ui/react/menu';
import {
  Archive,
  Buildings,
  Code,
  Copy,
  DotsThreeVertical,
  Gear,
  Hourglass,
  Info,
  Pause,
  ShieldCheck,
  User,
  type Icon,
} from 'phosphor-react';
import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@octap/shared/authentication';
import { useOrganizationRequests } from '../hooks/useOrganizationRequests';
import { organizationPath } from '../utils';
import type { ConsoleIdentity } from '@octap/shared/authentication';
import type {
  ConsoleOrganizationsApplicationsResponse,
  OrganizationPersona,
  OrganizationType,
} from '@octap/internal-sdk';

type OrganizationApplication = ConsoleOrganizationsApplicationsResponse[number];

type Status = 'ACTIVE' | 'PENDING_REVIEW' | 'SUSPENDED' | 'ARCHIVED';

/** One card: an organization you can open, or one of your requests that you cannot yet. */
interface Entry {
  key: string;
  organizationId?: string;
  name: string;
  slug?: string;
  organizationType?: OrganizationType | null;
  representativeName?: string | null;
  status: Status;
  /** Only for organizations you can open: your role there. */
  persona?: OrganizationPersona;
  /** Why it is not active, shown in the info tip. */
  note?: string;
}

const typeLabel: Record<OrganizationType, string> = {
  COMPANY: 'Company',
  INDIVIDUAL_HOUSEHOLD: 'Individual or household',
};
const ORDER: Status[] = ['ACTIVE', 'PENDING_REVIEW', 'SUSPENDED', 'ARCHIVED'];

/**
 * Active organizations come from the sign-in identity (Core lists only active memberships of
 * active organizations). Pending review and archived ones come from your own organization
 * requests: Core archives an organization when its request is rejected. Core has no way to
 * suspend an organization yet; a SUSPENDED status still renders if it ever arrives.
 */
function entries(identity: ConsoleIdentity, applications: OrganizationApplication[] = []): Entry[] {
  const active: Entry[] = identity.organizations.map((org) => ({
    key: `org-${org.organizationId}`,
    organizationId: org.organizationId,
    name: org.name,
    slug: org.slug,
    organizationType: org.organizationType,
    representativeName: org.representativeName,
    status: 'ACTIVE',
    persona: org.persona,
  }));
  const known = new Set(identity.organizations.map((org) => org.organizationId));
  const requested: Entry[] = applications
    .filter((request) => request.status !== 'APPROVED' && !known.has(request.organizationId))
    .map((request) => ({
      key: `request-${request.id}`,
      organizationId: request.organizationId,
      name: request.name,
      slug: request.slug,
      organizationType: request.organizationType,
      representativeName: request.representativeName,
      status: request.status === 'PENDING' ? 'PENDING_REVIEW' : 'ARCHIVED',
      note:
        request.status === 'PENDING'
          ? 'A System Admin is reviewing this request. You get Business Owner access once it is approved.'
          : request.status === 'CANCELLED'
            ? 'This request was cancelled.'
            : request.reason
              ? `Request rejected: ${request.reason}`
              : 'This request was rejected.',
    }));
  return [...active, ...requested].sort(
    (a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status),
  );
}

/** The organization list: every organization you belong to or asked to create. */
export function OrganizationPicker({ adminPortalUrl }: { adminPortalUrl?: string }) {
  const { identity } = useAuth();
  const navigate = useNavigate();
  const requests = useOrganizationRequests();
  if (!identity) return null;
  const list = entries(identity, requests.data);
  const active = list.filter((entry) => entry.status === 'ACTIVE').length;
  const pending = list.filter((entry) => entry.status === 'PENDING_REVIEW').length;
  const isAdmin = identity.user.systemRole === 'SYSTEM_ADMIN';

  return (
    <div className="mx-auto flex w-full max-w-(--size-article) flex-col gap-6 pt-4">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Choose an organization</h1>
          <p className="mt-1 text-sm opacity-70">
            {active
              ? `You have access to ${active} ${active === 1 ? 'organization' : 'organizations'}. Pick one to open its dashboard.`
              : 'Your account has no active organization access yet.'}
            {pending > 0 && ` ${pending} pending review.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && adminPortalUrl && (
            <a className="btn btn-ghost btn-sm" href={adminPortalUrl}>
              Platform administration
            </a>
          )}
          <Link className="btn btn-primary btn-sm" to="/onboarding">
            New organization
          </Link>
        </div>
      </header>

      {list.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-box border border-dashed border-base-300 bg-base-100 px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">No organizations yet</h2>
          <p className="max-w-md text-sm opacity-70">
            Request a new organization, or ask an Owner to invite you and open the invitation link.
          </p>
          <Link className="btn btn-primary btn-sm mt-2" to="/onboarding">
            Create an organization
          </Link>
        </section>
      ) : (
        <ul
          aria-label="Organizations"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
        >
          {list.map((entry) => (
            <li key={entry.key}>
              <OrganizationCard
                entry={entry}
                onOpen={
                  entry.persona && entry.slug
                    ? () => navigate(organizationPath(entry.slug!))
                    : undefined
                }
                onSettings={
                  // Every member can read the settings; only the Owner can change them.
                  entry.persona && entry.slug
                    ? () => navigate(organizationPath(entry.slug!, 'settings'))
                    : undefined
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const menuItem =
  'flex cursor-pointer items-center gap-2.5 rounded-field px-3 py-2 text-sm outline-none data-highlighted:bg-base-200';
const chip =
  'inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-field border border-base-300 px-2 py-0.5 text-xs';

/** States other than active. The state line at the bottom of the card names them. */
const STATUS: Record<Exclude<Status, 'ACTIVE'>, { label: string; icon: Icon; card?: string }> = {
  PENDING_REVIEW: { label: 'Pending review', icon: Hourglass },
  SUSPENDED: { label: 'Suspended', icon: Pause, card: 'border-warning/40 bg-warning/10' },
  ARCHIVED: { label: 'Archived', icon: Archive },
};
const ownerTip = 'Owners manage organization settings, the team, rewards and API keys.';
const developerTip = 'Developers manage API keys, webhooks and integrations for this organization.';

/**
 * One organization, laid out like a Supabase project card: name and slug, chips for its
 * profile, its state at the bottom, and a menu in the corner. An organization you can open
 * opens through a full-size button behind the content; the menu and the info tip sit above
 * that button so they stay clickable. Others (pending review, suspended, archived) do not open.
 */
function OrganizationCard({
  entry,
  onOpen,
  onSettings,
}: {
  entry: Entry;
  onOpen?: () => void;
  onSettings?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);
  const type = entry.organizationType ? typeLabel[entry.organizationType] : null;
  const representative = entry.representativeName?.trim() || null;
  const owner = entry.persona === 'BUSINESS_OWNER';
  const status = entry.status === 'ACTIVE' ? null : STATUS[entry.status];
  const StateIcon = status ? status.icon : owner ? ShieldCheck : Code;
  const stateLabel = status ? status.label : owner ? 'Owner access' : 'Developer access';
  const tip = status ? entry.note : owner ? ownerTip : developerTip;
  // Core does not return the profile for organizations you belong to yet, so an active card
  // without it shows no profile chips rather than a misleading "Profile not set".
  const profileUnknown = entry.status === 'ACTIVE' && !type && !representative;

  const copyId = () =>
    void navigator.clipboard
      ?.writeText(entry.organizationId ?? '')
      .then(() => setCopied(true))
      .catch(() => {});
  const hasMenu = !!entry.organizationId;

  return (
    <article
      className={cn(
        'relative flex h-full min-h-48 flex-col rounded-box border border-base-300 bg-base-200/40 p-5',
        onOpen &&
          'bg-base-100 transition-[border-color,box-shadow] hover:border-base-content/25 hover:shadow-sm has-[button[data-open]:focus-visible]:outline-2 has-[button[data-open]:focus-visible]:outline-offset-2 has-[button[data-open]:focus-visible]:outline-primary',
        status?.card,
      )}
    >
      {onOpen && (
        <button
          type="button"
          data-open
          onClick={onOpen}
          aria-label={`Open ${entry.name}`}
          className="absolute inset-0 cursor-pointer rounded-box outline-none"
        />
      )}

      <div className="pointer-events-none relative flex min-w-0 flex-1 flex-col">
        <div className={cn('flex min-w-0 items-center gap-2', hasMenu && 'pr-8')}>
          <h2 className={cn('truncate font-semibold', status && 'opacity-75')} title={entry.name}>
            {entry.name}
          </h2>
        </div>
        {entry.slug && <p className="mt-0.5 truncate text-sm opacity-60">{entry.slug}</p>}

        {!profileUnknown && (
          <div className="mt-4 flex min-w-0 flex-wrap gap-2">
            {type || representative ? (
              <>
                {type && (
                  <span className={chip}>
                    <Buildings size={14} className="shrink-0 opacity-70" />
                    <span className="truncate">{type}</span>
                  </span>
                )}
                {representative && (
                  <span className={chip} title={`Representative: ${representative}`}>
                    <User size={14} className="shrink-0 opacity-70" />
                    <span className="truncate">{representative}</span>
                  </span>
                )}
              </>
            ) : (
              <span className={cn(chip, 'opacity-60')}>Profile not set</span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 pt-6 text-sm">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-base-300">
            <StateIcon size={13} />
          </span>
          <span className="font-medium">{stateLabel}</span>
          {tip && (
            <span
              tabIndex={0}
              role="img"
              aria-label={tip}
              data-tip={tip}
              className="tooltip tooltip-top pointer-events-auto relative z-10 flex rounded-full opacity-60 outline-none before:max-w-56 before:text-left hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Info size={15} />
            </span>
          )}
          {copied && (
            <span role="status" className="ml-auto text-xs text-success">
              ID copied
            </span>
          )}
        </div>
      </div>

      {hasMenu && (
        <div className="absolute top-3 right-3 z-10">
          <Menu.Root>
            <Menu.Trigger
              aria-label={`More actions for ${entry.name}`}
              className="flex size-7 items-center justify-center rounded-field opacity-70 outline-none hover:bg-base-200 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-primary data-popup-open:bg-base-200 data-popup-open:opacity-100"
            >
              <DotsThreeVertical size={18} weight="bold" />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner sideOffset={4} align="end" className="z-50">
                <Menu.Popup className="min-w-48 rounded-box border border-base-300 bg-base-100 p-1 shadow-lg outline-none">
                  <Menu.Item className={menuItem} onClick={copyId}>
                    <Copy size={16} className="opacity-70" /> Copy organization ID
                  </Menu.Item>
                  {onSettings && (
                    <Menu.Item className={menuItem} onClick={onSettings}>
                      <Gear size={16} className="opacity-70" /> Settings
                    </Menu.Item>
                  )}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>
      )}
    </article>
  );
}
