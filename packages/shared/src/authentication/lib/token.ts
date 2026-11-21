/**
 * Holds the Google ID token in memory for one `AuthProvider`, plus what to do when Core rejects
 * it. The SDK client asks it for the token on every request and reports a 401 to it; nothing
 * here touches browser storage.
 */
export function createTokenHolder() {
  let token = '';
  let rejected = () => {};
  return {
    get: () => token || null,
    set: (value: string) => {
      token = value;
    },
    clear: () => {
      token = '';
    },
    /** Called by the SDK client when Core answers 401 to a request that carried the token. */
    unauthorized: () => rejected(),
    /** Sets what `unauthorized` runs. */
    onUnauthorized: (handler: () => void) => {
      rejected = handler;
    },
  };
}
