import type { OctapClient } from '@octap/internal-sdk';
import { unwrap } from '@octap/shared/authentication';
import {
  normalizeCredential,
  type ConsoleCredential,
  type IssuedConsoleCredential,
  type RawConsoleCredential,
} from './types';

/** Organization API credentials through Core's console routes, on `useAuth().api`. */
export function createApiCredentialsApi(api: OctapClient) {
  return {
    list: async (organizationId: string): Promise<ConsoleCredential[]> =>
      (
        (await unwrap(api.console.listApiCredentials({ organizationId }))) as RawConsoleCredential[]
      ).map(normalizeCredential),
    issue: async (
      organizationId: string,
      input: { name: string; scope?: 'read' | 'write' },
    ): Promise<IssuedConsoleCredential> => {
      const issued = (await unwrap(
        api.console.issue({ organizationId, body: input }),
      )) as RawConsoleCredential & { rawKey: string };
      return { ...normalizeCredential(issued), rawKey: issued.rawKey };
    },
    rename: async (organizationId: string, id: string, name: string): Promise<ConsoleCredential> =>
      normalizeCredential(
        (await unwrap(
          api.console.rename({ organizationId, id, body: { name } }),
        )) as RawConsoleCredential,
      ),
    revoke: (organizationId: string, id: string) =>
      unwrap(api.console.revoke({ organizationId, id })),
  };
}

export type ApiCredentialsApi = ReturnType<typeof createApiCredentialsApi>;
