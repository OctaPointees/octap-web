/** Public Core HTTP response shapes; Web is independent of the OctaP SDK. */
export type OrganizationPersona = 'BUSINESS_OWNER' | 'BUSINESS_DEVELOPER';
export type OrganizationType = 'INDIVIDUAL_HOUSEHOLD' | 'COMPANY';
export interface ConsoleIdentity {
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
    systemRole: 'SYSTEM_USER' | 'SYSTEM_ADMIN';
  };
  organizations: Array<{
    organizationId: string;
    name: string;
    slug: string;
    persona: OrganizationPersona;
  }>;
  expiresAt: string;
}
export interface ConsoleOrganization {
  organizationType: OrganizationType | null;
  representativeName: string | null;
  nationalIdLast4?: string | null;
  id: string;
  name: string;
  slug: string;
  legalName: string | null;
  taxId: string | null;
  status: string;
  persona: OrganizationPersona;
}
export interface ConsoleInvitation {
  id: string;
  email: string;
  persona: 'BUSINESS_DEVELOPER';
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  expiresAt: string;
}
export interface ConsoleStaff {
  id: string;
  email: string;
  fullName: string;
  persona: OrganizationPersona;
  status: string;
}
export interface ConsoleMember {
  id: string;
  endUserId: string;
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
  status: string;
  externalMemberId: string | null;
  metadata: unknown;
  joinedAt: string;
  balance?: {
    confirmedBalance: number;
    pendingEarn: number;
    pendingRedemption: number;
    stale: boolean;
    observedAt: string;
  };
}
export interface ConsoleCredential {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: unknown;
  status: string;
}
/** A reward as Core's console voucher routes return it (OCT-236). */
export interface ConsoleVoucher {
  id: string;
  organizationId: string;
  code: string;
  title: string;
  description: string | null;
  pointsCost: number;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_ITEM' | null;
  discountValue: string | null;
  terms: Record<string, unknown> | null;
  /** `PUBLISHING` until the worker freezes the terms on-chain; `FAILED` can be activated again. */
  publishStatus: 'NOT_PUBLISHED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED';
  suiTermsId: string | null;
  totalSupply: number | null;
  claimedCount: number;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'DEPLETED';
  startsAt: string | null;
  expiresAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
/** A console create is always a DRAFT; `pointsCost` is required (0 for a free reward). */
export interface ConsoleVoucherInput {
  code: string;
  title: string;
  description?: string;
  pointsCost: number;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_ITEM';
  discountValue?: string;
  terms?: Record<string, unknown>;
  totalSupply?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
}
/** Fields to change, or `{ status }` to activate (`ACTIVE`) or pause (`PAUSED`). */
export type ConsoleVoucherPatch = Partial<Omit<ConsoleVoucherInput, 'discountValue'>> & {
  /** `null` clears it, e.g. when a draft changes from percent off to a free item. */
  discountValue?: string | null;
  status?: 'ACTIVE' | 'PAUSED';
};
/** A Core error response: still an `Error`, plus the HTTP status so a form can tell 400 from 403. */
export class ConsoleApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ConsoleApiError';
    this.status = status;
  }
}
export interface OrganizationApplication {
  organizationType: OrganizationType | null;
  representativeName: string | null;
  legalName: string | null;
  taxId: string | null;
  nationalIdLast4: string | null;
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reason: string | null;
  createdAt: string;
  applicantEmail: string;
}
interface ProfileInput {
  organizationType?: OrganizationType;
  representativeName?: string;
  nationalId?: string;
  name: string;
  legalName?: string;
  taxId?: string;
}

