import { Buildings, Layout, PlusCircle } from 'phosphor-react';
import { useAuth } from '@octap/shared/authentication';
import { useOrganization } from '@/app/organization/context';
import { useLocation } from 'react-router';
import PortalLayout from '@/components/layout/PortalLayout';
import { platformAdminLinks } from '@/components/layout/nav';

export default function ConsoleAccessLayout() {
  const { identity } = useAuth();
  const organization = useOrganization();
  const location = useLocation();
  const nav = [
    ...(organization.selected
      ? [
          {
            label: 'Dashboard',
            path: organization.owner ? '/merchant' : '/developer',
            icon: Layout,
          },
        ]
      : []),
    { label: 'Organizations', path: '/organizations', icon: Buildings },
    { label: 'Organization onboarding', path: '/onboarding', icon: PlusCircle },
    ...platformAdminLinks(identity),
  ];
  return (
    <PortalLayout
      subtitle="OctaP Organization"
      // Account-level pages: the organization list and creating or joining one.
      hideSidebar={location.pathname === '/organizations' || location.pathname === '/onboarding'}
      nav={nav}
      useSearch={() => ({ data: [], isFetching: false })}
    />
  );
}
