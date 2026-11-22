import { useContext } from 'react';
import { OrganizationContext, type CurrentOrganization } from '../context/OrganizationContext';

/** The organization in the URL. Must be used on a page under `/organizations/:organizationId`. */
export function useOrganization(): CurrentOrganization {
  const current = useContext(OrganizationContext);
  if (!current)
    throw new Error('useOrganization() must be used under /organizations/:organizationId.');
  return current;
}

/** The organization in the URL, or `undefined` on pages outside one (the list, onboarding). */
export function useCurrentOrganization(): CurrentOrganization | undefined {
  return useContext(OrganizationContext) ?? undefined;
}
