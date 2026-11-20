import { ConsoleApi } from './generated/console.js';
import { HealthApi } from './generated/health.js';
import { IdentityApi } from './generated/identity.js';
import { OrganizationsApi } from './generated/organizations.js';
import { PlatformApi } from './generated/platform.js';
import { HttpClient } from './lib/http.js';
import type { ClientProps } from './types.js';

/**
 * Browser client for the OctaP Core API.
 *
 * It holds no session of its own: the app's auth (`AuthProvider` in `@octap/shared`) owns the
 * Google ID token and sign-out, and passes them in.
 *
 * @example
 * ```ts
 * const client = new OctapClient({
 *   apiBaseUrl: 'https://api.example.com',
 *   getAccessToken: () => auth.accessToken(),
 *   onUnauthorized: auth.signOut,
 * });
 * const { data, error } = await client.console.listMembers({ organizationId });
 * ```
 */
export class OctapClient {
  readonly console: ConsoleApi;
  readonly health: HealthApi;
  readonly identity: IdentityApi;
  readonly organizations: OrganizationsApi;
  readonly platform: PlatformApi;

  /** Creates a client for the supplied API origin. */
  constructor({ apiBaseUrl, getAccessToken, onUnauthorized }: ClientProps) {
    if (apiBaseUrl.trim().length === 0) {
      throw new TypeError('apiBaseUrl must be a non-empty URL.');
    }
    const http = new HttpClient(apiBaseUrl, getAccessToken, onUnauthorized);
    this.console = new ConsoleApi(http);
    this.health = new HealthApi(http);
    this.identity = new IdentityApi(http);
    this.organizations = new OrganizationsApi(http);
    this.platform = new PlatformApi(http);
  }
}
