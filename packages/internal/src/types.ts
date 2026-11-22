import type { OctapError } from './lib/errors.js';

/** Client construction options. */
export interface ClientProps {
  /** API origin, for example `https://api.example.com`. */
  apiBaseUrl: string;
  /**
   * Returns the signed-in user's Google ID token, or `null` when signed out. The app's auth owns
   * the token; the SDK reads it fresh for every request and never stores it.
   */
  getAccessToken: () => string | null;
  /**
   * Called when Core answers 401 to a request that carried a token, so the app can sign out.
   * Requests sent without a token don't trigger it.
   */
  onUnauthorized?: () => void;
}

/** Standard result returned by all asynchronous API methods. */
export type OctapResponse<T> = { data: T; error: null } | { data: null; error: OctapError };

export type JsonObject = Record<string, unknown>;
