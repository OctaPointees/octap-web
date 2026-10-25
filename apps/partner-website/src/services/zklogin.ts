import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

export interface ZkLoginNonce {
  nonce: string;
  randomness: string;
  maxEpoch: number;
  estimatedExpiration: number;
}

/** Only the ephemeral public key leaves the browser. This page does not yet sign transactions. */
export async function prepareZkLogin() {
  const keypair = new Ed25519Keypair();
  const response = await fetch('/api/identity/nonce', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ephemeralPublicKey: keypair.getPublicKey().toSuiPublicKey() }),
    signal: AbortSignal.timeout(35_000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message ?? 'Could not prepare secure Google sign-in.');
  if (
    typeof result.nonce !== 'string' ||
    !result.nonce ||
    !Number.isFinite(result.estimatedExpiration)
  ) {
    throw new Error('The sign-in service returned an invalid nonce. Please try again.');
  }
  return { keypair, ...(result as ZkLoginNonce) };
}

/** A client-side flow check, not signature validation; Core/Enoki still validates the Google JWT. */
export function assertLoginNonce(credential: string, expectedNonce: string, expiration: number) {
  if (Date.now() >= expiration)
    throw new Error('This sign-in attempt expired. Refresh the page and try again.');
  let nonce: unknown;
  try {
    const payload = credential.split('.')[1];
    nonce = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))).nonce;
  } catch {
    throw new Error('Google returned an invalid ID token. Please sign in again.');
  }
  if (nonce !== expectedNonce)
    throw new Error('Google sign-in did not match this attempt. Refresh and try again.');
}
