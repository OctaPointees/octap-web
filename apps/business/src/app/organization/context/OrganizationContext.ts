import { createContext } from 'react';
import type { ConsoleOrganizationsOrganizationResponse } from '@octap/internal-sdk';
import type { ConsoleIdentity } from '@octap/shared/authentication';

/** The user's entry for an organization in their identity. */
export type Membership = ConsoleIdentity['organizations'][number];

/** The organization in the URL (`/organizations/:slug/...`), loaded from Core. */
export interface CurrentOrganization {
  /** Core's ID, for API calls and query keys. */
  organizationId: string;
  /** The slug in the URL, for links. */
  slug: string;
  membership: Membership;
  organization: ConsoleOrganizationsOrganizationResponse;
  /** Business Owner of this organization (otherwise Business Developer). */
  owner: boolean;
  /**
   * Goes up each time `organization` actually changes, such as after a save, so forms can reset.
   * A reload that finds nothing new leaves it alone.
   */
  revision: number;
}

export const OrganizationContext = createContext<CurrentOrganization | null>(null);
