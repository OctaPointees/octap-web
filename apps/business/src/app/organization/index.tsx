import { Buildings, PlusCircle } from 'phosphor-react';
import { useAuth } from '@octap/shared/authentication';
import PortalLayout from '@/components/layout/PortalLayout';
import { platformAdminLinks } from '@/components/layout/nav';

const noSearch = () => ({ data: [], isFetching: false });

/**
 * The account-level shell around the organization list and onboarding: pages that sit above
 * any one organization, so they have no sidebar.
 */
export default function OrganizationLayout() {
  const { identity } = useAuth();
  const nav = [
    { label: 'Organizations', path: '/organizations', icon: Buildings },
    { label: 'Organization onboarding', path: '/onboarding', icon: PlusCircle },
    ...platformAdminLinks(identity),
  ];
  return <PortalLayout subtitle="OctaP Organization" hideSidebar nav={nav} useSearch={noSearch} />;
}
