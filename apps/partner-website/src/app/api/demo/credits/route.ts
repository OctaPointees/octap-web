import { NextResponse, type NextRequest } from 'next/server';

/** Local cashier demo only. Production requires Core's real merchant session/role flow. */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development' || process.env.ENABLE_MERCHANT_DEMO !== 'true') {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }
  const host = request.headers.get('host') ?? '';
  if (
    !/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) ||
    request.headers.get('origin') !== (process.env.MERCHANT_DEMO_ORIGIN ?? 'http://localhost:4000')
  ) {
    return NextResponse.json({ message: 'Local merchant demo origin required' }, { status: 403 });
  }
  const key = process.env.MERCHANT_DEMO_API_KEY;
  if (!key)
    return NextResponse.json(
      { message: 'Configure the server-side merchant demo key first.' },
      { status: 503 },
    );
  const body = await request.json().catch(() => null);
  const memberId = body?.organizationEndUserId;
  if (
    typeof memberId !== 'string' ||
    !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(memberId)
  ) {
    return NextResponse.json({ message: 'A valid member ID is required.' }, { status: 400 });
  }
  const base = (process.env.CORE_API_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
  async function core(path: string, payload?: object) {
    const result = await fetch(`${base}${path}`, {
      method: payload ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: payload ? JSON.stringify(payload) : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    });
    const data = await result.json();
    if (!result.ok) {
      return {
        error: true,
        status: result.status,
        data: {
          message:
            result.status >= 500
              ? 'Core could not complete the request. Check the API and worker logs.'
              : typeof data.message === 'string'
                ? data.message
                : 'Core rejected this request.',
        },
      };
    }
    return { error: false, status: result.status, data };
  }
  try {
    if (body.action === 'redeemVoucher') {
      if (typeof body.serialCode !== 'string' || !/^[A-Za-z0-9-]{1,100}$/.test(body.serialCode))
        return NextResponse.json(
          { message: 'A valid voucher serial code is required.' },
          { status: 400 },
        );
      const owned = await core(`/v1/rewards/members/${memberId}/vouchers`);
      if (owned.error) return NextResponse.json(owned.data, { status: owned.status });
      if (!owned.data.some((item: { serialCode: string }) => item.serialCode === body.serialCode))
        return NextResponse.json(
          { message: 'Voucher not found for this member.' },
          { status: 404 },
        );
      const result = await core('/v1/rewards/vouchers/redeem', { serialCode: body.serialCode });
      return NextResponse.json(result.data, {
        status: result.status,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    if (body.action === 'earn') {
      if (
        !Number.isSafeInteger(body.pointsAmount) ||
        body.pointsAmount <= 0 ||
        body.pointsAmount > 1_000_000 ||
        typeof body.idempotencyKey !== 'string' ||
        !/^[a-zA-Z0-9-]{1,100}$/.test(body.idempotencyKey) ||
        (body.receiptReference !== undefined &&
          (typeof body.receiptReference !== 'string' || body.receiptReference.length > 100))
      ) {
        return NextResponse.json(
          { message: 'Enter a whole amount from 1 to 1,000,000 and a valid request reference.' },
          { status: 400 },
        );
      }
      const result = await core('/v1/credits/earn', {
        organizationEndUserId: memberId,
        pointsAmount: body.pointsAmount,
        idempotencyKey: body.idempotencyKey,
        receiptReference: body.receiptReference,
      });
      return NextResponse.json(result.data, {
        status: result.status,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    if (body.action === 'read') {
      const [balance, history] = await Promise.all([
        core(`/v1/credits/members/${memberId}/balance`),
        core(`/v1/credits/members/${memberId}/transactions?limit=50`),
      ]);
      const failure = [balance, history].find((result) => result.error);
      if (failure) return NextResponse.json(failure.data, { status: failure.status });
      return NextResponse.json(
        { balance: balance.data, transactions: history.data },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }
    return NextResponse.json({ message: 'Unknown demo action.' }, { status: 400 });
  } catch {
    return NextResponse.json(
      { message: 'Could not reach Core. Retry using the same request.' },
      { status: 502 },
    );
  }
}
