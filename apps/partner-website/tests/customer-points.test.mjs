import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import {
  CUSTOMER_COOKIE,
  encodeCustomerSession,
  decodeCustomerSession,
} from '../src/lib/customer-demo-session.ts';
import { transactionPointsLabel } from '../src/lib/transaction-points.ts';

const require = createRequire(import.meta.url);
const nextUrl = pathToFileURL(require.resolve('next/server.js')).href;
const { NextRequest } = await import(nextUrl);
let source = await readFile(
  new URL('../src/app/api/customer/balance/route.ts', import.meta.url),
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
const { POST, DELETE } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
);
let rewardsSource = await readFile(
  new URL('../src/app/api/customer/rewards/route.ts', import.meta.url),
  'utf8',
);
rewardsSource = rewardsSource.replace("'next/server'", JSON.stringify(nextUrl));
for (const name of ['tenant', 'customer-demo-session']) {
  rewardsSource = rewardsSource.replace(
    `'../../../../lib/${name}'`,
    JSON.stringify(new URL(`../src/lib/${name}.ts`, import.meta.url).href),
  );
}
const rewardsOutput = ts.transpileModule(rewardsSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { POST: rewardsPost } = await import(
  `data:text/javascript;base64,${Buffer.from(rewardsOutput).toString('base64')}`
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
  memberId: 'verified-member',
  expiresAt: Date.now() + 60_000,
});
function configure() {
  process.env.NODE_ENV = 'development';
  process.env.ENABLE_MERCHANT_DEMO = 'true';
  process.env.CUSTOMER_DEMO_SESSION_SECRET = 'test-secret-at-least-32-characters-long';
  process.env.MERCHANT_DEMO_API_KEY = 'server-only';
  process.env.DEV_TENANT_SLUG = 'octap-demo';
  delete process.env.PARTNER_TENANTS_JSON;
}
function request(cookie, origin = 'http://localhost:4001') {
  return new NextRequest('http://localhost:4001/api/customer/balance', {
    method: 'POST',
    headers: {
      Host: 'localhost:4001',
      Origin: origin,
      Cookie: `${CUSTOMER_COOKIE}=${cookie ?? ''}`,
    },
    body: JSON.stringify({ memberId: 'someone-else' }),
  });
}

test('signed customer cookies reject tampering, expiry, and another tenant', () => {
  configure();
  const encoded = encodeCustomerSession(session());
  assert.equal(decodeCustomerSession(encoded, org).memberId, 'verified-member');
  assert.equal(decodeCustomerSession(encoded + 'x', org), null);
  assert.equal(decodeCustomerSession(encoded, 'another-org'), null);
  assert.equal(
    decodeCustomerSession(encodeCustomerSession({ ...session(), expiresAt: 0 }), org),
    null,
  );
});

test('customer balance never accepts a member ID without a valid login cookie', async () => {
  configure();
  globalThis.fetch = () => assert.fail('must not fetch');
  assert.equal((await POST(request())).status, 401);
  assert.equal((await POST(request('tampered'))).status, 401);
  assert.equal(
    (await POST(request(encodeCustomerSession(session()), 'https://evil.test'))).status,
    403,
  );
});

test('balance and history use only the authenticated member and redact the Core response', async () => {
  configure();
  globalThis.fetch = async (url, options) => {
    assert.ok(url.includes('/members/verified-member/'));
    assert.equal(options.headers.Authorization, 'Bearer server-only');
    return Response.json(
      url.endsWith('/balance')
        ? { confirmedBalance: 100, pendingEarn: 0, pendingRedemption: 0, stale: false }
        : [
            {
              id: 'tx',
              transactionType: 'EARN',
              pointsAmount: 100,
              status: 'CONFIRMED',
              metadata: { private: true },
            },
          ],
    );
  };
  const response = await POST(request(encodeCustomerSession(session())));
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.confirmedBalance, 100);
  assert.equal(data.transactions[0].points, 100);
  assert.equal(data.transactions[0].metadata, undefined);
});

test('pending earn history never presents a purchase as confirmed points', async () => {
  configure();
  globalThis.fetch = async (url) => Response.json(url.endsWith('/balance')
    ? { confirmedBalance: 0, pendingEarn: 1000 }
    : [
        { id: 'pending', transactionType: 'EARN', pointsAmount: null, purchaseAmount: 100000, estimatedPoints: 1000, status: 'PENDING' },
        { id: 'redeem', transactionType: 'REDEEM', pointsAmount: 40, status: 'PENDING' },
      ]);
  const data = await (await POST(request(encodeCustomerSession(session())))).json();
  assert.equal(data.transactions[0].points, null);
  assert.equal(data.transactions[0].estimatedPoints, 1000);
  assert.equal(data.transactions[1].points, 40, 'a pending redemption keeps its real points');
});

