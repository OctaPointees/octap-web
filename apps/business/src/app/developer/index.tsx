import { useAuth } from '@octap/shared/authentication';
import { useMemo } from 'react';
import { House, Key, PlugsConnected, ShareNetwork, Ticket, UsersThree } from 'phosphor-react';
import PortalLayout from '@/components/layout/PortalLayout';
import type { NavOption } from '@/components/layout/SidePanel';
import { platformAdminLinks } from '@/components/layout/nav';
import { useOrganization } from '@/app/organization/context';

export default function DeveloperLayout() {
  const { identity } = useAuth();
  const { selected } = useOrganization();

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
      subtitle={selected?.name ?? 'Business'}
      nav={[...nav, ...platformAdminLinks(identity)]}
      useSearch={noSearch}
      searchPlaceholder="Search pages…"
    />
  );
}
