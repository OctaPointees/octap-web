import type * as OpenApi from './generated/openapi.js';
import type { OctapError } from './lib/errors.js';

/** Client construction options. */
export interface ClientProps {
  /** API origin, for example `https://api.example.com`. */
  api_url: string;
}

/** Standard result returned by all asynchronous API methods. */
export type OctapResponse<T> = { data: T; error: null } | { data: null; error: OctapError };

/** In-memory browser authentication session. */
export interface OctapSession {
  accessToken: string;
  /** When the token expires (epoch ms), or `null` if Core's value couldn't be parsed. */
  expiresAt: number | null;
  user: OpenApi.ConsoleIdentityMeResponse['user'];
}

export type JsonObject = Record<string, unknown>;