/** Fetch transport for the portal only. Each protected request carries the Google ID token. */
export function createConsoleClient({
  apiBaseUrl,
  getAuthToken,
}: {
  apiBaseUrl: string;
  getAuthToken?: () => string;
}) {
  async function request<T>(
    path: string,
    method = 'GET',
    body?: unknown,
    signal?: AbortSignal,
  ): Promise<T> {
    const token = getAuthToken?.();
    const response = await fetch(`${apiBaseUrl.replace(/\/+$/, '')}${path}`, {
      method,
      cache: 'no-store',
      signal: signal ?? AbortSignal.timeout(30_000),
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const result = await response.json().catch(() => null);
    if (!response.ok)
      throw new ConsoleApiError(
        response.status,
        typeof result?.message === 'string'
          ? result.message
          : `Core request failed (${response.status}).`,
      );
    return result as T;
  }
  const organizationPath = (id: string) => `/v1/console/organizations/${encodeURIComponent(id)}`;
  return {
    loginConsoleWithGoogle: (idToken: string, options: { signal?: AbortSignal } = {}) =>
      request<ConsoleIdentity>('/v1/console/auth/google', 'POST', { idToken }, options.signal),
    getConsoleIdentity: (options: { signal?: AbortSignal } = {}) =>
      request<ConsoleIdentity>('/v1/console/me', 'GET', undefined, options.signal),
    requestConsoleOrganization: (
      input: ProfileInput & { slug: string; organizationType: OrganizationType },
    ) => request<{ id: string }>('/v1/console/organization-requests', 'POST', input),
    listConsoleOrganizationRequests: (signal?: AbortSignal) =>
      request<OrganizationApplication[]>(
        '/v1/console/organization-requests',
        'GET',
        undefined,
        signal,
      ),
    listPlatformOrganizationRequests: (signal?: AbortSignal) =>
      request<OrganizationApplication[]>(
        '/v1/platform/organization-requests',
        'GET',
        undefined,
        signal,
      ),
    decidePlatformOrganizationRequest: (
      id: string,
      decision: 'approve' | 'reject',
      reason?: string,
    ) =>
      request<{ organizationId: string }>(
        `/v1/platform/organization-requests/${encodeURIComponent(id)}/${decision}`,
        'POST',
        { reason },
      ),
    getConsoleOrganization: (id: string, signal?: AbortSignal) =>
      request<ConsoleOrganization>(organizationPath(id), 'GET', undefined, signal),
    updateConsoleOrganizationProfile: (id: string, input: ProfileInput) =>
      request<{ updated: boolean }>(`${organizationPath(id)}/profile`, 'PATCH', input),
    listConsoleStaff: (id: string, signal?: AbortSignal) =>
      request<ConsoleStaff[]>(`${organizationPath(id)}/staff`, 'GET', undefined, signal),
    listMembers: (id: string, query: URLSearchParams, signal?: AbortSignal) =>
      request<{ items: ConsoleMember[]; nextCursor: string | null }>(
        `${organizationPath(id)}/members?${query}`,
        'GET',
        undefined,
        signal,
      ),
    getMember: (id: string, memberId: string, signal?: AbortSignal) =>
      request<ConsoleMember>(
        `${organizationPath(id)}/members/${encodeURIComponent(memberId)}`,
        'GET',
        undefined,
        signal,
      ),
    updateMember: (id: string, memberId: string, input: object) =>
      request<{ updated: boolean }>(
        `${organizationPath(id)}/members/${encodeURIComponent(memberId)}`,
        'PATCH',
        input,
      ),
    updateConsoleStaffAccess: (id: string, userId: string, status: 'ACTIVE' | 'SUSPENDED') =>
      request<{ updated: boolean }>(
        `${organizationPath(id)}/staff/${encodeURIComponent(userId)}`,
        'PATCH',
        { status },
      ),
    listConsoleCredentials: (id: string, signal?: AbortSignal) =>
      request<ConsoleCredential[]>(
        `${organizationPath(id)}/api-credentials`,
        'GET',
        undefined,
        signal,
      ),
    listConsoleVouchers: (id: string, signal?: AbortSignal) =>
      request<ConsoleVoucher[]>(`${organizationPath(id)}/vouchers`, 'GET', undefined, signal),
    getConsoleVoucher: (id: string, voucherId: string, signal?: AbortSignal) =>
      request<ConsoleVoucher>(
        `${organizationPath(id)}/vouchers/${encodeURIComponent(voucherId)}`,
        'GET',
        undefined,
        signal,
      ),
    createConsoleVoucher: (id: string, input: ConsoleVoucherInput) =>
      request<ConsoleVoucher>(`${organizationPath(id)}/vouchers`, 'POST', input),
    updateConsoleVoucher: (id: string, voucherId: string, patch: ConsoleVoucherPatch) =>
      request<ConsoleVoucher>(
        `${organizationPath(id)}/vouchers/${encodeURIComponent(voucherId)}`,
        'PATCH',
        patch,
      ),
    createConsoleInvitation: (id: string, email: string) =>
      request<ConsoleInvitation & { token: string }>(
        `${organizationPath(id)}/invitations`,
        'POST',
        {
          email,
          persona: 'BUSINESS_DEVELOPER',
        },
      ),
    listConsoleInvitations: (id: string, signal?: AbortSignal) =>
      request<ConsoleInvitation[]>(`${organizationPath(id)}/invitations`, 'GET', undefined, signal),
    revokeConsoleInvitation: (id: string, invitationId: string) =>
      request<{ revoked: boolean }>(
        `${organizationPath(id)}/invitations/${encodeURIComponent(invitationId)}/revoke`,
        'POST',
      ),
    acceptConsoleInvitation: (token: string) =>
      request<{ organizationId: string }>(
        `/v1/console/invitations/${encodeURIComponent(token)}/accept`,
        'POST',
      ),
  };
}
