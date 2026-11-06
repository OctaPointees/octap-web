import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import {
  prepareZkLogin,
  assertLoginNonce,
  completeZkLogin,
  signCustomerClaim,
} from '../src/services/zklogin.ts';

import { Transaction } from '@mysten/sui/transactions';
import { toBase64 } from '@mysten/sui/utils';
import { parseZkLoginSignature, toZkLoginPublicIdentifier } from '@mysten/sui/zklogin';
import { verifyTransactionSignature } from '@mysten/sui/verify';

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
const jwt = (claims) =>
  `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;

test('prepare sends only a Sui-flagged ephemeral public key and retains nonce metadata', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/identity/nonce');
    const body = JSON.parse(options.body);
    assert.deepEqual(Object.keys(body), ['ephemeralPublicKey']);
    assert.equal(Buffer.from(body.ephemeralPublicKey, 'base64').length, 33);
    return Response.json({
      nonce: 'enoki-nonce',
      randomness: 'r',
      maxEpoch: 9,
      estimatedExpiration: Date.now() + 60_000,
    });
  };
  const session = await prepareZkLogin();
  assert.equal(session.nonce, 'enoki-nonce');
  assert.ok(session.keypair.getPublicKey());
});

test('prepare reports nonce service failures and rejects invalid responses', async () => {
  globalThis.fetch = async () => Response.json({ message: 'Enoki unavailable' }, { status: 502 });
  await assert.rejects(prepareZkLogin(), /Enoki unavailable/);
  globalThis.fetch = async () => Response.json({ nonce: '' });
  await assert.rejects(prepareZkLogin(), /invalid nonce/);
});

test('Google credential must carry the nonce given to Google initialize', () => {
  const expiration = Date.now() + 60_000;
  assert.doesNotThrow(() => assertLoginNonce(jwt({ nonce: 'n' }), 'n', expiration));
  assert.throws(() => assertLoginNonce(jwt({}), 'n', expiration), /did not match/);
  assert.throws(() => assertLoginNonce(jwt({ nonce: 'wrong' }), 'n', expiration), /did not match/);
  assert.throws(() => assertLoginNonce('invalid', 'n', expiration), /invalid ID token/);
});

test('an expired login attempt requires a fresh nonce and Google sign-in', () => {
  assert.throws(() => assertLoginNonce(jwt({ nonce: 'n' }), 'n', Date.now() - 1), /expired/);
});

const issuer = 'https://accounts.google.com';
const proof = {
  addressSeed: '1',
  issBase64Details: {
    value: Buffer.from(`"iss":"${issuer}",`).toString('base64url'),
    indexMod4: 0,
  },
  headerBase64: 'header',
  proofPoints: {
    a: ['1', '2', '1'],
    b: [
      ['1', '2'],
      ['3', '4'],
      ['1', '0'],
    ],
    c: ['1', '2', '1'],
  },
};
const address = toZkLoginPublicIdentifier(1n, issuer, { legacyAddress: false }).toSuiAddress();
async function prepare() {
  globalThis.fetch = async () =>
    Response.json({
      nonce: 'n',
      randomness: 'r',
      maxEpoch: 9,
      estimatedExpiration: Date.now() + 60_000,
    });
  return prepareZkLogin();
}
async function transactionFor(sender) {
  const tx = new Transaction();
  tx.setSender(sender);
  tx.setGasPrice(1000);
  tx.setGasBudget(10_000_000);
  tx.setGasPayment([
    { objectId: `0x${'9'.repeat(64)}`, version: '1', digest: '11111111111111111111111111111111' },
  ]);
  tx.setExpiration({ Epoch: 9 });
  tx.moveCall({ target: '0x2::clock::timestamp_ms', arguments: [] });
  return { bytes: toBase64(await tx.build()), digest: await tx.getDigest() };
}

test('proof uses the same ephemeral key and login nonce, and only public session parameters leave the browser', async () => {
  const attempt = await prepare();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/identity/proof');
    const body = JSON.parse(options.body);
    assert.deepEqual(body, {
      idToken: jwt({ nonce: 'n' }),
      ephemeralPublicKey: attempt.keypair.getPublicKey().toSuiPublicKey(),
      randomness: 'r',
      maxEpoch: 9,
    });
    assert.equal(body.privateKey, undefined);
    return Response.json(proof);
  };
  const completed = await completeZkLogin(attempt, jwt({ nonce: 'n' }), address);
  assert.equal(completed.keypair, attempt.keypair);
  assert.equal(completed.suiAddress, address);
});

test('full zkLogin signature wraps a real ephemeral signature over the exact sponsored bytes', async () => {
  const attempt = await prepare();
  globalThis.fetch = async () => Response.json(proof);
  const session = await completeZkLogin(attempt, jwt({ nonce: 'n' }), address);
  const transaction = await transactionFor(address);
  const signed = await signCustomerClaim(session, transaction.bytes, transaction.digest);
  const serialized = Buffer.from(signed, 'base64');
  assert.equal(serialized[0], 5); // zkLogin scheme flag; the installed parser takes the BCS body.
  const parsed = parseZkLoginSignature(serialized.subarray(1));
  assert.equal(parsed.maxEpoch, '9');
  assert.equal(parsed.inputs.addressSeed, '1');
  const verifiedKey = await verifyTransactionSignature(
    Buffer.from(transaction.bytes, 'base64'),
    toBase64(parsed.userSignature),
  );
  assert.equal(verifiedKey.toSuiPublicKey(), attempt.keypair.getPublicKey().toSuiPublicKey());
  await assert.rejects(
    signCustomerClaim(session, transaction.bytes, 'changed-digest'),
    /digest does not match/,
  );
  const other = await transactionFor(`0x${'2'.repeat(64)}`);
  await assert.rejects(signCustomerClaim(session, other.bytes, other.digest), /different account/);
  await assert.rejects(
    signCustomerClaim({ ...session, expiresAt: 0 }, transaction.bytes, transaction.digest),
    /expired/,
  );
});

test('proof rejection, identity mismatch and expired or mismatched login attempts never produce a signer', async () => {
  const attempt = await prepare();
  globalThis.fetch = () => assert.fail('nonce must be checked first');
  await assert.rejects(completeZkLogin(attempt, jwt({ nonce: 'wrong' }), address), /did not match/);
  await assert.rejects(
    completeZkLogin({ ...attempt, estimatedExpiration: 0 }, jwt({ nonce: 'n' }), address),
    /expired/,
  );
  globalThis.fetch = async () => Response.json({ message: 'Proof unavailable' }, { status: 502 });
  await assert.rejects(completeZkLogin(attempt, jwt({ nonce: 'n' }), address), /Proof unavailable/);
  globalThis.fetch = async () => Response.json(proof);
  await assert.rejects(
    completeZkLogin(attempt, jwt({ nonce: 'n' }), `0x${'3'.repeat(64)}`),
    /does not match/,
  );
});
