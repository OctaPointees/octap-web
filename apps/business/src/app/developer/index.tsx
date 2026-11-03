import { useConsoleAuth } from '@octap/shared/google-auth';
import { useMemo } from 'react';
import { House, Key, PlugsConnected, ShareNetwork, UsersThree } from 'phosphor-react';
import PortalLayout from '@/components/layout/PortalLayout';
import type { NavOption } from '@/components/layout/SidePanel';
import { useMerchantTenant } from '@/queries/merchant';

export default function DeveloperLayout() {
  const auth = useConsoleAuth();
  const tenant = useMerchantTenant(!auth).data;

  const nav = useMemo<NavOption[]>(
    () => [
      { label: 'Dashboard', path: '/developer', icon: House, end: true },
      { label: 'Members', path: '/developer/members', icon: UsersThree },
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
      roleLabel="Business"
      nav={
        auth
          ? [
              ...nav,
              { label: 'Organizations', path: '/organizations', icon: House },
              { label: 'Organization onboarding', path: '/onboarding', icon: House },
              ...(auth.identity?.user.systemRole === 'SYSTEM_ADMIN'
                ? [
                    {
                      label: 'Platform administration',
                      path:
                        import.meta.env.VITE_ADMIN_PORTAL_URL ||
                        (import.meta.env.DEV ? 'http://localhost:5000/admin' : '/admin'),
                      icon: House,
                    },
                  ]
                : []),
            ]
          : nav
      }
      useSearch={noSearch}
      searchPlaceholder="Search developer pages…"
    />
  );
}
