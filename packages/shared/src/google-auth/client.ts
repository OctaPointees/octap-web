import { createConsoleClient, type ConsoleIdentity } from './portal-api';
export type { ConsoleIdentity } from './portal-api';

function readIdentity(body: ConsoleIdentity): ConsoleIdentity {
  if (
    !body?.user?.id ||
    !['SYSTEM_USER', 'SYSTEM_ADMIN'].includes(body.user.systemRole) ||
    !Array.isArray(body.organizations) ||
    !Number.isFinite(Date.parse(body.expiresAt)) ||
    body.organizations.some(
      (org: ConsoleIdentity['organizations'][number]) =>
        !org.organizationId || !['BUSINESS_OWNER', 'BUSINESS_DEVELOPER'].includes(org.persona),
    )
  ) {
    throw new Error('Core returned an invalid portal identity.');
  }
  return body;
}

export async function verifyConsoleGoogleCredential(
  base: string,
  idToken: string,
  signal?: AbortSignal,
): Promise<ConsoleIdentity> {
  const client = createConsoleClient({ apiBaseUrl: base });
  return readIdentity(await client.loginConsoleWithGoogle(idToken, { signal }));
}

export async function refreshConsoleIdentity(
  base: string,
  idToken: string,
  signal?: AbortSignal,
): Promise<ConsoleIdentity> {
  const client = createConsoleClient({ apiBaseUrl: base, getAuthToken: () => idToken });
  return readIdentity(await client.getConsoleIdentity({ signal }));
}

interface GoogleIdentity {
  initialize(options: {
    client_id: string;
    nonce: string;
    auto_select: boolean;
    callback: (response: { credential: string }) => void;
  }): void;
  renderButton(
    element: HTMLElement,
    options: { theme: string; size: string; text: string; width: number },
  ): void;
  disableAutoSelect(): void;
}

let loading: Promise<GoogleIdentity> | undefined;
export function loadGoogleIdentity(): Promise<GoogleIdentity> {
  const get = () =>
    (window as unknown as { google?: { accounts?: { id?: GoogleIdentity } } }).google?.accounts?.id;
  const existing = get();
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
      const sdk = get();
      if (!sdk) return fail();
      window.clearTimeout(timer);
      resolve(sdk);
    };
    document.head.appendChild(script);
  });
  return loading;
}

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
