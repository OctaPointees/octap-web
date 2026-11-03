import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import {
  CUSTOMER_COOKIE,
  decodeCustomerSession,
  encodeCustomerSession,
} from '../src/lib/customer-demo-session.ts';

const require = createRequire(import.meta.url);
const nextUrl = pathToFileURL(require.resolve('next/server.js')).href;
const { NextRequest } = await import(nextUrl);
let source = await readFile(
  new URL('../src/app/api/identity/[action]/route.ts', import.meta.url),
  'utf8',
);
source = source.replace("'next/server'", JSON.stringify(nextUrl));
for (const name of ['tenant', 'customer-demo-session']) {
  source = source.replace(
    `'../../../../lib/${name}'`,
    JSON.stringify(new URL(`../src/lib/${name}.ts`, import.meta.url).href),
  );
}
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { POST } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
);

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;
afterEach(() => {
  process.env = { ...originalEnv };
  globalThis.fetch = originalFetch;
});

const org = '11111111-1111-4111-8111-111111111111';
const session = () => ({
  organizationId: org,
  endUserId: 'customer',
  suiAddress: '0x123',
  expiresAt: Date.now() + 60_000,
});

function configure({ demo = true } = {}) {
  process.env.NODE_ENV = 'development';
  process.env.DEV_TENANT_SLUG = 'octap-demo';
  delete process.env.PARTNER_TENANTS_JSON;
  if (demo) {
    process.env.ENABLE_MERCHANT_DEMO = 'true';
    process.env.CUSTOMER_DEMO_SESSION_SECRET = 'test-secret-at-least-32-characters-long';
  } else {
    delete process.env.ENABLE_MERCHANT_DEMO;
  }
}

function stubCore(respond) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), body: JSON.parse(init.body) });
    return respond(String(url));
  };
  return calls;
}

function post(action, body, cookie) {
  const request = new NextRequest(`http://localhost:4001/api/identity/${action}`, {
    method: 'POST',
    headers: {
      Host: 'localhost:4001',
      Origin: 'http://localhost:4001',
      ...(cookie ? { Cookie: `${CUSTOMER_COOKIE}=${cookie}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return POST(request, { params: Promise.resolve({ action }) });
}

const enrolled = (endUserId = 'customer') =>
  Response.json({ organizationEndUserId: 'member-1', endUserId, isNewEnrollment: true });

test('enroll forwards the ID token, not a customer ID, and records the member', async () => {
  configure();
  const calls = stubCore(() => enrolled());

  const response = await post(
    'enroll',
    { idToken: 'google-jwt', endUserId: 'someone-else' },
    encodeCustomerSession(session()),
  );

  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/v1\/identity\/organizations\/[^/]+\/enroll$/);
  assert.deepEqual(calls[0].body, { idToken: 'google-jwt' });
  const cookie = response.cookies.get(CUSTOMER_COOKIE)?.value;
  const organizationId = decodeURIComponent(calls[0].url.split('/organizations/')[1].split('/')[0]);
  assert.equal(decodeCustomerSession(cookie, organizationId)?.memberId, 'member-1');
});

test('enroll without an ID token never reaches Core', async () => {
  configure({ demo: false });
  const calls = stubCore(() => enrolled());

  const response = await post('enroll', { endUserId: 'customer' });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).message, 'Google ID token is required');
  assert.equal(calls.length, 0);
});

test('enroll in demo mode needs a signed-in session first', async () => {
  configure();
  const calls = stubCore(() => enrolled());

  const response = await post('enroll', { idToken: 'google-jwt' });

  assert.equal(response.status, 401);
  assert.equal(calls.length, 0);
});

test('a token for another customer does not attach its member to this session', async () => {
  configure();
  stubCore(() => enrolled('other-customer'));

  const response = await post(
    'enroll',
    { idToken: 'other-jwt' },
    encodeCustomerSession(session()),
  );

  assert.equal(response.status, 401);
  assert.equal(response.cookies.get(CUSTOMER_COOKIE), undefined);
});

test('an expired token from Core stays a 401 for the page to send the customer back', async () => {
  configure({ demo: false });
  stubCore(() => Response.json({ message: 'expired' }, { status: 401 }));

  const response = await post('enroll', { idToken: 'expired-jwt' });

  assert.equal(response.status, 401);
});
