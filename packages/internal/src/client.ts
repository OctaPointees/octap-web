import { ConsoleApi } from './generated/console.js';
import { CreditsApi } from './generated/credits.js';
import { HealthApi } from './generated/health.js';
import { IdentityApi } from './generated/identity.js';
import { OrganizationsApi } from './generated/organizations.js';
import { PlatformApi } from './generated/platform.js';
import { RewardsApi } from './generated/rewards.js';
import { WebhooksApi } from './generated/webhooks.js';
import type * as OpenApi from './generated/openapi.js';
import { AuthStateNotifier } from './lib/auth-state.js';
import type { AuthStateChangeCallback, AuthStateSubscriptionResult } from './lib/auth-state.js';
import { OctapError } from './lib/errors.js';
import { HttpClient } from './lib/http.js';
import { SessionStore } from './lib/storage.js';
import type { ClientProps, OctapResponse, OctapSession } from './types.js';

type ConsoleUser = OpenApi.ConsoleIdentityMeResponse['user'];

function parseExpiration(value: string): number | null {
  const expiration = Date.parse(value);
  return Number.isNaN(expiration) ? null : expiration;
}

class OctapAuthApi {
  constructor(
    private readonly consoleApi: OctapConsoleApi,
    private readonly store: SessionStore,
    private readonly authState: AuthStateNotifier,
  ) {
    this.authState.setSessionResolver(() => this.verifySession());
  }

  /** Subscribes to sign-in, sign-out, and initial session changes. */
  onAuthStateChange = (callback: AuthStateChangeCallback): AuthStateSubscriptionResult => {
    return this.authState.onAuthStateChange(callback);
  };

  /** Signs in with a Google ID token and keeps the session in memory. */
  signInWithGoogleIDToken = (
    token: string,
  ): Promise<OctapResponse<OpenApi.ConsoleIdentityLoginResponse>> => {
    return this.consoleApi.login({ idToken: token });
  };

  /** Returns the current in-memory session, or `null` when signed out or expired. */
  getSession = (): OctapSession | null => {
    return this.store.getSession();
  };

  /**
   * Whether this browser was signed in before (a non-secret flag, not a credential). After a
   * reload there is no session; when this is `true`, ask Google for a fresh ID token and call
   * `signInWithGoogleIDToken` again.
   */
  wasSignedIn = (): boolean => {
    return this.store.wasSignedIn();
  };

  /** Fetches and verifies the current console user profile. */
  getUser = async (): Promise<OctapResponse<ConsoleUser>> => {
    if (this.store.getSession() === null) {
      return { data: null, error: new OctapError('No active session.', 'NO_SESSION') };
    }
    const session = await this.refreshProfile();
    if (session.error !== null) {
      return session;
    }
    return { data: session.data.user as ConsoleUser, error: null };
  };

  /** Clears the session and the signed-in flag. */
  signOut = (): void => {
    this.store.removeSession();
    this.authState.emit('SIGNED_OUT', null);
  };

  private async verifySession(): Promise<OctapSession | null> {
    if (this.store.getSession() === null) {
      return null;
    }
    const result = await this.refreshProfile();
    return result.data;
  }

  /** Re-reads the profile for the current session and stores the fresh user and expiry. */
  private async refreshProfile(): Promise<OctapResponse<OctapSession>> {
    const session = this.store.getSession();
    if (session === null) {
      return { data: null, error: new OctapError('No active session.', 'NO_SESSION') };
    }

    const result = await this.consoleApi.me();
    if (result.error !== null) {
      if (result.error.status === 401 && this.store.getSession() === session) {
        this.signOut();
      }
      return result;
    }

    if (this.store.getSession() !== session) {
      return {
        data: null,
        error: new OctapError(
          'The session changed while the profile was loading.',
          'SESSION_CHANGED',
        ),
      };
    }
    const updated: OctapSession = {
      ...session,
      expiresAt: parseExpiration(result.data.expiresAt),
      user: result.data.user,
    };
    this.store.setSession(updated);
    return { data: updated, error: null };
  }
}

class OctapConsoleApi extends ConsoleApi {
  constructor(
    http: HttpClient,
    private readonly store: SessionStore,
    private readonly authState: AuthStateNotifier,
  ) {
    super(http);
  }

