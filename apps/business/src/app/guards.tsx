import { Navigate, Outlet } from 'react-router';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { organizationPath } from '@/app/organization/utils';

/** The Business panel is for Owners: Developers go to their own panel. */
export function RequireOwner() {
  const { organizationId, owner } = useOrganization();
  if (!owner) return <Navigate to={organizationPath(organizationId, 'developer')} replace />;
  return <Outlet />;
}
