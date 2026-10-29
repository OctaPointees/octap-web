import { NextResponse, type NextRequest } from 'next/server';
import { resolveTenant } from '../../../../lib/tenant';
import {
  CUSTOMER_COOKIE,
  customerDemoEnabled,
  decodeCustomerSession,
} from '../../../../lib/customer-demo-session';

export async function POST(request: NextRequest) {
  if (!customerDemoEnabled()) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  const tenant = resolveTenant(request.headers.get('host') ?? '');
  if (!tenant) return NextResponse.json({ message: 'Store not found' }, { status: 404 });
  const origin = request.headers.get('origin');
  if (!origin || !URL.canParse(origin) || new URL(origin).host !== request.headers.get('host'))
    return NextResponse.json({ message: 'Invalid request origin' }, { status: 403 });
  const session = decodeCustomerSession(
    request.cookies.get(CUSTOMER_COOKIE)?.value,
    tenant.organizationId,
  );
  if (!session?.memberId)
    return NextResponse.json({ message: 'Sign in again and join the store.' }, { status: 401 });
  const key = process.env.MERCHANT_DEMO_API_KEY;
  if (!key)
    return NextResponse.json({ message: 'Rewards demo is not configured.' }, { status: 503 });
  const body = await request.json().catch(() => null);
  const base = (process.env.CORE_API_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
  async function core(path: string, payload?: object) {
    return fetch(`${base}${path}`, {
      method: payload ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: payload ? JSON.stringify(payload) : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
  }
  try {
    const ownerships = await core(`/v1/rewards/members/${session.memberId}/vouchers`);
    if (!ownerships.ok)
      return NextResponse.json({ message: 'Could not load your vouchers.' }, { status: 502 });
    const owned = await ownerships.json();
    if (body?.action === 'read') {
      const vouchers = await core('/v1/rewards/vouchers');
      if (!vouchers.ok)
        return NextResponse.json({ message: 'Could not load store rewards.' }, { status: 502 });
      return NextResponse.json(
        { vouchers: await vouchers.json(), owned },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }
    const uuid = (value: unknown): value is string =>
      typeof value === 'string' && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
    type Owned = { id: string; voucherId: string; status: string; serialCode: string };
    const ownershipsForMember = owned as Owned[];
    const respond = (data: unknown, status = 200) =>
      NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
    async function reserve(voucherId: string) {
      // Continue the same attempt until Core definitively cancels it. Only then allocate a new key.
      const cancelled = ownershipsForMember.find(
        (item) => item.voucherId === voucherId && item.status === 'CANCELLED',
      );
      return core(`/v1/rewards/vouchers/${voucherId}/claim`, {
        organizationEndUserId: session!.memberId,
        idempotencyKey: cancelled
          ? `web-retry-${cancelled.id}`
          : `web-demo-claim-${voucherId}-${session!.memberId}`,
      });
    }
    if (body?.action === 'status' || body?.action === 'finalize') {
      if (!uuid(body.ownershipId))
        return respond({ message: 'Select a valid voucher claim.' }, 400);
      const claim = ownershipsForMember.find((item) => item.id === body.ownershipId);
      if (!claim) return respond({ message: 'Voucher claim not found.' }, 404);
      if (body.action === 'finalize' && claim.status === 'RESERVED') {
        if (
          typeof body.digest !== 'string' ||
          !body.digest ||
          body.digest.length > 128 ||
          typeof body.signature !== 'string' ||
          !body.signature ||
          body.signature.length > 32_768
        )
          return respond(
            { message: 'A transaction digest and customer signature are required.' },
            400,
          );
        const reservation = await reserve(claim.voucherId);
        const prepared = await reservation.json();
        if (!reservation.ok)
          return respond(
            {
              message:
                'This claim may already be processing. Refresh its status before continuing.',
            },
            reservation.status,
          );
        if (
          prepared.voucherOwnershipId !== claim.id ||
          prepared.organizationEndUserId !== session.memberId
        )
          return respond({ message: 'The claim does not belong to your membership.' }, 409);
        if (prepared.status === 'RESERVED') {
          if (prepared.digest !== body.digest)
            return respond(
              { message: 'The signing request expired or changed. Continue the claim again.' },
              409,
            );
          // Public Core finalize verifies the customer's signature. Never pass a merchant key here.
          const finalized = await fetch(`${base}/v1/credits/redeem/finalize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ digest: body.digest, signature: body.signature }),
            cache: 'no-store',
            signal: AbortSignal.timeout(45_000),
          });
          if (!finalized.ok)
            return respond(
              {
                message:
                  'Confirmation was not completed. Refresh to check its status; points remain reserved until the outcome is known.',
              },
              finalized.status,
            );
        }
      }
      const result = await core(`/v1/rewards/claims/${claim.id}`);
      if (!result.ok)
        return respond(
          { message: 'Could not read the claim. Refresh before continuing.' },
          result.status,
        );
      return respond(await result.json());
    }
    if (body?.action !== 'claim' || !uuid(body.voucherId))
      return respond({ message: 'Select a valid voucher.' }, 400);
    const existing = ownershipsForMember.find(
      (item) => item.voucherId === body.voucherId && item.status !== 'CANCELLED',
    );
    // RESERVED is not issued: ask Core for the original operation's signable bytes again.
    if (existing && existing.status !== 'RESERVED')
      return respond({
        ...existing,
        voucherOwnershipId: existing.id,
        organizationEndUserId: session.memberId,
      });
    const result = await reserve(body.voucherId);
    const data = await result.json();
    if (!result.ok)
      return respond(
        {
          message:
            result.status >= 500
              ? 'Could not prepare the claim. Refresh your vouchers before trying again.'
              : typeof data.message === 'string'
                ? data.message
                : 'Voucher claim rejected.',
        },
        result.status,
      );
    if (data.organizationEndUserId !== session.memberId || data.voucherId !== body.voucherId)
      return respond(
        { message: 'Core returned a claim for a different membership or reward.' },
        502,
      );
    // Transaction bytes are public signing material. Merchant credentials and private keys stay out.
    return respond({
      voucherOwnershipId: data.voucherOwnershipId,
      voucherId: data.voucherId,
      organizationEndUserId: data.organizationEndUserId,
      serialCode: data.serialCode,
      status: data.status,
      pointsCost: data.pointsCost,
      pointsDeducted: data.pointsDeducted,
      digest: data.digest,
      transactionBytes: data.transactionBytes,
    });
  } catch {
    return NextResponse.json(
      { message: 'Rewards service unavailable. Refresh before trying again.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
