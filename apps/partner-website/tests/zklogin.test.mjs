import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { prepareZkLogin, assertLoginNonce } from '../src/services/zklogin.ts';

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
