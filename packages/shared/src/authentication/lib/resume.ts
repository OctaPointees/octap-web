/**
 * Reload survival without storing credentials: a non-secret "signed in here before" flag in
 * localStorage, so new tabs try too. The Google ID token itself stays in memory; a reload asks
 * Google for a fresh one.
 */
const flagKey = (portal: string) => `octap.console.${portal}.signedIn`;

export const resumeFlag = {
  get(portal: string) {
    try {
      return localStorage.getItem(flagKey(portal)) === '1';
    } catch {
      return false;
    }
  },
  set(portal: string) {
    try {
      localStorage.setItem(flagKey(portal), '1');
    } catch {
      /* Storage can be unavailable (private mode, blocked site data): resume just won't happen. */
    }
  },
  clear(portal: string) {
    try {
      localStorage.removeItem(flagKey(portal));
    } catch {
      /* As above. */
    }
  },
};
