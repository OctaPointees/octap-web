import type { OctapClient } from '@octap/internal-sdk';

export type OrganizationList = Awaited<ReturnType<OctapClient['platform']['listOrganizations']>>;

/** The partner table's columns, by the name the Display Columns menu shows. */
export const PARTNER_COLUMNS = [
  'Organization Details',
  'Company Information',
  'Created At',
  'Program & Provisioning',
  'Status',
] as const;
export type PartnerColumn = (typeof PARTNER_COLUMNS)[number];
