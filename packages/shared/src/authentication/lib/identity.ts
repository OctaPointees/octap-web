import type { OctapClient } from '@octap/internal-sdk';
import { unwrap, type ConsoleIdentity } from './core';

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
  api: OctapClient,
  idToken: string,
): Promise<ConsoleIdentity> {
  return readIdentity(await unwrap(api.console.login({ idToken })));
}

/** Reads the current identity again, for example after an action changed its access. */
export async function fetchIdentity(api: OctapClient): Promise<ConsoleIdentity> {
  return readIdentity(await unwrap(api.console.me()));
}
