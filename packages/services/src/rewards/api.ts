import type {
  ConsoleVoucher,
  ConsoleVoucherInput,
  ConsoleVoucherPatch,
  CreateVoucherBatchResponse,
  VoucherBatch,
  VoucherBatchActionResponse,
  VoucherBatchDetail,
  VoucherBatchItem,
} from './types';

/**
 * Sends one request to Core and returns its JSON body, or throws on a non-2xx answer.
 * `useAuth().client().request` from `@octap/shared/authentication` provides one that carries the
 * Google ID token.
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

/**
 * Import batches through Core's console batch routes (OCT-303): rows checked with `dryRun`, created
 * as one DRAFT batch, then activated, paused, resumed or archived together. Every action answers
 * with each reward's outcome.
 */
export function createVoucherBatchesApi(request: CoreRequest) {
  const batches = (organizationId: string) =>
    `/v1/console/organizations/${encodeURIComponent(organizationId)}/voucher-batches`;
  const batch = (organizationId: string, batchId: string) =>
    `${batches(organizationId)}/${encodeURIComponent(batchId)}`;
  const action =
    (name: 'activate' | 'pause' | 'resume' | 'archive') =>
    (organizationId: string, batchId: string) =>
      request<VoucherBatchActionResponse>(`${batch(organizationId, batchId)}/${name}`, 'POST');
  return {
    /** `dryRun` checks every row and writes nothing. */
    create: (
      organizationId: string,
      body: { items: VoucherBatchItem[]; name?: string; dryRun?: boolean },
      signal?: AbortSignal,
    ) => request<CreateVoucherBatchResponse>(batches(organizationId), 'POST', body, signal),
    list: (organizationId: string, includeArchived: boolean, signal?: AbortSignal) =>
      request<VoucherBatch[]>(
        `${batches(organizationId)}${includeArchived ? '?includeArchived=true' : ''}`,
        'GET',
        undefined,
        signal,
      ),
    get: (organizationId: string, batchId: string, signal?: AbortSignal) =>
      request<VoucherBatchDetail>(batch(organizationId, batchId), 'GET', undefined, signal),
    /** An Owner's activation also approves the rewards waiting for approval. */
    activate: action('activate'),
    /** Owner only. */
    pause: action('pause'),
    /** Owner only. */
    resume: action('resume'),
    /** Its never-live rewards become ARCHIVED; live ones stay live. */
    archive: action('archive'),
  };
}

export type RewardsApi = ReturnType<typeof createRewardsApi>;
export type VoucherBatchesApi = ReturnType<typeof createVoucherBatchesApi>;