test('history labels actual points, a pending estimate and a failed earn', () => {
  assert.equal(transactionPointsLabel({ points: 40, estimatedPoints: null }), '40');
  assert.equal(transactionPointsLabel({ points: null, estimatedPoints: 1000 }), 'about 1000 (estimate)');
  assert.equal(transactionPointsLabel({ points: null, estimatedPoints: null }), '—');
});

test('logout expires the host-only cookie and production disables the demo', async () => {
  configure();
  const response = await DELETE(request(encodeCustomerSession(session())));
  assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
  assert.match(response.headers.get('set-cookie'), /HttpOnly/);
  process.env.NODE_ENV = 'production';
  assert.equal((await POST(request())).status, 404);
});

test('rewards require a signed customer identity and reject cross-origin claims', async () => {
  configure();
  globalThis.fetch = () => assert.fail('must not fetch');
  assert.equal((await rewardsPost(request())).status, 401);
  assert.equal(
    (await rewardsPost(request(encodeCustomerSession(session()), 'https://evil.test'))).status,
    403,
  );
});

test('a claimed voucher retry returns its existing serial without another debit', async () => {
  configure();
  const voucherId = '22222222-2222-4222-8222-222222222222';
  const req = new NextRequest('http://localhost:4001/api/customer/rewards', {
    method: 'POST',
    headers: {
      Host: 'localhost:4001',
      Origin: 'http://localhost:4001',
      Cookie: `${CUSTOMER_COOKIE}=${encodeCustomerSession(session())}`,
    },
    body: JSON.stringify({ action: 'claim', voucherId, organizationEndUserId: 'other-member' }),
  });
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls++;
    assert.ok(url.endsWith('/members/verified-member/vouchers'));
    return Response.json([{ voucherId, serialCode: 'EXISTING', status: 'AVAILABLE' }]);
  };
  const response = await rewardsPost(req);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).serialCode, 'EXISTING');
  assert.equal(calls, 1);
});

test('new claims use the authenticated member and a stable member/voucher key', async () => {
  configure();
  const voucherId = '22222222-2222-4222-8222-222222222222';
  const req = new NextRequest('http://localhost:4001/api/customer/rewards', {
    method: 'POST',
    headers: {
      Host: 'localhost:4001',
      Origin: 'http://localhost:4001',
      Cookie: `${CUSTOMER_COOKIE}=${encodeCustomerSession(session())}`,
    },
    body: JSON.stringify({ action: 'claim', voucherId, organizationEndUserId: 'other-member' }),
  });
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/members/verified-member/vouchers')) return Response.json([]);
    assert.ok(url.endsWith(`/vouchers/${voucherId}/claim`));
    const payload = JSON.parse(options.body);
    assert.equal(payload.organizationEndUserId, 'verified-member');
    assert.equal(payload.idempotencyKey, `web-demo-claim-${voucherId}-verified-member`);
    return Response.json(
      {
        voucherId,
        organizationEndUserId: 'verified-member',
        serialCode: 'NEW',
        status: 'AVAILABLE',
      },
      { status: 201 },
    );
  };
  assert.equal((await rewardsPost(req)).status, 200);
});

const voucher = '22222222-2222-4222-8222-222222222222';
const owner = '33333333-3333-4333-8333-333333333333';
function rewardRequest(body) {
  return new NextRequest('http://localhost:4001/api/customer/rewards', {
    method: 'POST',
    headers: {
      Host: 'localhost:4001',
      Origin: 'http://localhost:4001',
      Cookie: `${CUSTOMER_COOKIE}=${encodeCustomerSession(session())}`,
    },
    body: JSON.stringify(body),
  });
}
const reserved = {
  voucherOwnershipId: owner,
  voucherId: voucher,
  organizationEndUserId: 'verified-member',
  status: 'RESERVED',
  pointsDeducted: 0,
  pointsCost: 25,
  digest: 'digest',
  transactionBytes: 'bytes',
  serialCode: 'SERIAL',
};

test('an existing RESERVED claim resumes the stable Core operation and returns bytes rather than issuing a coupon', async () => {
  configure();
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/members/verified-member/vouchers'))
      return Response.json([{ id: owner, voucherId: voucher, status: 'RESERVED' }]);
    assert.ok(url.endsWith(`/vouchers/${voucher}/claim`));
    assert.equal(
      JSON.parse(options.body).idempotencyKey,
      `web-demo-claim-${voucher}-verified-member`,
    );
    return Response.json(reserved);
  };
  const result = await rewardsPost(rewardRequest({ action: 'claim', voucherId: voucher }));
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), reserved);
});

