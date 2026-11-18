import { useConsoleAuth } from '@octap/shared/google-auth';
import { useMemo } from 'react';
import { House, Key, PlugsConnected, ShareNetwork, Ticket, UsersThree } from 'phosphor-react';
import PortalLayout from '@/components/layout/PortalLayout';
import type { NavOption } from '@/components/layout/SidePanel';
import { platformAdminLinks } from '@/components/layout/nav';
import { useMerchantTenant } from '@/queries/merchant';

export default function DeveloperLayout() {
  const auth = useConsoleAuth();
  const tenant = useMerchantTenant(!auth).data;

  const nav = useMemo<NavOption[]>(
    () => [
      { label: 'Dashboard', path: '/developer', icon: House, end: true },
      { label: 'Members', path: '/developer/members', icon: UsersThree },
      { label: 'Rewards', path: '/developer/rewards', icon: Ticket },
      { label: 'API keys', path: '/developer/api-keys', icon: Key },
      { label: 'Webhooks', path: '/developer/webhooks', icon: ShareNetwork },
      { label: 'MCP tools', path: '/developer/mcp', icon: PlugsConnected },
    ],
    [],
  );

  const noSearch = () => ({ data: [], isFetching: false });

  return (
    <PortalLayout
      subtitle={auth?.selected?.name ?? tenant?.name ?? 'Business'}
      nav={[...nav, ...platformAdminLinks(auth)]}
      useSearch={noSearch}
      searchPlaceholder="Search pages…"
    />
  );
}
