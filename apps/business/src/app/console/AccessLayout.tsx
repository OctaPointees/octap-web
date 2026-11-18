import { Buildings, Layout, PlusCircle } from 'phosphor-react';
import { useConsoleAuth } from '@octap/shared/google-auth';
import { useLocation } from 'react-router';
import PortalLayout from '@/components/layout/PortalLayout';
import { platformAdminLinks } from '@/components/layout/nav';

export default function ConsoleAccessLayout() {
  const auth = useConsoleAuth();
  const location = useLocation();
  const nav = [
    ...(auth?.selected
      ? [{ label: 'Dashboard', path: auth.owner ? '/merchant' : '/developer', icon: Layout }]
      : []),
    { label: 'Organizations', path: '/organizations', icon: Buildings },
    { label: 'Organization onboarding', path: '/onboarding', icon: PlusCircle },
    ...platformAdminLinks(auth),
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