test('finalize verifies member ownership and the cached digest, and sends no merchant key with the customer signature', async () => {
  configure();
  let executed = 0;
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/members/verified-member/vouchers'))
      return Response.json([{ id: owner, voucherId: voucher, status: 'RESERVED' }]);
    if (url.endsWith('/claim')) return Response.json(reserved);
    if (url.endsWith('/finalize')) {
      executed++;
      assert.equal(options.headers.Authorization, undefined);
      assert.deepEqual(JSON.parse(options.body), {
        digest: 'digest',
        signature: 'customer-zklogin-signature',
      });
      return Response.json({ status: 'CONFIRMED' });
    }
    assert.ok(url.endsWith(`/claims/${owner}`));
    return Response.json({ ...reserved, status: 'AVAILABLE', pointsDeducted: 25 });
  };
  assert.equal(
    (
      await rewardsPost(
        rewardRequest({
          action: 'finalize',
          ownershipId: owner,
          digest: 'wrong',
          signature: 'sig',
        }),
      )
    ).status,
    409,
  );
  assert.equal(executed, 0);
  assert.equal(
    (
      await rewardsPost(
        rewardRequest({
          action: 'finalize',
          ownershipId: '44444444-4444-4444-8444-444444444444',
          digest: 'digest',
          signature: 'sig',
        }),
      )
    ).status,
    404,
  );
  const response = await rewardsPost(
    rewardRequest({
      action: 'finalize',
      ownershipId: owner,
      digest: 'digest',
      signature: 'customer-zklogin-signature',
    }),
  );
  assert.equal((await response.json()).status, 'AVAILABLE');
  assert.equal(executed, 1);
});

test('only definitively cancelled claims receive a new server-generated retry key', async () => {
  configure();
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/vouchers'))
      return Response.json([{ id: owner, voucherId: voucher, status: 'CANCELLED' }]);
    assert.equal(JSON.parse(options.body).idempotencyKey, `web-retry-${owner}`);
    return Response.json(reserved);
  };
  assert.equal(
    (await rewardsPost(rewardRequest({ action: 'claim', voucherId: voucher }))).status,
    200,
  );
});

let identitySource = await readFile(
  new URL('../src/app/api/identity/[action]/route.ts', import.meta.url),
  'utf8',
);
identitySource = identitySource.replace("'next/server'", JSON.stringify(nextUrl));
for (const name of ['tenant', 'customer-demo-session']) {
  identitySource = identitySource.replace(
    `'../../../../lib/${name}'`,
    JSON.stringify(new URL(`../src/lib/${name}.ts`, import.meta.url).href),
  );
}
const identityOutput = ts.transpileModule(identitySource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { POST: identityPost } = await import(
  `data:text/javascript;base64,${Buffer.from(identityOutput).toString('base64')}`
);
function proofRequest(
  body,
  cookie = encodeCustomerSession(session()),
  origin = 'http://localhost:4001',
) {
  return new NextRequest('http://localhost:4001/api/identity/proof', {
    method: 'POST',
    headers: {
      Host: 'localhost:4001',
      Origin: origin,
      Cookie: `${CUSTOMER_COOKIE}=${cookie}`,
    },
    body: JSON.stringify(body),
  });
}
const proofBody = {
  idToken: 'google-jwt',
  ephemeralPublicKey: 'public-only',
  randomness: 'randomness',
  maxEpoch: 10,
};
const proofContext = { params: Promise.resolve({ action: 'proof' }) };

test('proof proxy requires the same signed customer identity and never forwards a merchant key', async () => {
  configure();
  const paths = [];
  globalThis.fetch = async (url, options) => {
    paths.push(url);
    assert.equal(options.headers.Authorization, undefined);
    if (url.endsWith('/google-login')) {
      assert.deepEqual(JSON.parse(options.body), { idToken: 'google-jwt' });
      return Response.json({ endUserId: 'customer', suiAddress: '0x123' });
    }
    assert.ok(url.endsWith('/zklogin/proof'));
    assert.deepEqual(JSON.parse(options.body), proofBody);
    return Response.json({ addressSeed: '123', proofPoints: {} });
  };
  const response = await identityPost(proofRequest(proofBody), proofContext);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await response.json()).addressSeed, '123');
  assert.equal(paths.length, 2);
});

test('missing login, cross-origin, malformed session, and a different Google identity cannot obtain a proof', async () => {
  configure();
  globalThis.fetch = () => assert.fail('must not call Core');
  assert.equal((await identityPost(proofRequest(proofBody, ''), proofContext)).status, 401);
  assert.equal(
    (
      await identityPost(
        proofRequest(proofBody, encodeCustomerSession(session()), 'https://evil.test'),
        proofContext,
      )
    ).status,
    403,
  );
  assert.equal(
    (await identityPost(proofRequest({ ...proofBody, maxEpoch: -1 }), proofContext)).status,
    400,
  );
  globalThis.fetch = async (url) => {
    assert.ok(url.endsWith('/google-login'));
    return Response.json({ endUserId: 'someone-else', suiAddress: '0xother' });
  };
  assert.equal((await identityPost(proofRequest(proofBody), proofContext)).status, 401);
});
