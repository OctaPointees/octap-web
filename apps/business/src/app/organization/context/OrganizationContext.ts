import { createContext, type FormEvent } from 'react';
import type {
  ConsoleClient,
  ConsoleIdentity,
  ConsoleInvitation,
  ConsoleOrganization,
  ConsoleStaff,
} from '@octap/shared/console-api';

export interface OrganizationData {
  organization?: ConsoleOrganization;
  staff?: ConsoleStaff[];
  invitations?: ConsoleInvitation[];
}

/** Which organization the signed-in user is working in, its data, and actions on it. */
export interface OrganizationSession {
  /** The current organization's entry in the identity, when one is selected. */
  selected?: ConsoleIdentity['organizations'][number];
  organizationId: string;
  /** Business Owner of the current organization (otherwise Business Developer). */
  owner: boolean;
  data: OrganizationData;
  /** A failed data load for the current page. Action results are toasts instead. */
  error: string;
  /** True while an action runs. */
  busy: boolean;
  /** True while the current page's data loads. */
  loading: boolean;
  /** Increases after each action, so forms can reset to the saved values. */
  revision: number;
  /** The token from an invitation link, kept until it is accepted. */
  invitation: string;
  setInvitation(token: string): void;
  /** The last invitation link created on the team page. */
  inviteLink: string;
  setInviteLink(link: string): void;
  /** Opens an organization: selects it and goes to its dashboard. */
  choose(organizationId: string): void;
  setOrganizationId(organizationId: string): void;
  /**
   * Runs an action, then reads the identity again. Its result is a toast: `success` (when not
   * empty) or the error.
   */
  perform(
    action: (client: ConsoleClient) => Promise<void>,
    success: string,
    after?: (current: ConsoleIdentity) => void,
  ): Promise<void>;
  /** Stops a form submit and returns its fields. */
  fields(event: FormEvent<HTMLFormElement>): FormData;
}

export const OrganizationContext = createContext<OrganizationSession | null>(null);

export const dashboardPath = (org: { persona: string }) =>
  org.persona === 'BUSINESS_OWNER' ? '/merchant' : '/developer';
