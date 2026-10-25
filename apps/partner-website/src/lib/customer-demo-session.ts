import { createHmac, timingSafeEqual } from 'node:crypto';

export const CUSTOMER_COOKIE = 'octap_customer_demo';
export const CUSTOMER_SESSION_SECONDS = 3600;

export interface CustomerDemoSession {
  organizationId: string;
  endUserId: string;
  suiAddress: string;
  memberId?: string;
  expiresAt: number;
}

export function customerDemoEnabled() {
  return process.env.NODE_ENV === 'development' && process.env.ENABLE_MERCHANT_DEMO === 'true';
}

function signature(value: string): string {
  const secret = process.env.CUSTOMER_DEMO_SESSION_SECRET;
  if (!secret || secret.length < 32)
    throw new Error('Customer demo session secret is not configured');
  return createHmac('sha256', secret).update(value).digest('base64url');
}

export function encodeCustomerSession(session: CustomerDemoSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  return `${payload}.${signature(payload)}`;
}

export function decodeCustomerSession(
  cookie: string | undefined,
  organizationId: string,
): CustomerDemoSession | null {
  try {
    if (!cookie || cookie.length > 4096) return null;
    const [payload, mac, extra] = cookie.split('.');
    if (!payload || !mac || extra) return null;
    const expected = Buffer.from(signature(payload));
    const actual = Buffer.from(mac);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (
      session.organizationId !== organizationId ||
      typeof session.endUserId !== 'string' ||
      typeof session.suiAddress !== 'string' ||
      !Number.isFinite(session.expiresAt) ||
      session.expiresAt <= Date.now() ||
      (session.memberId !== undefined && typeof session.memberId !== 'string')
    )
      return null;
    return session;
  } catch {
    return null;
  }
}
