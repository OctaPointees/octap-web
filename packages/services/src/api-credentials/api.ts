import type { ConsoleCredential, IssuedConsoleCredential } from './types';
import type { CoreRequest } from '../rewards/api';

/** Organization API credentials through Core's console routes. */
export function createApiCredentialsApi(request: CoreRequest) {
  const credentials = (organizationId: string) =>
    `/v1/console/organizations/${encodeURIComponent(organizationId)}/api-credentials`;
  const credential = (organizationId: string, id: string) =>
    `${credentials(organizationId)}/${encodeURIComponent(id)}`;

  return {
    list: (organizationId: string, signal?: AbortSignal) =>
      request<ConsoleCredential[]>(credentials(organizationId), 'GET', undefined, signal),
    issue: (organizationId: string, input: { name: string; scope?: 'read' | 'write' }) =>
      request<IssuedConsoleCredential>(credentials(organizationId), 'POST', input),
    rename: (organizationId: string, id: string, name: string) =>
      request<ConsoleCredential>(credential(organizationId, id), 'PATCH', { name }),
    revoke: (organizationId: string, id: string) =>
      request<{ revoked: true }>(credential(organizationId, id), 'DELETE'),
  };
}

export type ApiCredentialsApi = ReturnType<typeof createApiCredentialsApi>;
