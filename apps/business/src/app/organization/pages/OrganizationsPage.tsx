import { ADMIN_PORTAL_URL } from '@/components/layout/nav';
import { OrganizationPicker } from '../components/OrganizationPicker';

/** `/organizations`: the organizations the user can open, and their pending requests. */
export default function OrganizationsPage() {
  return <OrganizationPicker adminPortalUrl={ADMIN_PORTAL_URL} />;
}
