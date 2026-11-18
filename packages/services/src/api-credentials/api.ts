import {
  normalizeCredential,
  type ConsoleCredential,
  type IssuedConsoleCredential,
  type RawConsoleCredential,
} from './types';
import type { CoreRequest } from '../rewards/api';

/** Organization API credentials through Core's console routes. */
export function createApiCredentialsApi(request: CoreRequest) {
  const credentials = (organizationId: string) =>
    `/v1/console/organizations/${encodeURIComponent(organizationId)}/api-credentials`;
  const credential = (organizationId: string, id: string) =>
    `${credentials(organizationId)}/${encodeURIComponent(id)}`;

  return {
    list: async (organizationId: string, signal?: AbortSignal): Promise<ConsoleCredential[]> =>
      (
        await request<RawConsoleCredential[]>(credentials(organizationId), 'GET', undefined, signal)
      ).map(normalizeCredential),
    issue: async (
      organizationId: string,
      input: { name: string; scope?: 'read' | 'write' },
    ): Promise<IssuedConsoleCredential> => {
      const issued = await request<RawConsoleCredential & { rawKey: string }>(
        credentials(organizationId),
        'POST',
        input,
      );
      return { ...normalizeCredential(issued), rawKey: issued.rawKey };
    },
    rename: async (organizationId: string, id: string, name: string): Promise<ConsoleCredential> =>
      normalizeCredential(
        await request<RawConsoleCredential>(credential(organizationId, id), 'PATCH', { name }),
      ),
    revoke: (organizationId: string, id: string) =>
      request<{ revoked: true }>(credential(organizationId, id), 'DELETE'),
  };
}

export type ApiCredentialsApi = ReturnType<typeof createApiCredentialsApi>;
