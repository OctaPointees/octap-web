import { NextResponse, type NextRequest } from 'next/server';

/** Local cashier demo only. Production requires Core's real merchant session/role flow. */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development' || process.env.ENABLE_MERCHANT_DEMO !== 'true') {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }
  const host = request.headers.get('host') ?? '';
  const origin = request.headers.get('origin');
  // The merchant page on this app, or the configured local dashboard.
  const trusted = [`http://${host}`, process.env.MERCHANT_DEMO_ORIGIN ?? 'http://localhost:4000'];
  if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) || !origin || !trusted.includes(origin)) {
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
    if (body.action === 'vouchers') {
      // A voucher is used only with the customer's signature, on their device. The merchant reads its state.
      const owned = await core(`/v1/rewards/members/${memberId}/vouchers`);
      return NextResponse.json(owned.data, {
        status: owned.status,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    if (body.action === 'earn') {
      if (
        !Number.isSafeInteger(body.purchaseAmount) ||
        body.purchaseAmount <= 0 ||
        body.purchaseAmount > 1_000_000 ||
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
        purchaseAmount: body.purchaseAmount,
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
