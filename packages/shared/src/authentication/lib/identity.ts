import {
  createConsoleClient,
  type ConsoleIdentity,
  type ConsoleClient,
} from '../../console-api/client';

/** Rejects anything Core should never send, so the app never runs on a malformed identity. */
export function readIdentity(body: ConsoleIdentity): ConsoleIdentity {
  if (
    !body?.user?.id ||
    !['SYSTEM_USER', 'SYSTEM_ADMIN'].includes(body.user.systemRole) ||
    !Array.isArray(body.organizations) ||
    !Number.isFinite(Date.parse(body.expiresAt)) ||
    body.organizations.some(
      (org) =>
        !org.organizationId || !['BUSINESS_OWNER', 'BUSINESS_DEVELOPER'].includes(org.persona),
    )
  ) {
    throw new Error('Core returned an invalid portal identity.');
  }
  return body;
}

/** Exchanges a Google ID token for the OctaP identity. Core verifies the token's signature. */
export async function verifyGoogleCredential(
  apiBaseUrl: string,
  idToken: string,
  signal?: AbortSignal,
): Promise<ConsoleIdentity> {
  const client = createConsoleClient({ apiBaseUrl });
  return readIdentity(await client.loginConsoleWithGoogle(idToken, { signal }));
}

/** Reads the current identity again, for example after an action changed its access. */
export async function fetchIdentity(
  client: ConsoleClient,
  signal?: AbortSignal,
): Promise<ConsoleIdentity> {
  return readIdentity(
    await client.getConsoleIdentity({ signal: signal ?? AbortSignal.timeout(30_000) }),
  );
}
