import type { ConsoleVoucher, ConsoleVoucherInput, ConsoleVoucherPatch } from './types';

/**
 * Sends one request to Core and returns its JSON body, or throws on a non-2xx answer. The console
 * client from `@octap/shared/google-auth` provides one that carries the Google ID token.
 */
export type CoreRequest = <T>(
  path: string,
  method?: string,
  body?: unknown,
  signal?: AbortSignal,
) => Promise<T>;

/** The organization's reward catalog through Core's console voucher routes (OCT-236). */
export function createRewardsApi(request: CoreRequest) {
  const vouchers = (organizationId: string) =>
    `/v1/console/organizations/${encodeURIComponent(organizationId)}/vouchers`;
  const voucher = (organizationId: string, voucherId: string) =>
    `${vouchers(organizationId)}/${encodeURIComponent(voucherId)}`;
  return {
    list: (organizationId: string, signal?: AbortSignal) =>
      request<ConsoleVoucher[]>(vouchers(organizationId), 'GET', undefined, signal),
    get: (organizationId: string, voucherId: string, signal?: AbortSignal) =>
      request<ConsoleVoucher>(voucher(organizationId, voucherId), 'GET', undefined, signal),
    create: (organizationId: string, input: ConsoleVoucherInput) =>
      request<ConsoleVoucher>(vouchers(organizationId), 'POST', input),
    update: (organizationId: string, voucherId: string, patch: ConsoleVoucherPatch) =>
      request<ConsoleVoucher>(voucher(organizationId, voucherId), 'PATCH', patch),
    /** A Business Developer's draft goes to an Owner (OCT-59). An Owner activates directly. */
    submit: (organizationId: string, voucherId: string) =>
      request<ConsoleVoucher>(`${voucher(organizationId, voucherId)}/submit`, 'POST'),
    /** A reward waiting for approval back to DRAFT, so it can be edited. */
    withdraw: (organizationId: string, voucherId: string) =>
      request<ConsoleVoucher>(`${voucher(organizationId, voucherId)}/withdraw`, 'POST'),
    /** Owner only: starts publishing, exactly as activating does. */
    approve: (organizationId: string, voucherId: string) =>
      request<ConsoleVoucher>(`${voucher(organizationId, voucherId)}/approve`, 'POST'),
    /** Owner only: back to DRAFT with a reason (1–500 characters) the submitter sees. */
    reject: (organizationId: string, voucherId: string, reason: string) =>
      request<ConsoleVoucher>(`${voucher(organizationId, voucherId)}/reject`, 'POST', { reason }),
  };
}

export type RewardsApi = ReturnType<typeof createRewardsApi>;
