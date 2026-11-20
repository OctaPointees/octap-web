import { AxiosError } from 'axios';
import { ConsoleApi } from './generated/console.js';
import { CreditsApi } from './generated/credits.js';
import { HealthApi } from './generated/health.js';
import { IdentityApi } from './generated/identity.js';
import { OrganizationsApi } from './generated/organizations.js';
import { PlatformApi } from './generated/platform.js';
import { RewardsApi } from './generated/rewards.js';
import { WebhooksApi } from './generated/webhooks.js';
import type * as OpenApi from './generated/openapi.js';
import { HttpClient } from './lib/http.js';
import { SessionStorage } from './lib/storage.js';
import { AuthStateNotifier } from './lib/auth-state.js';
import type {
  AuthStateChangeCallback,
  AuthStateSubscriptionResult,
} from './lib/auth-state.js';
import type {
  ClientProps,
  OctapError,
  OctapResponse,
  OctapSession,
} from './types.js';

function parseExpiration(value: string): number | null {
  const expiration = Date.parse(value);
  return Number.isNaN(expiration) ? null : expiration;
}

class OctapAuthApi {
  constructor(
    private readonly consoleApi: OctapConsoleApi,
    private readonly storage: SessionStorage,
    private readonly authState: AuthStateNotifier,
  ) {
    this.authState.setSessionResolver(() => this.verifySession());
  }

  /** Subscribes to sign-in, sign-out, and initial session changes. */
  onAuthStateChange = (callback: AuthStateChangeCallback): AuthStateSubscriptionResult => {
    return this.authState.onAuthStateChange(callback);
  };

  /** Signs in with a Google ID token and persists the session in localStorage. */
  signInWithGoogleIDToken = (token: string): Promise<OctapResponse<OpenApi.ConsoleIdentityLoginResponse>> => {
    return this.consoleApi.login({ idToken: token });
  };

  /** Returns the current persisted browser session, if one exists. */
  getSession = (): OctapSession | null => {
    return this.storage.getSession();
  };

  /** Fetches and verifies the current console user profile. */
  getUser = async (): Promise<OctapResponse<OpenApi.ConsoleIdentityMeResponse['user']>> => {
    const session = this.storage.getSession();
    if (session === null) {
      return {
        data: null,
        error: new AxiosError('No active session.', 'ERR_BAD_REQUEST') as OctapError<OpenApi.ConsoleIdentityMeResponse['user']>,
      };
    }

    const result = await this.consoleApi.me();
    if (result.data === null) {
      if (result.error?.response?.status === 401) {
        this.storage.removeSession();
        this.authState.emit('SIGNED_OUT', null);
      }
      return {
        data: null,
        error: result.error as unknown as OctapError<OpenApi.ConsoleIdentityMeResponse['user']>,
      };
    }

    const profile = result.data;
    if (this.storage.getSession()?.accessToken !== session.accessToken) {
      return {
        data: null,
        error: new AxiosError('The session changed while the profile was loading.', 'ERR_CANCELED') as OctapError<OpenApi.ConsoleIdentityMeResponse['user']>,
      };
    }
    const updatedSession: OctapSession = {
      ...session,
      expiresAt: parseExpiration(profile.expiresAt),
      user: profile.user,
    };
    try {
      this.storage.setSession(updatedSession);
    } catch (error: unknown) {
      return {
        data: null,
        error: new AxiosError(
          error instanceof Error ? error.message : String(error),
          'ERR_STORAGE_UNAVAILABLE',
        ) as OctapError<OpenApi.ConsoleIdentityMeResponse['user']>,
      };
    }

    return {
      data: profile.user,
      error: null,
    };
  };

  private async verifySession(): Promise<OctapSession | null> {
    const session = this.storage.getSession();
    if (session === null) {
      return null;
    }

    const result = await this.consoleApi.me();
    if (result.data === null) {
      if (result.error?.response?.status === 401) {
        this.storage.removeSession();
      }
      return null;
    }

    const profile = result.data;
    if (this.storage.getSession()?.accessToken !== session.accessToken) {
      return null;
    }
    const verifiedSession: OctapSession = {
      ...session,
      expiresAt: parseExpiration(profile.expiresAt),
      user: profile.user,
    };
    try {
      this.storage.setSession(verifiedSession);
      return verifiedSession;
    } catch {
      return null;
    }
  }

  /** Clears the local browser session. */
  signOut = (): void => {
    this.storage.removeSession();
    this.authState.emit('SIGNED_OUT', null);
  };
}

class OctapConsoleApi extends ConsoleApi {
  constructor(
    http: HttpClient,
    private readonly storage: SessionStorage,
    private readonly authState: AuthStateNotifier,
  ) {
    super(http);
  }

  override async login(input: OpenApi.ConsoleIdentityLoginInput): Promise<OctapResponse<OpenApi.ConsoleIdentityLoginResponse>> {
    const result = await super.login(input);
    if (result.data === null) {
      return result;
    }

    try {
      this.storage.setSession({ accessToken: input.idToken, expiresAt: null, user: null });
    } catch (error: unknown) {
      return {
        data: null,
        error: new AxiosError(
          error instanceof Error ? error.message : String(error),
          'ERR_STORAGE_UNAVAILABLE',
        ) as OctapError<OpenApi.ConsoleIdentityLoginResponse>,
      };
    }

    const profileResult = await super.me();
    if (profileResult.data === null) {
      this.storage.removeSession();
      this.authState.emit('SIGNED_OUT', null);
      return {
        data: null,
        error: profileResult.error as OctapError<OpenApi.ConsoleIdentityLoginResponse>,
      };
    }

    const profile = profileResult.data;
    try {
      this.storage.setSession({
        accessToken: input.idToken,
        expiresAt: parseExpiration(profile.expiresAt),
        user: profile.user,
      });
    } catch (error: unknown) {
      this.storage.removeSession();
      this.authState.emit('SIGNED_OUT', null);
      return {
        data: null,
        error: new AxiosError(
          error instanceof Error ? error.message : String(error),
          'ERR_STORAGE_UNAVAILABLE',
        ) as OctapError<OpenApi.ConsoleIdentityLoginResponse>,
      };
    }

    this.authState.emit('SIGNED_IN', this.storage.getSession());
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
  create(input: Parameters<RewardsApi['createVoucher']>[0]): ReturnType<RewardsApi['createVoucher']> {
    return this.rewards.createVoucher(input);
  }

  /** Updates a voucher. */
  update(input: Parameters<RewardsApi['updateVoucher']>[0]): ReturnType<RewardsApi['updateVoucher']> {
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
    const sessionStorage = new SessionStorage();
    const authState = new AuthStateNotifier(sessionStorage);
    const http = new HttpClient(props.api_url, sessionStorage);
    this.console = new OctapConsoleApi(http, sessionStorage, authState);
    this.auth = new OctapAuthApi(this.console, sessionStorage, authState);
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
