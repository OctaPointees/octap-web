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
  if (!origin || !URL.canParse(origin) || new URL(origin).host !== request.headers.get('host')) {
    return NextResponse.json({ message: 'Invalid request origin' }, { status: 403 });
  }
  const session = decodeCustomerSession(
    request.cookies.get(CUSTOMER_COOKIE)?.value,
    tenant.organizationId,
  );
  if (!session?.memberId)
    return NextResponse.json(
      { message: 'Sign in again and join the store to view your points.' },
      { status: 401 },
    );
  const key = process.env.MERCHANT_DEMO_API_KEY;
  if (!key)
    return NextResponse.json(
      { message: 'Customer balance demo is not configured.' },
      { status: 503 },
    );
  const base = (process.env.CORE_API_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
  try {
    // Subject and tenant come from the signed server cookie, never a member ID in the request body.
    const responses = await Promise.all(
      ['balance', 'transactions?limit=10'].map((suffix) =>
        fetch(`${base}/v1/credits/members/${session.memberId}/${suffix}`, {
          headers: { Authorization: `Bearer ${key}` },
          cache: 'no-store',
          signal: AbortSignal.timeout(15_000),
        }),
      ),
    );
    if (responses.some((response) => !response.ok))
      return NextResponse.json(
        { message: 'Could not load your points. Please try again.' },
        { status: 502 },
      );
    const [balance, transactions] = await Promise.all(responses.map((response) => response.json()));
    return NextResponse.json(
      {
        confirmedBalance: balance.confirmedBalance,
        pendingEarn: balance.pendingEarn,
        pendingRedemption: balance.pendingRedemption,
        stale: balance.stale,
        observedAt: balance.observedAt,
        transactions: transactions.map(
          (tx: {
            id: string;
            transactionType: string;
            pointsAmount: number | null;
            estimatedPoints?: number | null;
            status: string;
            createdAt: string;
            blockchainDigest?: string;
          }) => ({
            id: tx.id,
            type: tx.transactionType,
            points: tx.pointsAmount,
            estimatedPoints: tx.estimatedPoints ?? null,
            status: tx.status,
            createdAt: tx.createdAt,
            digest: tx.blockchainDigest,
          }),
        ),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      { message: 'Rewards service is unavailable. Please try again.' },
      { status: 502 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!customerDemoEnabled()) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  const origin = request.headers.get('origin');
  if (!origin || !URL.canParse(origin) || new URL(origin).host !== request.headers.get('host')) {
    return NextResponse.json({ message: 'Invalid request origin' }, { status: 403 });
  }
  const response = NextResponse.json(
    { signedOut: true },
    { headers: { 'Cache-Control': 'no-store' } },
  );
  response.cookies.set(CUSTOMER_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
