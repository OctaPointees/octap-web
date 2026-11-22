import type { ConsoleIdentity } from '../../console-api/client';
import { verifyGoogleCredential } from './identity';

/** What Google reports about a prompt. Under FedCM only some of these methods exist. */
interface PromptMoment {
  getMomentType?(): string;
  isNotDisplayed?(): boolean;
  getNotDisplayedReason?(): string;
  isSkippedMoment?(): boolean;
  getSkippedReason?(): string;
  isDismissedMoment?(): boolean;
  getDismissedReason?(): string;
}

export interface GoogleIdentity {
  initialize(options: {
    client_id: string;
    nonce: string;
    auto_select: boolean;
    use_fedcm_for_prompt?: boolean;
    cancel_on_tap_outside?: boolean;
    callback: (response: { credential: string }) => void;
  }): void;
  renderButton(
    element: HTMLElement,
    options: { theme: string; size: string; text: string; width: number },
  ): void;
  prompt?(listener?: (moment: PromptMoment) => void): void;
  cancel?(): void;
  disableAutoSelect(): void;
}

const loadedSdk = () =>
  (window as unknown as { google?: { accounts?: { id?: GoogleIdentity } } }).google?.accounts?.id;

let loading: Promise<GoogleIdentity> | undefined;
/** Loads Google Identity Services once per page. */
export function loadGoogleIdentity(): Promise<GoogleIdentity> {
  const existing = loadedSdk();
  if (existing) return Promise.resolve(existing);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    const fail = () => {
      window.clearTimeout(timer);
      script.remove();
      loading = undefined;
      reject(new Error('Google sign-in could not load. Check your connection and try again.'));
    };
    const timer = window.setTimeout(fail, 20_000);
    script.onerror = fail;
    script.onload = () => {
      const sdk = loadedSdk();
      if (!sdk) return fail();
      window.clearTimeout(timer);
      resolve(sdk);
    };
    document.head.appendChild(script);
  });
  return loading;
}

/** A fresh nonce binds Google's answer to this one sign-in attempt. */
export const newLoginNonce = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)), (value) =>
    value.toString(16).padStart(2, '0'),
  ).join('');

/** This is a browser flow-binding check only. Core performs cryptographic verification. */
export function assertLoginNonce(jwt: string, expected: string): void {
  try {
    const part = jwt.split('.')[1];
    const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.nonce === expected) return;
  } catch {
    /* Report the same failure for malformed or mismatching responses. */
  }
  throw new Error('Google login response did not match this sign-in attempt. Please retry.');
}

export interface SignInResult {
  identity: ConsoleIdentity;
  credential: string;
}

/**
 * Asks Google for a fresh ID token without a click (automatic sign-in for a returning user),
 * then verifies it with Core like a button sign-in. Resolves `null` when Google cannot sign
 * the user in silently: no Google session, a recent sign-out, a dismissed prompt, a timeout,
 * or `cancel()`. Nothing is read from or written to browser storage.
 */
export function silentGoogleSignIn({
  clientId,
  apiBaseUrl = '',
  timeoutMs = 30_000,
}: {
  clientId: string;
  apiBaseUrl?: string;
  timeoutMs?: number;
}): { result: Promise<SignInResult | null>; cancel: () => void } {
  const abort = new AbortController();
  let finish: (value: SignInResult | null, reason?: string) => void = () => {};
  let sdk: GoogleIdentity | undefined;
  let verifying = false;
  const result = new Promise<SignInResult | null>((resolve) => {
    const timer = window.setTimeout(
      () => cancel(`no answer from Google in ${timeoutMs} ms`),
      timeoutMs,
    );
    finish = (value, reason) => {
      window.clearTimeout(timer);
      finish = () => {};
      // Google's own [GSI_LOGGER] lines in the console usually say more.
      if (!value) console.warn(`[OctaP] Automatic Google sign-in did not complete: ${reason}`);
      resolve(value);
    };
  });
  const cancel = (reason = 'cancelled') => {
    abort.abort();
    sdk?.cancel?.();
    finish(null, reason);
  };
  const nonce = newLoginNonce();
  void loadGoogleIdentity()
    .then((loaded) => {
      if (abort.signal.aborted) return;
      sdk = loaded;
      if (!loaded.prompt) return finish(null, 'this Google script has no prompt()');
      loaded.initialize({
        client_id: clientId,
        nonce,
        auto_select: true,
        use_fedcm_for_prompt: true,
        cancel_on_tap_outside: false,
        callback: (response) => {
          if (abort.signal.aborted || verifying) return;
          verifying = true;
          void (async () => {
            try {
              assertLoginNonce(response.credential, nonce);
              const identity = await verifyGoogleCredential(
                apiBaseUrl,
                response.credential,
                AbortSignal.any([abort.signal, AbortSignal.timeout(30_000)]),
              );
              finish({ identity, credential: response.credential });
            } catch (cause) {
              finish(
                null,
                `Core rejected the token: ${cause instanceof Error ? cause.message : cause}`,
              );
            }
          })();
        },
      });
      loaded.prompt((moment) => {
        if (verifying) return;
        if (moment.isNotDisplayed?.())
          finish(null, `prompt not displayed (${moment.getNotDisplayedReason?.()})`);
        else if (moment.isSkippedMoment?.())
          finish(null, `prompt skipped (${moment.getSkippedReason?.()})`);
        else if (
          moment.isDismissedMoment?.() &&
          moment.getDismissedReason?.() !== 'credential_returned'
        )
          finish(null, `prompt dismissed (${moment.getDismissedReason?.()})`);
      });
    })
    .catch((cause) => finish(null, `Google script failed to load: ${cause}`));
  return { result, cancel: () => cancel() };
}

/** After an explicit sign-out, stops Google from signing the user straight back in. */
export function disableGoogleAutoSelect(): void {
  loadedSdk()?.disableAutoSelect();
}
