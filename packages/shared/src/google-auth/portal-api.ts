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
  tier: string;
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
      throw new Error(
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
