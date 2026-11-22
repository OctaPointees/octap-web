import { createContext } from 'react';
import type { ConsoleIdentity, ConsoleOrganization } from '@octap/shared/console-api';

/** The user's entry for an organization in their identity. */
export type Membership = ConsoleIdentity['organizations'][number];

/** The organization in the URL (`/organizations/:organizationId/...`), loaded from Core. */
export interface CurrentOrganization {
  organizationId: string;
  membership: Membership;
  organization: ConsoleOrganization;
  /** Business Owner of this organization (otherwise Business Developer). */
  owner: boolean;
  /** When `organization` was last loaded. It changes after each save, so forms can reset. */
  revision: number;
}

export const OrganizationContext = createContext<CurrentOrganization | null>(null);
