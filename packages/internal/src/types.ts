import type { AxiosError, AxiosResponse } from 'axios';
import type * as OpenApi from './generated/openapi.js';

/** Client construction options. */
export interface ClientProps {
  /** API origin, for example `https://api.example.com`. */
  api_url: string;
}

/**
 * Deprecated Axios response type retained for compatibility.
 * @deprecated Successful SDK results now expose the response body as `T`.
 */
export interface OctapData<T> extends AxiosResponse<T> {}

/** Axios error returned by an OctaP SDK method. */
export interface OctapError<T = unknown> extends AxiosError<T> {}

/** Standard result returned by all asynchronous API methods. */
export type OctapResponse<T> = { data: T; error: null } | { data: null; error: OctapError<T> };

/** Stored browser authentication session. */
export interface OctapSession {
  accessToken: string;
  expiresAt: number | null;
  user: OpenApi.ConsoleIdentityMeResponse['user'] | null;
}

export type JsonObject = Record<string, unknown>;
