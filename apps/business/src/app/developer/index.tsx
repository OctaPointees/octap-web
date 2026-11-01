import { useMemo } from 'react';
import { House, Key, PlugsConnected, ShareNetwork } from 'phosphor-react';
import PortalLayout from '@/components/layout/PortalLayout';
import type { NavOption } from '@/components/layout/SidePanel';
import { useMerchantTenant } from '@/queries/merchant';

export default function DeveloperLayout() {
  const tenant = useMerchantTenant().data;

  const nav = useMemo<NavOption[]>(
    () => [
      { label: 'Dashboard', path: '/developer', icon: House, end: true },
      { label: 'API keys', path: '/developer/api-keys', icon: Key },
      { label: 'Webhooks', path: '/developer/webhooks', icon: ShareNetwork },
      { label: 'MCP tools', path: '/developer/mcp', icon: PlugsConnected },
    ],
    [],
  );

  const noSearch = () => ({ data: [], isFetching: false });

  return (
    <PortalLayout
      subtitle={tenant?.name ?? 'Business'}
      roleLabel="Business"
      nav={nav}
      useSearch={noSearch}
      searchPlaceholder="Search developer pages…"
    />
  );
}
