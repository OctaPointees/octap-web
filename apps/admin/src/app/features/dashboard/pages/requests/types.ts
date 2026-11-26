import type { OctapClient } from '@octap/internal-sdk';

export type ChangeRequestList = Awaited<ReturnType<OctapClient['platform']['listChangeRequests']>>;

export type ChangeRequest = NonNullable<ChangeRequestList['data']>['items'][number];

export type ChangeRequestStatus = ChangeRequest['status'];
