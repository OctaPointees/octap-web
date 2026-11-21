import type { FormEvent } from 'react';
import type { OrganizationType } from '@octap/internal-sdk';

/** The organization's pages, one per feature, under `/organizations/:slug`. */
export type OrganizationPage = 'rewards' | 'members' | 'api-keys' | 'team' | 'settings';

/** `/organizations/:slug`, the dashboard, or one of its feature pages. */
export const organizationPath = (slug: string, page?: OrganizationPage) =>
  ['/organizations', slug, page].filter(Boolean).join('/');

/** The dashboard of an organization the user belongs to. */
export const dashboardPath = (org: { slug: string }) => organizationPath(org.slug);

/** Query keys for one organization's data (the team's live in `app/team`). Sign-out clears them. */
export const organizationKeys = {
  detail: (organizationId: string) => ['console', 'organization', organizationId] as const,
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
