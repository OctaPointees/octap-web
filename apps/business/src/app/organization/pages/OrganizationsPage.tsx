import { ADMIN_PORTAL_URL } from '@/components/layout/nav';
import { OrganizationPicker } from '../components/OrganizationPicker';
import { useOrganization } from '../hooks/useOrganization';

/** `/organizations`: the organizations the user can open, and their pending requests. */
export default function OrganizationsPage() {
  const { error } = useOrganization();
  return (
    <>
      {error && (
        <p role="alert" className="alert alert-error">
          {error}
        </p>
      )}
      <OrganizationPicker adminPortalUrl={ADMIN_PORTAL_URL} />
    </>
  );
}
