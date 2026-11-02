import { useConsoleAuth } from '@octap/shared/google-auth';
import { Gear, Layout, Megaphone, Receipt, Storefront, Ticket, UsersThree } from 'phosphor-react';

import PortalLayout from '@/components/layout/PortalLayout';
import type { SearchResult } from '@/components/layout/MainToolbar';
import type { NavOption } from '@/components/layout/SidePanel';
import { useMembers, useMerchantTenant } from '@/queries/merchant';
import { toTitle } from '@/utils/format';

function useMerchantSearch(q: string) {
  const auth = useConsoleAuth();
  const active = !auth && q.trim().length >= 2;
  const members = useMembers(q, active);
  const data: SearchResult[] | undefined = active
    ? members.data?.slice(0, 8).map((m) => ({
        id: m.id,
        type: 'member',
        title: m.displayName,
        subtitle: `${m.phone} · ${toTitle(m.tier)} · ${m.balance.toLocaleString()} pts`,
        to: `/merchant/members?member=${m.id}`,
      }))
    : [];
  return { data, isFetching: active && members.isFetching };
}

export default function MerchantLayout() {
  const auth = useConsoleAuth();
  const tenant = useMerchantTenant(!auth).data;

  const nav: NavOption[] = [
    { label: 'Dashboard', path: '/merchant', icon: Layout, end: true },
    { label: 'Issue points', path: '/merchant/pos', icon: Storefront },
    { label: 'Campaigns', path: '/merchant/campaigns', icon: Megaphone },
    { label: 'Rewards', path: '/merchant/rewards', icon: Ticket },
    { label: 'Members', path: '/merchant/members', icon: UsersThree },
    { label: 'Transactions', path: '/merchant/transactions', icon: Receipt },
    { label: 'Settings', path: '/merchant/settings', icon: Gear },
    ...(auth ? [{ label: 'Team and invitations', path: '/merchant/team', icon: UsersThree }] : []),
  ];

  return (
    <PortalLayout
      subtitle={auth?.selected?.name ?? tenant?.name ?? 'Business'}
      roleLabel="Business"
      nav={
        auth
          ? [
              ...nav,
              { label: 'Organizations', path: '/organizations', icon: Gear },
              { label: 'Organization onboarding', path: '/onboarding', icon: Gear },
              ...(auth.identity?.user.systemRole === 'SYSTEM_ADMIN'
                ? [
                    {
                      label: 'Platform administration',
                      path:
                        import.meta.env.VITE_ADMIN_PORTAL_URL ||
                        (import.meta.env.DEV ? 'http://localhost:5000/admin' : '/admin'),
                      icon: Gear,
                    },
                  ]
                : []),
            ]
          : nav
      }
      useSearch={useMerchantSearch}
      searchPlaceholder="Search members by name, phone or address…"
    />
  );
}
