import type { FormEvent } from 'react';
import type { OrganizationType } from '@octap/internal-sdk';

/** The two dashboards of an organization: Business (Owners) and Developer. */
export type Panel = 'merchant' | 'developer';

/** The dashboard a persona opens: Owners get Business, Developers get Developer. */
export const panelFor = (persona: string): Panel =>
  persona === 'BUSINESS_OWNER' ? 'merchant' : 'developer';

/** `/organizations/:slug`, then the panel and page when given. */
export const organizationPath = (slug: string, panel?: Panel, page?: string) =>
  ['/organizations', slug, panel, page].filter(Boolean).join('/');

/** The dashboard to open for an organization the user belongs to. */
export const dashboardPath = (org: { slug: string; persona: string }) =>
  organizationPath(org.slug, panelFor(org.persona));

/** Query keys for one organization's data. Signing out clears them all. */
export const organizationKeys = {
  detail: (organizationId: string) => ['console', 'organization', organizationId] as const,
  staff: (organizationId: string) => ['console', 'organization', organizationId, 'staff'] as const,
  invitations: (organizationId: string) =>
    ['console', 'organization', organizationId, 'invitations'] as const,
};

/** Stops a form submit and returns its fields. */
export function formFields(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  return new FormData(event.currentTarget);
}

/** A readable name for Core's organization type. */
export const organizationTypeLabel = (type?: OrganizationType | null) =>
  type === 'COMPANY'
    ? 'Company (registered legal entity)'
    : type === 'INDIVIDUAL_HOUSEHOLD'
      ? 'Individual / Household business'
      : 'Type not set';
