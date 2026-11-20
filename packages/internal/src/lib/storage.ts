import type { OctapSession } from '../types.js';

/** localStorage key of the non-secret "signed in here before" flag. Its value is only ever `'1'`. */
export const OCTAP_SIGNED_IN_FLAG_KEY = 'octap.sdk.signedIn';

/**
 * Holds the session in memory only, the same way `@octap/shared` authentication does.
 *
 * The Google ID token is a live bearer token for Core, so it never goes into browser storage,
 * where any XSS could read it. A reload drops it; the non-secret flag in localStorage tells the
 * app this browser was signed in, so it can ask Google for a fresh ID token and sign in again.
 */
export class SessionStore {
  private session: OctapSession | null = null;

  constructor(
    /** Called when a stored session is dropped because its token expired. */
    private readonly onExpired: () => void = () => {},
  ) {}

  /** Returns the current session, dropping it first if its token has expired. */
  getSession(): OctapSession | null {
    if (this.session?.expiresAt != null && this.session.expiresAt <= Date.now()) {
      // Keep the flag: an expired Google token is exactly when the app should resume.
      this.session = null;
      this.onExpired();
    }
    return this.session;
  }

  /** Stores the session in memory and sets the signed-in flag. */
  setSession(session: OctapSession): void {
    this.session = session;
    writeFlag(true);
  }

  /** Clears the session and the signed-in flag (sign-out, or Core rejected the token). */
  removeSession(): void {
    this.session = null;
    writeFlag(false);
  }

  /** Whether this browser was signed in before, so a fresh Google ID token is worth requesting. */
  wasSignedIn(): boolean {
    try {
      return globalThis.localStorage?.getItem(OCTAP_SIGNED_IN_FLAG_KEY) === '1';
    } catch {
      return false;
    }
  }
}

function writeFlag(signedIn: boolean): void {
  try {
    if (signedIn) {
      globalThis.localStorage?.setItem(OCTAP_SIGNED_IN_FLAG_KEY, '1');
    } else {
      globalThis.localStorage?.removeItem(OCTAP_SIGNED_IN_FLAG_KEY);
    }
  } catch {
    // Storage can be unavailable (private mode, blocked site data): resume just won't happen.
  }
}
