import type { OrganizationType } from './portal-api';
export const organizationTypeLabel = (type?: OrganizationType | null) =>
  type === 'COMPANY'
    ? 'Company (registered legal entity)'
    : type === 'INDIVIDUAL_HOUSEHOLD'
      ? 'Individual / Household business'
      : 'Type not set';
