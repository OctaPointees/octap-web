import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64, normalizeSuiAddress } from '@mysten/sui/utils';
import { getZkLoginSignature, ZkLoginPublicIdentifier } from '@mysten/sui/zklogin';

export interface ZkLoginNonce {
  nonce: string;
  randomness: string;
  maxEpoch: number;
  estimatedExpiration: number;
}

/** Private key stays in browser memory; only its public half is sent to Core. */
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
    typeof result.randomness !== 'string' ||
    !result.randomness ||
    !Number.isSafeInteger(result.maxEpoch) ||
    result.maxEpoch < 0 ||
    !Number.isFinite(result.estimatedExpiration) ||
    result.estimatedExpiration <= Date.now()
  ) {
    throw new Error('The sign-in service returned an invalid nonce. Please try again.');
  }
  return {
    keypair,
    nonce: result.nonce as string,
    randomness: result.randomness as string,
    maxEpoch: result.maxEpoch as number,
    estimatedExpiration: result.estimatedExpiration as number,
  };
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

export type PreparedZkLogin = Awaited<ReturnType<typeof prepareZkLogin>>;
export type ZkLoginProof = Parameters<typeof getZkLoginSignature>[0]['inputs'];
export interface CustomerSigningSession {
  keypair: Ed25519Keypair;
  proof: ZkLoginProof;
  maxEpoch: number;
  expiresAt: number;
  suiAddress: string;
}

/** Complete the original login attempt; never regenerate the key after Google issues its JWT. */
export async function completeZkLogin(
  session: PreparedZkLogin,
  idToken: string,
  suiAddress: string,
): Promise<CustomerSigningSession> {
  assertLoginNonce(idToken, session.nonce, session.estimatedExpiration);
  const response = await fetch('/api/identity/proof', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idToken,
      ephemeralPublicKey: session.keypair.getPublicKey().toSuiPublicKey(),
      randomness: session.randomness,
      maxEpoch: session.maxEpoch,
    }),
    signal: AbortSignal.timeout(65_000),
  });
  const proof = await response.json();
  if (!response.ok)
    throw new Error(proof.message ?? 'Could not prepare transaction signing. Sign in again.');
  try {
    // Accepts Sui's legacy/current zkLogin derivations, but only for this enrolled address.
    ZkLoginPublicIdentifier.fromProof(suiAddress, proof);
    if (
      !Array.isArray(proof.proofPoints?.a) ||
      !Array.isArray(proof.proofPoints?.b) ||
      !Array.isArray(proof.proofPoints?.c) ||
      typeof proof.headerBase64 !== 'string'
    )
      throw new Error('Invalid proof');
  } catch {
    throw new Error('The signing proof does not match your connected account. Sign in again.');
  }
  if (Date.now() >= session.estimatedExpiration)
    throw new Error('Signing session expired. Sign in again.');
  return {
    keypair: session.keypair,
    proof,
    maxEpoch: session.maxEpoch,
    expiresAt: session.estimatedExpiration,
    suiAddress,
  };
}

/** Sign full sponsor-provided bytes, then wrap the ephemeral signature in its Enoki zkLogin proof. */
export async function signCustomerClaim(
  session: CustomerSigningSession,
  transactionBytes: string,
  digest: string,
): Promise<string> {
  if (Date.now() >= session.expiresAt)
    throw new Error('Your signing session expired. Sign in again to continue the claim.');
  const bytes = fromBase64(transactionBytes);
  const transaction = Transaction.from(bytes);
  const sender = transaction.getData().sender;
  if (!sender || normalizeSuiAddress(sender) !== normalizeSuiAddress(session.suiAddress))
    throw new Error('This transaction belongs to a different account. Nothing was signed.');
  if ((await transaction.getDigest()) !== digest)
    throw new Error('The claim transaction digest does not match. Nothing was signed.');
  const { signature } = await session.keypair.signTransaction(bytes);
  return getZkLoginSignature({
    inputs: session.proof,
    maxEpoch: session.maxEpoch,
    userSignature: signature,
  });
}
