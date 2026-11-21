import { useAuth } from '@octap/shared/authentication';
import { Gear, Key, Layout, Ticket, UsersFour, UsersThree, type Icon } from 'phosphor-react';
import PortalLayout from '@/components/layout/PortalLayout';
import type { NavOption } from '@/components/layout/SidePanel';
import { platformAdminLinks } from '@/components/layout/nav';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { organizationPath, type OrganizationPage } from '@/app/organization/utils';
import { FOCUS_PAGES, useFocus } from './focus';
import { FocusToggle } from './FocusToggle';
import { WorkspaceStatusBar } from './WorkspaceStatusBar';

const PAGES: Record<OrganizationPage | '', { label: string; icon: Icon }> = {
  '': { label: 'Dashboard', icon: Layout },
  rewards: { label: 'Rewards', icon: Ticket },
  members: { label: 'Members', icon: UsersThree },
  'api-keys': { label: 'API keys', icon: Key },
  team: { label: 'Team', icon: UsersFour },
  settings: { label: 'Settings', icon: Gear },
};

// Core has no member search yet.
const noSearch = () => ({ data: [], isFetching: false });

/**
 * The shell around an organization's pages. The sidebar lists the pages of the current focus
 * (Business or Developer, switched at the top of the sidebar or in the top bar); every page stays
 * reachable by URL either way.
 */
export default function WorkspaceLayout() {
  const { identity } = useAuth();
  const { slug, membership } = useOrganization();
  const focus = useFocus();

  const nav: NavOption[] = FOCUS_PAGES[focus].map((page) => ({
    ...PAGES[page],
    path: organizationPath(slug, page || undefined),
    end: !page,
  }));

  return (
    <PortalLayout
      subtitle={membership.name}
      nav={[...nav, ...platformAdminLinks(identity)]}
      sideHeader={(retracted) => <FocusToggle compact={retracted} />}
      useSearch={noSearch}
      searchPlaceholder="Search pages…"
      statusBar={<WorkspaceStatusBar />}
    />
  );
}
