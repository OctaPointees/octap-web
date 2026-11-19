import { useAuth } from '@octap/shared/authentication';
import {
  Gear,
  Layout,
  Megaphone,
  Receipt,
  Storefront,
  Ticket,
  UsersFour,
  UsersThree,
} from 'phosphor-react';

import PortalLayout from '@/components/layout/PortalLayout';
import type { NavOption } from '@/components/layout/SidePanel';
import { platformAdminLinks } from '@/components/layout/nav';
import { useOrganization } from '@/app/organization/hooks/useOrganization';

// Core has no member search yet.
const noSearch = () => ({ data: [], isFetching: false });

export default function MerchantLayout() {
  const { identity } = useAuth();
  const { selected } = useOrganization();

  const nav: NavOption[] = [
    { label: 'Dashboard', path: '/merchant', icon: Layout, end: true },
    { label: 'Issue points', path: '/merchant/pos', icon: Storefront },
    { label: 'Campaigns', path: '/merchant/campaigns', icon: Megaphone },
    { label: 'Rewards', path: '/merchant/rewards', icon: Ticket },
    { label: 'Members', path: '/merchant/members', icon: UsersThree },
    { label: 'Transactions', path: '/merchant/transactions', icon: Receipt },
    { label: 'Settings', path: '/merchant/settings', icon: Gear },
    { label: 'Team and invitations', path: '/merchant/team', icon: UsersFour },
  ];

  return (
    <PortalLayout
      subtitle={selected?.name ?? 'Business'}
      nav={[...nav, ...platformAdminLinks(identity)]}
      useSearch={noSearch}
      searchPlaceholder="Search members…"
    />
  );
}
