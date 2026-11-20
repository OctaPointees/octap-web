import { Navigate } from 'react-router';
import { useOrganization } from '../hooks/useOrganization';
import { dashboardPath } from '../utils';

/** `/organizations/:slug`: opens the dashboard the user's role has. */
export default function OrganizationHome() {
  const { membership } = useOrganization();
  return <Navigate to={dashboardPath(membership)} replace />;
}
