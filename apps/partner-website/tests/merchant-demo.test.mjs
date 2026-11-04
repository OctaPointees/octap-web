import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = await readFile(
  new URL('../src/app/api/demo/credits/route.ts', import.meta.url),
  'utf8',
);
const { outputText } = ts.transpileModule(
  source.replace(
    "'next/server'",
    JSON.stringify(pathToFileURL(require.resolve('next/server.js')).href),
  ),
  {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  },
);
const { POST } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
);
const env = { ...process.env };
const originalFetch = globalThis.fetch;
afterEach(() => {
  process.env = { ...env };
  globalThis.fetch = originalFetch;
});
const member = 'c0cd3b3c-a8b7-4447-8001-4908245114c6';
function configure() {
  process.env.NODE_ENV = 'development';
  process.env.ENABLE_MERCHANT_DEMO = 'true';
  process.env.MERCHANT_DEMO_API_KEY = 'server-only-test-key';
  process.env.MERCHANT_DEMO_ORIGIN = 'http://localhost:4000';
}
function request(body, origin = 'http://localhost:4000') {
  return new Request('http://localhost:4001/api/demo/credits', {
    method: 'POST',
    headers: { Host: 'localhost:4001', Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('production and disabled demo never call Core', async () => {
  configure();
  globalThis.fetch = () => assert.fail('must not call Core');
  process.env.NODE_ENV = 'production';
  assert.equal((await POST(request({}))).status, 404);
  process.env.NODE_ENV = 'development';
  process.env.ENABLE_MERCHANT_DEMO = 'false';
  assert.equal((await POST(request({}))).status, 404);
});

test('untrusted origins and malformed commands are rejected', async () => {
  configure();
  globalThis.fetch = () => assert.fail('must not call Core');
  assert.equal((await POST(request({}, 'https://evil.test'))).status, 403);
  assert.equal((await POST(request({ organizationEndUserId: 'bad' }))).status, 400);
  assert.equal(
    (
      await POST(
        request({
          action: 'earn',
          organizationEndUserId: member,
          purchaseAmount: -1,
          idempotencyKey: 'test',
        }),
      )
    ).status,
    400,
  );
});

test('earn preserves the retry key and forwards the credential only to Core', async () => {
  configure();
  const command = {
    action: 'earn',
    organizationEndUserId: member,
    purchaseAmount: 100,
    idempotencyKey: 'same-retry-key',
  };
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    assert.ok(url.endsWith('/v1/credits/earn'));
    assert.equal(options.headers.Authorization, 'Bearer server-only-test-key');
    assert.equal(JSON.parse(options.body).idempotencyKey, command.idempotencyKey);
    assert.equal(JSON.parse(options.body).purchaseAmount, 100);
    assert.equal(JSON.parse(options.body).pointsAmount, undefined);
    calls++;
    return Response.json({ transactionId: 'tx', status: 'PENDING' }, { status: 201 });
  };
  for (let n = 0; n < 2; n++) {
    const response = await POST(request(command));
    assert.equal(response.status, 201);
    assert.equal((await response.json()).status, 'PENDING');
  }
  assert.equal(calls, 2);
});

test('read returns real balance and history and masks upstream server failures', async () => {
  configure();
  globalThis.fetch = async (url) =>
    Response.json(
      url.includes('/balance') ? { confirmedBalance: 12 } : [{ id: 'tx', status: 'CONFIRMED' }],
    );
  const response = await POST(request({ action: 'read', organizationEndUserId: member }));
  assert.equal((await response.json()).balance.confirmedBalance, 12);
  globalThis.fetch = async () =>
    Response.json({ message: 'sensitive internal details' }, { status: 500 });
  const failure = await POST(request({ action: 'read', organizationEndUserId: member }));
  assert.equal(failure.status, 500);
  assert.doesNotMatch(await failure.text(), /sensitive internal/);
});

test('voucher redemption cannot use a serial belonging to another member', async () => {
  configure();
  globalThis.fetch = async (url) => {
    assert.ok(url.endsWith(`/members/${member}/vouchers`));
    return Response.json([{ serialCode: 'OWN-SERIAL' }]);
  };
  const response = await POST(
    request({ action: 'redeemVoucher', organizationEndUserId: member, serialCode: 'OTHER-SERIAL' }),
  );
  assert.equal(response.status, 404);
});

test('voucher redemption forwards the verified serial and preserves the actual Core status', async () => {
  configure();
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/vouchers')) return Response.json([{ serialCode: 'OWN-SERIAL' }]);
    assert.ok(url.endsWith('/vouchers/redeem'));
    assert.deepEqual(JSON.parse(options.body), { serialCode: 'OWN-SERIAL' });
    return Response.json(
      { status: 'REDEEMED', voucherTitle: 'Demo coffee reward' },
      { status: 201 },
    );
  };
  const response = await POST(
    request({ action: 'redeemVoucher', organizationEndUserId: member, serialCode: 'OWN-SERIAL' }),
  );
  assert.equal(response.status, 201);
  assert.equal((await response.json()).status, 'REDEEMED');
});
