import { useContext } from 'react';
import { OrganizationContext, type OrganizationSession } from '../context/OrganizationContext';

/** The current organization. Must be used below `OrganizationProvider`. */
export function useOrganization(): OrganizationSession {
  const session = useContext(OrganizationContext);
  if (!session) throw new Error('useOrganization() must be used inside <OrganizationProvider>.');
  return session;
}
