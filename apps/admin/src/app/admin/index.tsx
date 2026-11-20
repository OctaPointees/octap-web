import { useAuth } from '@octap/shared/authentication';
import { Gauge, HardDrive, Layout, Storefront, Ticket, Users } from 'phosphor-react';
import PortalLayout from '../../components/layout/PortalLayout';
import type { NavOption } from '../../components/layout/SidePanel';
import { usePlatformOrganizationRequests } from '../../queries/organizationRequests';

export default function AdminAppEntryPoint() {
  const { identity } = useAuth();
  const requests = usePlatformOrganizationRequests().data;
  const businessPortalUrl =
    import.meta.env.VITE_BUSINESS_PORTAL_URL ||
    (import.meta.env.DEV ? 'http://localhost:5173/' : '');

  const nav: NavOption[] = [
    { label: 'Dashboard', path: '/admin', icon: Layout, end: true },
    { label: 'Metrics', path: '/admin/metrics', icon: Gauge },
    {
      label: 'Partners',
      path: '/admin/partners',
      icon: Users,
      badge: requests?.filter((row) => row.status === 'PENDING').length,
    },
    { label: 'Vouchers', path: '/admin/vouchers', icon: Ticket },
    { label: 'System Audit', path: '/admin/audit', icon: HardDrive },
    ...(identity?.organizations.length && businessPortalUrl
      ? [{ label: 'Business dashboard', path: businessPortalUrl, icon: Storefront }]
      : []),
  ];

  return (
    <PortalLayout
      subtitle="System Dashboard"
      roleLabel="Administrator"
      nav={nav}
      useSearch={(q: string) => ({
        data: q.trim()
          ? requests
              ?.filter((row) => row.name.toLowerCase().includes(q.toLowerCase()))
              .map((row) => ({
                id: row.id,
                title: row.name,
                subtitle: row.status,
                type: 'organization request',
                to: '/admin/partners',
              }))
          : [],
        isFetching: false,
      })}
      searchPlaceholder="Search partners, rewards, tx digests…"
    />
  );
}
