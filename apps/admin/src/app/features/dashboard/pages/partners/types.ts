import type { OctapClient } from '@octap/internal-sdk';

export type OrganizationList = Awaited<ReturnType<OctapClient['platform']['listOrganizations']>>;
