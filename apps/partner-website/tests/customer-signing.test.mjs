import assert from 'node:assert/strict';
import { test, afterEach } from 'node:test';
import { claimCustomerReward, redeemCustomerVoucher } from '../src/services/customer-rewards.ts';
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
const claim = {
  voucherOwnershipId: 'ownership',
  voucherId: 'voucher',
  organizationEndUserId: 'member',
  status: 'RESERVED',
  pointsCost: 25,
  pointsDeducted: 0,
  digest: 'digest',
  transactionBytes: 'bytes',
};

test('paid claim signs before finalize, then waits for persisted confirmation', async () => {
  const sequence = [];
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    sequence.push(body.action);
    if (body.action === 'claim') return Response.json(claim);
    assert.deepEqual(body, {
      action: 'finalize',
      ownershipId: 'ownership',
      digest: 'digest',
      signature: 'zklogin-signature',
    });
    return Response.json({ ...claim, status: 'AVAILABLE', pointsDeducted: 25 });
  };
  const result = await claimCustomerReward('voucher', 'member', 25, async (bytes, digest) => {
    sequence.push('sign');
    assert.equal(bytes, 'bytes');
    assert.equal(digest, 'digest');
    return 'zklogin-signature';
  });
  assert.equal(result.status, 'AVAILABLE');
  assert.deepEqual(sequence, ['claim', 'sign', 'finalize']);
});

test('a different user or incomplete pending response cannot trigger signing', async () => {
  for (const response of [
    { ...claim, organizationEndUserId: 'other' },
    { ...claim, transactionBytes: null },
  ]) {
    globalThis.fetch = async () => Response.json(response);
    await assert.rejects(
      claimCustomerReward('voucher', 'member', 25, () => assert.fail('must not sign')),
      /different membership|awaiting confirmation/,
    );
  }
});

test('expired signing sessions or uncertain execution never cause an automatic second claim', async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json(claim);
  };
  await assert.rejects(
    claimCustomerReward('voucher', 'member', 25, async () => {
      throw new Error('expired');
    }),
    /expired/,
  );
  assert.equal(calls, 1);
  calls = 0;
  globalThis.fetch = async (_url, options) => {
    calls++;
    return JSON.parse(options.body).action === 'claim'
      ? Response.json(claim)
      : Response.json({ message: 'Unknown chain outcome; refresh' }, { status: 502 });
  };
  await assert.rejects(
    claimCustomerReward('voucher', 'member', 25, async () => 'sig'),
    /Unknown chain outcome/,
  );
  assert.equal(calls, 2);
});

test('an already-issued free or confirmed voucher needs no new signature', async () => {
  globalThis.fetch = async () => Response.json({ ...claim, status: 'AVAILABLE' });
  assert.equal(
    (await claimCustomerReward('voucher', 'member', 25, () => assert.fail('must not sign'))).status,
    'AVAILABLE',
  );
});

test('a price change requires fresh confirmation before signing', async () => {
  globalThis.fetch = async () => Response.json({ ...claim, pointsCost: 50 });
  await assert.rejects(
    claimCustomerReward('voucher', 'member', 25, () => assert.fail('must not sign')),
    /cost changed/,
  );
});

test('a free claim waits for the chain and is never signed', async () => {
  globalThis.fetch = async () =>
    Response.json({ ...claim, pointsCost: 0, digest: null, transactionBytes: null });
  const result = await claimCustomerReward('voucher', 'member', 0, () =>
    assert.fail('must not sign'),
  );
  assert.equal(result.status, 'RESERVED');
});

test('a voucher use signs the store request, then finalizes; nothing to sign means nothing is signed', async () => {
  const sequence = [];
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    sequence.push(body.action);
    if (body.action === 'use')
      return Response.json({
        voucherOwnershipId: 'own',
        status: 'AVAILABLE',
        digest: 'd',
        transactionBytes: 'b',
      });
    assert.deepEqual(body, {
      action: 'finalizeUse',
      ownershipId: 'own',
      digest: 'd',
      signature: 'sig',
    });
    return Response.json({ voucherOwnershipId: 'own', status: 'REDEEMED' });
  };
  const used = await redeemCustomerVoucher('own', async (bytes, digest) => {
    assert.deepEqual([bytes, digest], ['b', 'd']);
    return 'sig';
  });
  assert.equal(used.status, 'REDEEMED');
  assert.deepEqual(sequence, ['use', 'finalizeUse']);

  globalThis.fetch = async () =>
    Response.json({
      voucherOwnershipId: 'own',
      status: 'REDEEMED',
      digest: null,
      transactionBytes: null,
    });
  assert.equal(
    (await redeemCustomerVoucher('own', () => assert.fail('must not sign'))).status,
    'REDEEMED',
  );
  globalThis.fetch = async () =>
    Response.json({ voucherOwnershipId: 'other', digest: 'd', transactionBytes: 'b' });
  await assert.rejects(
    redeemCustomerVoucher('own', () => assert.fail('must not sign')),
    /different voucher/,
  );
});
