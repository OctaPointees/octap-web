import { NextResponse, type NextRequest } from 'next/server';
import { resolveTenant } from '../../../../lib/tenant';
import {
  CUSTOMER_COOKIE,
  CUSTOMER_SESSION_SECONDS,
  customerDemoEnabled,
  decodeCustomerSession,
  encodeCustomerSession,
} from '../../../../lib/customer-demo-session';

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const tenant = resolveTenant(request.headers.get('host') ?? '');
  if (!tenant) return NextResponse.json({ message: 'Store not found' }, { status: 404 });
  // Resolve the tenant independently on every request; never accept an organization ID from the browser.
  const origin = request.headers.get('origin');
  if (!origin || !URL.canParse(origin) || new URL(origin).host !== request.headers.get('host')) {
    return NextResponse.json({ message: 'Invalid request origin' }, { status: 403 });
  }
  const { action } = await context.params;
  if (action !== 'login' && action !== 'enroll' && action !== 'nonce')
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  const body = await request.json().catch(() => null);
  const demoSession = customerDemoEnabled()
    ? decodeCustomerSession(request.cookies.get(CUSTOMER_COOKIE)?.value, tenant.organizationId)
    : null;
  if (action === 'enroll' && customerDemoEnabled() && !demoSession) {
    return NextResponse.json(
      { message: 'Sign in with Google again before joining the store.' },
      { status: 401 },
    );
  }
  const value = action === 'nonce' ? body?.ephemeralPublicKey : body?.idToken;
  if (typeof value !== 'string' || !value.trim() || value.length > 16_384) {
    return NextResponse.json(
      {
        message:
          action === 'nonce' ? 'Ephemeral public key is required' : 'Google ID token is required',
      },
      { status: 400 },
    );
  }
  const path =
    action === 'login'
      ? '/v1/identity/google-login'
      : action === 'nonce'
        ? '/v1/identity/zklogin/nonce'
        : `/v1/identity/organizations/${tenant.organizationId}/enroll`;
  try {
    const base = (process.env.CORE_API_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
    const response = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action === 'nonce' ? { ephemeralPublicKey: value } : { idToken: value }),
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok)
      return NextResponse.json(
        {
          message:
            response.status >= 500
              ? 'Sign-in service is unavailable. Check Core and Enoki configuration.'
              : 'Identity request rejected. Sign in again or contact the store.',
        },
        { status: response.status },
      );
    // The session cookie must never attach one customer's member ID to another's sign-in.
    if (action === 'enroll' && demoSession && data?.endUserId !== demoSession.endUserId) {
      return NextResponse.json(
        { message: 'Sign in with Google again before joining the store.' },
        { status: 401 },
      );
    }
    const outgoing = NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
    if (customerDemoEnabled() && (action === 'login' || action === 'enroll')) {
      const session =
        action === 'login'
          ? {
              organizationId: tenant.organizationId,
              endUserId: data.endUserId,
              suiAddress: data.suiAddress,
              expiresAt: Date.now() + CUSTOMER_SESSION_SECONDS * 1000,
            }
          : { ...demoSession!, memberId: data.organizationEndUserId };
      outgoing.cookies.set(CUSTOMER_COOKIE, encodeCustomerSession(session), {
        httpOnly: true,
        sameSite: 'lax',
        secure: request.nextUrl.protocol === 'https:',
        path: '/',
        maxAge: CUSTOMER_SESSION_SECONDS,
      });
    }
    return outgoing;
  } catch {
    return NextResponse.json(
      { message: 'Could not reach the rewards service. Please try again shortly.' },
      { status: 502 },
    );
  }
}
