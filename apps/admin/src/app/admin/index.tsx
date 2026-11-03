import { useConsoleAuth } from '@octap/shared/google-auth';
import { Gauge, HardDrive, Layout, Storefront, Ticket, Users } from 'phosphor-react';
import PortalLayout from '../../components/layout/PortalLayout';
import type { NavOption } from '../../components/layout/SidePanel';
import { useAdminRewards, useAdminSearch } from '../../queries/admin';

export default function AdminAppEntryPoint() {
  const auth = useConsoleAuth();
  const pending = useAdminRewards('pending_review', !auth).data?.length;
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
      badge: auth?.data.applications?.filter((row) => row.status === 'PENDING').length,
    },
    { label: 'Vouchers', path: '/admin/vouchers', icon: Ticket, badge: pending },
    { label: 'System Audit', path: '/admin/audit', icon: HardDrive },
    ...(auth?.identity?.organizations.length && businessPortalUrl
      ? [{ label: 'Business dashboard', path: businessPortalUrl, icon: Storefront }]
      : []),
  ];

  return (
    <PortalLayout
      subtitle="System Dashboard"
      roleLabel="Administrator"
      nav={nav}
      useSearch={
        auth
          ? (q: string) => ({
              data: q.trim()
                ? auth.data.applications
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
            })
          : useAdminSearch
      }
      searchPlaceholder="Search partners, rewards, tx digests…"
    />
  );
}