  override async login(
    input: OpenApi.ConsoleIdentityLoginInput,
  ): Promise<OctapResponse<OpenApi.ConsoleIdentityLoginResponse>> {
    const result = await super.login(input);
    if (result.data === null) {
      return result;
    }

    this.store.setSession({ accessToken: input.idToken, expiresAt: null, user: null });
    const profileResult = await super.me();
    if (profileResult.error !== null) {
      this.store.removeSession();
      this.authState.emit('SIGNED_OUT', null);
      return profileResult;
    }

    const session: OctapSession = {
      accessToken: input.idToken,
      expiresAt: parseExpiration(profileResult.data.expiresAt),
      user: profileResult.data.user,
    };
    this.store.setSession(session);
    this.authState.emit('SIGNED_IN', session);
    return result;
  }
}

/** Convenience aliases for the voucher endpoints under `client.rewards`. */
export class VouchersApi {
  constructor(private readonly rewards: RewardsApi) {}

  /** Lists vouchers. */
  list(input: Parameters<RewardsApi['listVouchers']>[0]): ReturnType<RewardsApi['listVouchers']> {
    return this.rewards.listVouchers(input);
  }

  /** Fetches a voucher by ID. */
  get(input: Parameters<RewardsApi['getVoucher']>[0]): ReturnType<RewardsApi['getVoucher']> {
    return this.rewards.getVoucher(input);
  }

  /** Creates a voucher. */
  create(
    input: Parameters<RewardsApi['createVoucher']>[0],
  ): ReturnType<RewardsApi['createVoucher']> {
    return this.rewards.createVoucher(input);
  }

  /** Updates a voucher. */
  update(
    input: Parameters<RewardsApi['updateVoucher']>[0],
  ): ReturnType<RewardsApi['updateVoucher']> {
    return this.rewards.updateVoucher(input);
  }

  /** Claims a voucher. */
  claim(input: Parameters<RewardsApi['claimVoucher']>[0]): ReturnType<RewardsApi['claimVoucher']> {
    return this.rewards.claimVoucher(input);
  }

  /** Grants a voucher. */
  grant(input: Parameters<RewardsApi['grantVoucher']>[0]): ReturnType<RewardsApi['grantVoucher']> {
    return this.rewards.grantVoucher(input);
  }
}

/**
 * Browser client for the OctaP API.
 *
 * @example
 * ```ts
 * const client = new OctapClient({ api_url: 'https://api.example.com' });
 * const { data, error } = await client.auth.signInWithGoogleIDToken(idToken);
 * ```
 */
export class OctapClient {
  readonly auth: OctapAuthApi;
  readonly console: OctapConsoleApi;
  readonly credits: CreditsApi;
  readonly health: HealthApi;
  readonly identity: IdentityApi;
  readonly organizations: OrganizationsApi;
  readonly platform: PlatformApi;
  readonly rewards: RewardsApi;
  readonly vouchers: VouchersApi;
  readonly webhooks: WebhooksApi;

  /** Creates a client for the supplied API origin. */
  constructor(props: ClientProps) {
    if (props.api_url.trim().length === 0) {
      throw new TypeError('api_url must be a non-empty URL.');
    }
    const authState = new AuthStateNotifier();
    const store = new SessionStore(() => authState.emit('SIGNED_OUT', null));
    authState.setRemoteSignOutHandler(() => {
      if (store.getSession() !== null) {
        store.removeSession();
        authState.emit('SIGNED_OUT', null);
      }
    });
    const http = new HttpClient(props.api_url, () => store.getSession()?.accessToken ?? null);
    this.console = new OctapConsoleApi(http, store, authState);
    this.auth = new OctapAuthApi(this.console, store, authState);
    this.credits = new CreditsApi(http);
    this.health = new HealthApi(http);
    this.identity = new IdentityApi(http);
    this.organizations = new OrganizationsApi(http);
    this.platform = new PlatformApi(http);
    this.rewards = new RewardsApi(http);
    this.vouchers = new VouchersApi(this.rewards);
    this.webhooks = new WebhooksApi(http);
  }
}
