import {
  OctapClient,
  type ConsoleIdentityMeResponse,
  type OctapResponse,
  type OrganizationType,
} from '@octap/internal-sdk';

/**
 * The `@octap/internal-sdk` client `AuthProvider` hands out as `useAuth().api`. It reads the
 * Google ID token through `getAccessToken` for every request and never stores it. An empty
 * `apiBaseUrl` means the page's own origin (the Vite proxy in development).
 */
export function createCoreClient({
  apiBaseUrl,
  getAccessToken,
  onUnauthorized,
}: {
  apiBaseUrl: string;
  getAccessToken: () => string | null;
  onUnauthorized?: () => void;
}) {
  return new OctapClient({
    apiBaseUrl: apiBaseUrl.trim() || window.location.origin,
    getAccessToken,
    ...(onUnauthorized ? { onUnauthorized } : {}),
  });
}

/**
 * The SDK answers `{ data, error }`. This returns `data`, or throws the `OctapError`, so TanStack
 * Query, mutations and `try`/`catch` see failures the usual way.
 *
 * @example
 * const organization = await unwrap(api.console.organization({ organizationId }));
 */
export async function unwrap<T>(response: Promise<OctapResponse<T>>): Promise<T> {
  const { data, error } = await response;
  if (error) throw error;
  return data;
}

type IdentityOrganization = ConsoleIdentityMeResponse['organizations'][number];

/**
 * The signed-in user and their organizations, from sign-in or `/me`: Core's response, plus two
 * profile fields Core does not return for memberships yet and the portals read when it does.
 */
export interface ConsoleIdentity extends Omit<ConsoleIdentityMeResponse, 'organizations'> {
  organizations: Array<
    IdentityOrganization & {
      organizationType?: OrganizationType | null;
      representativeName?: string | null;
    }
  >;
}
