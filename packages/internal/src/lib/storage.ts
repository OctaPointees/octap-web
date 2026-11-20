import type { OctapSession } from '../types.js';

export const OCTAP_SESSION_KEY = 'octap.session';

/** Browser storage adapter for the current access token. */
export class SessionStorage {
  /** Reads the persisted session when browser storage is available. */
  getSession(): OctapSession | null {
    const storage = this.getStorage();
    if (storage === null) {
      return null;
    }

    let rawSession: string | null;
    try {
      rawSession = storage.getItem(OCTAP_SESSION_KEY);
    } catch {
      return null;
    }
    if (rawSession === null) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawSession) as Partial<OctapSession>;
      if (typeof parsed.accessToken !== 'string') {
        storage.removeItem(OCTAP_SESSION_KEY);
        return null;
      }
      return {
        accessToken: parsed.accessToken,
        expiresAt: typeof parsed.expiresAt === 'number' ? parsed.expiresAt : null,
        user: parsed.user ?? null,
      };
    } catch {
      storage.removeItem(OCTAP_SESSION_KEY);
      return null;
    }
  }

  /** Persists the session in localStorage. */
  setSession(session: OctapSession): void {
    const storage = this.getStorage();
    if (storage === null) {
      throw new Error('localStorage is unavailable; the session cannot be persisted.');
    }
    storage.setItem(OCTAP_SESSION_KEY, JSON.stringify(session));
  }

  /** Removes the persisted session. */
  removeSession(): void {
    try {
      this.getStorage()?.removeItem(OCTAP_SESSION_KEY);
    } catch {
      // Storage can be disabled by browser privacy settings.
    }
  }

  private getStorage(): Storage | null {
    try {
      return typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage;
    } catch {
      return null;
    }
  }
}
