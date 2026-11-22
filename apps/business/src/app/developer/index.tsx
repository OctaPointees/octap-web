import { useAuth } from '@octap/shared/authentication';
import { House, Key, Ticket, UsersThree } from 'phosphor-react';
import PortalLayout from '@/components/layout/PortalLayout';
import type { NavOption } from '@/components/layout/SidePanel';
import { platformAdminLinks } from '@/components/layout/nav';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { organizationPath } from '@/app/organization/utils';

const noSearch = () => ({ data: [], isFetching: false });

/** The Developer panel of the organization in the URL, for its Owners and Developers. */
export default function DeveloperLayout() {
  const { identity } = useAuth();
  const { organizationId, membership } = useOrganization();
  const path = (page?: string) => organizationPath(organizationId, 'developer', page);

  const nav: NavOption[] = [
    { label: 'Dashboard', path: path(), icon: House, end: true },
    { label: 'Members', path: path('members'), icon: UsersThree },
    { label: 'Rewards', path: path('rewards'), icon: Ticket },
    { label: 'API keys', path: path('api-keys'), icon: Key },
  ];

  return (
    <PortalLayout
      subtitle={membership.name}
      nav={[...nav, ...platformAdminLinks(identity)]}
      useSearch={noSearch}
      searchPlaceholder="Search pages…"
    />
  );
}
