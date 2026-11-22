import { useAuth } from '@octap/shared/authentication';
import { Gear, Layout, Ticket, UsersFour, UsersThree } from 'phosphor-react';

import PortalLayout from '@/components/layout/PortalLayout';
import type { NavOption } from '@/components/layout/SidePanel';
import { platformAdminLinks } from '@/components/layout/nav';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { organizationPath } from '@/app/organization/utils';

// Core has no member search yet.
const noSearch = () => ({ data: [], isFetching: false });

/** The Business panel of the organization in the URL, for its Owners. */
export default function MerchantLayout() {
  const { identity } = useAuth();
  const { organizationId, membership } = useOrganization();
  const path = (page?: string) => organizationPath(organizationId, 'merchant', page);

  const nav: NavOption[] = [
    { label: 'Dashboard', path: path(), icon: Layout, end: true },
    { label: 'Rewards', path: path('rewards'), icon: Ticket },
    { label: 'Members', path: path('members'), icon: UsersThree },
    { label: 'Settings', path: path('settings'), icon: Gear },
    { label: 'Team and invitations', path: path('team'), icon: UsersFour },
  ];

  return (
    <PortalLayout
      subtitle={membership.name}
      nav={[...nav, ...platformAdminLinks(identity)]}
      useSearch={noSearch}
      searchPlaceholder="Search members…"
    />
  );
}
