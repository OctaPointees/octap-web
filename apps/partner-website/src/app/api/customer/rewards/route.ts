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
    if (
      body?.action !== 'claim' ||
      typeof body.voucherId !== 'string' ||
      !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(body.voucherId)
    )
      return NextResponse.json({ message: 'Select a valid voucher.' }, { status: 400 });
    // A retried claim must not debit again once the ownership already exists.
    const existing = owned.find((item: { voucherId: string }) => item.voucherId === body.voucherId);
    if (existing) return NextResponse.json(existing, { headers: { 'Cache-Control': 'no-store' } });
    const result = await core(`/v1/rewards/vouchers/${body.voucherId}/claim`, {
      organizationEndUserId: session.memberId,
      idempotencyKey: `web-demo-claim-${body.voucherId}-${session.memberId}`,
    });
    const data = await result.json();
    if (!result.ok)
      return NextResponse.json(
        {
          message:
            result.status >= 500
              ? 'Could not claim the voucher. Refresh your vouchers before trying again.'
              : typeof data.message === 'string'
                ? data.message
                : 'Voucher claim rejected.',
        },
        { status: result.status },
      );
    return NextResponse.json(
      { serialCode: data.serialCode, status: data.status },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      { message: 'Rewards service unavailable. Refresh before trying again.' },
      { status: 502 },
    );
  }
}
