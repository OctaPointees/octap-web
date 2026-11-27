import type { OctapResponse } from '../types.js';
import { ApiGroup } from '../lib/api-group.js';
import type { HttpClient } from '../lib/http.js';
import type * as OpenApi from './openapi.js';

/** OpenAPI endpoint methods for the console API group. */
export class ConsoleApi extends ApiGroup {
  constructor(http: HttpClient) {
    super(http);
  }
  /** Sends a GET request to /v1/console/mcp/token. */
  token(): Promise<OctapResponse<OpenApi.ConsoleMcpTokenTokenResponse>> {
    return this.request<OpenApi.ConsoleMcpTokenTokenResponse>({
      method: 'get',
      url: `/v1/console/mcp/token`,
    });
  }
  /** Sends a POST request to /v1/console/organizations/{organizationId}/assistant/messages. */
  message(input: {
    organizationId: string;
    body: OpenApi.ConsoleAssistantMessageInput;
  }): Promise<OctapResponse<unknown>> {
    return this.request<unknown>({
      method: 'post',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/assistant/messages`,
      data: input.body,
    });
  }
  /** Sends a GET request to /v1/console/organizations/{organizationId}/budget. */
  readIssuanceBudget(input: {
    organizationId: string;
  }): Promise<OctapResponse<OpenApi.ConsoleIssuanceBudgetReadResponse>> {
    return this.request<OpenApi.ConsoleIssuanceBudgetReadResponse>({
      method: 'get',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/budget`,
    });
  }
  /** Sends a POST request to /v1/console/organizations/{organizationId}/change-requests. */
  propose(input: {
    organizationId: string;
    body: OpenApi.ConsoleChangeRequestsProposeInput;
  }): Promise<OctapResponse<OpenApi.ConsoleChangeRequestsProposeResponse>> {
    return this.request<OpenApi.ConsoleChangeRequestsProposeResponse>({
      method: 'post',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/change-requests`,
      data: input.body,
    });
  }
  /** Sends a GET request to /v1/console/organizations/{organizationId}/members. */
  listMembers(input: {
    organizationId: string;
    limit?: number;
    cursor?: string;
    q?: string;
    status?: 'ACTIVE' | 'BLOCKED';
    externalMemberId?: string;
  }): Promise<OctapResponse<OpenApi.MembersListResponse>> {
    return this.request<OpenApi.MembersListResponse>({
      method: 'get',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/members`,
      params: {
        limit: input.limit,
        cursor: input.cursor,
        q: input.q,
        status: input.status,
        externalMemberId: input.externalMemberId,
      },
    });
  }
  /** Sends a GET request to /v1/console/organizations/{organizationId}/members/{memberId}. */
  detailMembers(input: {
    organizationId: string;
    memberId: string;
  }): Promise<OctapResponse<OpenApi.MembersDetailResponse>> {
    return this.request<OpenApi.MembersDetailResponse>({
      method: 'get',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/members/${encodeURIComponent(input.memberId)}`,
    });
  }
  /** Sends a PATCH request to /v1/console/organizations/{organizationId}/members/{memberId}. */
  patch(input: {
    organizationId: string;
    memberId: string;
    body: OpenApi.MembersPatchInput;
  }): Promise<OctapResponse<OpenApi.MembersPatchResponse>> {
    return this.request<OpenApi.MembersPatchResponse>({
      method: 'patch',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/members/${encodeURIComponent(input.memberId)}`,
      data: input.body,
    });
  }
  /** Sends a GET request to /v1/console/organizations/{organizationId}/members/{memberId}/transactions. */
  transactions(input: {
    organizationId: string;
    memberId: string;
    limit?: number;
    cursor?: string;
  }): Promise<OctapResponse<OpenApi.MembersTransactionsResponse>> {
    return this.request<OpenApi.MembersTransactionsResponse>({
      method: 'get',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/members/${encodeURIComponent(input.memberId)}/transactions`,
      params: {
        limit: input.limit,
        cursor: input.cursor,
      },
    });
  }
  /** Sends a GET request to /v1/console/organizations/{organizationId}/members/{memberId}/vouchers. */
  vouchers(input: {
    organizationId: string;
    memberId: string;
  }): Promise<OctapResponse<OpenApi.MembersVouchersResponse>> {
    return this.request<OpenApi.MembersVouchersResponse>({
      method: 'get',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/members/${encodeURIComponent(input.memberId)}/vouchers`,
    });
  }
  /** Sends a GET request to /v1/console/organizations/{organizationId}/vouchers. */
  listRewards(input: {
    organizationId: string;
  }): Promise<OctapResponse<OpenApi.ConsoleRewardsListResponse>> {
    return this.request<OpenApi.ConsoleRewardsListResponse>({
      method: 'get',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/vouchers`,
    });
  }
  /** Sends a POST request to /v1/console/organizations/{organizationId}/vouchers. */
  createRewards(input: {
    organizationId: string;
    body: OpenApi.ConsoleRewardsCreateInput;
  }): Promise<OctapResponse<OpenApi.VoucherDto>> {
    return this.request<OpenApi.VoucherDto>({
      method: 'post',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/vouchers`,
      data: input.body,
    });
  }
  /** Sends a GET request to /v1/console/organizations/{organizationId}/vouchers/{id}. */
  detailRewards(input: {
    organizationId: string;
    id: string;
  }): Promise<OctapResponse<OpenApi.VoucherDto>> {
    return this.request<OpenApi.VoucherDto>({
      method: 'get',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/vouchers/${encodeURIComponent(input.id)}`,
    });
  }
  /** Sends a PATCH request to /v1/console/organizations/{organizationId}/vouchers/{id}. */
  updateRewards(input: {
    organizationId: string;
    id: string;
    body: OpenApi.ConsoleRewardsUpdateInput;
  }): Promise<OctapResponse<OpenApi.VoucherDto>> {
    return this.request<OpenApi.VoucherDto>({
      method: 'patch',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/vouchers/${encodeURIComponent(input.id)}`,
      data: input.body,
    });
  }
  /** Sends a POST request to /v1/console/organizations/{organizationId}/vouchers/{id}/submit. */
  submit(input: {
    organizationId: string;
    id: string;
  }): Promise<OctapResponse<OpenApi.VoucherDto>> {
    return this.request<OpenApi.VoucherDto>({
      method: 'post',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/vouchers/${encodeURIComponent(input.id)}/submit`,
    });
  }
  /** Sends a POST request to /v1/console/organizations/{organizationId}/vouchers/{id}/withdraw. */
  withdraw(input: {
    organizationId: string;
    id: string;
  }): Promise<OctapResponse<OpenApi.VoucherDto>> {
    return this.request<OpenApi.VoucherDto>({
      method: 'post',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/vouchers/${encodeURIComponent(input.id)}/withdraw`,
    });
  }
  /** Sends a POST request to /v1/console/organizations/{organizationId}/vouchers/{id}/approve. */
  approve(input: {
    organizationId: string;
    id: string;
    body: OpenApi.ConsoleRewardsApproveInput;
  }): Promise<OctapResponse<OpenApi.VoucherDto>> {
    return this.request<OpenApi.VoucherDto>({
      method: 'post',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/vouchers/${encodeURIComponent(input.id)}/approve`,
      data: input.body,
    });
  }
  /** Sends a POST request to /v1/console/organizations/{organizationId}/vouchers/{id}/reject. */
  reject(input: {
    organizationId: string;
    id: string;
    body: OpenApi.ConsoleRewardsRejectInput;
  }): Promise<OctapResponse<OpenApi.VoucherDto>> {
    return this.request<OpenApi.VoucherDto>({
      method: 'post',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/vouchers/${encodeURIComponent(input.id)}/reject`,
      data: input.body,
    });
  }
  /** Sends a POST request to /v1/console/organizations/{organizationId}/voucher-batches. */
  createVoucherBatches(input: {
    organizationId: string;
    body: OpenApi.ConsoleVoucherBatchesCreateInput;
  }): Promise<OctapResponse<OpenApi.ConsoleVoucherBatchesCreateResponse>> {
    return this.request<OpenApi.ConsoleVoucherBatchesCreateResponse>({
      method: 'post',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/voucher-batches`,
      data: input.body,
    });
  }
  /** Sends a GET request to /v1/console/organizations/{organizationId}/voucher-batches. */
  listVoucherBatches(input: {
    organizationId: string;
    includeArchived?: 'false' | 'true';
  }): Promise<OctapResponse<OpenApi.ConsoleVoucherBatchesListResponse>> {
    return this.request<OpenApi.ConsoleVoucherBatchesListResponse>({
      method: 'get',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/voucher-batches`,
      params: {
        includeArchived: input.includeArchived,
      },
    });
  }
  /** Sends a GET request to /v1/console/organizations/{organizationId}/voucher-batches/{batchId}. */
  detailVoucherBatches(input: {
    organizationId: string;
    batchId: string;
  }): Promise<OctapResponse<OpenApi.ConsoleVoucherBatchesDetailResponse>> {
    return this.request<OpenApi.ConsoleVoucherBatchesDetailResponse>({
      method: 'get',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/voucher-batches/${encodeURIComponent(input.batchId)}`,
    });
  }
  /** Sends a POST request to /v1/console/organizations/{organizationId}/voucher-batches/{batchId}/activate. */
  activate(input: {
    organizationId: string;
    batchId: string;
    body: OpenApi.ConsoleVoucherBatchesActivateInput;
  }): Promise<OctapResponse<OpenApi.ConsoleVoucherBatchesActivateResponse>> {
    return this.request<OpenApi.ConsoleVoucherBatchesActivateResponse>({
      method: 'post',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/voucher-batches/${encodeURIComponent(input.batchId)}/activate`,
      data: input.body,
    });
  }
  /** Sends a POST request to /v1/console/organizations/{organizationId}/voucher-batches/{batchId}/archive. */
  archive(input: {
    organizationId: string;
    batchId: string;
  }): Promise<OctapResponse<OpenApi.ConsoleVoucherBatchesArchiveResponse>> {
    return this.request<OpenApi.ConsoleVoucherBatchesArchiveResponse>({
      method: 'post',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/voucher-batches/${encodeURIComponent(input.batchId)}/archive`,
    });
  }
  /** Sends a POST request to /v1/console/organizations/{organizationId}/voucher-batches/{batchId}/pause. */
  pause(input: {
    organizationId: string;
    batchId: string;
  }): Promise<OctapResponse<OpenApi.ConsoleVoucherBatchesPauseResponse>> {
    return this.request<OpenApi.ConsoleVoucherBatchesPauseResponse>({
      method: 'post',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/voucher-batches/${encodeURIComponent(input.batchId)}/pause`,
    });
  }
  /** Sends a POST request to /v1/console/organizations/{organizationId}/voucher-batches/{batchId}/resume. */
  resume(input: {
    organizationId: string;
    batchId: string;
  }): Promise<OctapResponse<OpenApi.ConsoleVoucherBatchesResumeResponse>> {
    return this.request<OpenApi.ConsoleVoucherBatchesResumeResponse>({
      method: 'post',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/voucher-batches/${encodeURIComponent(input.batchId)}/resume`,
    });
  }
  /** Sends a GET request to /v1/console/organizations/{organizationId}/refund-policy. */
  current(input: {
    organizationId: string;
  }): Promise<OctapResponse<OpenApi.ConsoleRefundPolicyCurrentResponse>> {
    return this.request<OpenApi.ConsoleRefundPolicyCurrentResponse>({
      method: 'get',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/refund-policy`,
    });
  }
  /** Sends a PUT request to /v1/console/organizations/{organizationId}/refund-policy. */
  publish(input: {
    organizationId: string;
    body: OpenApi.ConsoleRefundPolicyPublishInput;
  }): Promise<OctapResponse<OpenApi.VoucherRefundPolicyDto>> {
    return this.request<OpenApi.VoucherRefundPolicyDto>({
      method: 'put',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/refund-policy`,
      data: input.body,
    });
  }
  /** Sends a GET request to /v1/console/organizations/{organizationId}/refund-policy/history. */
  history(input: {
    organizationId: string;
    limit?: number;
    beforeVersion?: number;
  }): Promise<OctapResponse<OpenApi.ConsoleRefundPolicyHistoryResponse>> {
    return this.request<OpenApi.ConsoleRefundPolicyHistoryResponse>({
      method: 'get',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/refund-policy/history`,
      params: {
        limit: input.limit,
        beforeVersion: input.beforeVersion,
      },
    });
  }
  /** Sends a GET request to /v1/console/organizations/{organizationId}/webhooks/endpoints. */
  listEndpoints(input: {
    organizationId: string;
  }): Promise<OctapResponse<OpenApi.ConsoleWebhooksListEndpointsResponse>> {
    return this.request<OpenApi.ConsoleWebhooksListEndpointsResponse>({
      method: 'get',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/webhooks/endpoints`,
    });
  }
  /** Sends a POST request to /v1/console/organizations/{organizationId}/webhooks/endpoints. */
  registerEndpoint(input: {
    organizationId: string;
    body: OpenApi.ConsoleWebhooksRegisterEndpointInput;
  }): Promise<OctapResponse<OpenApi.ConsoleWebhooksRegisterEndpointResponse>> {
    return this.request<OpenApi.ConsoleWebhooksRegisterEndpointResponse>({
      method: 'post',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/webhooks/endpoints`,
      data: input.body,
    });
  }
  /** Sends a POST request to /v1/console/organizations/{organizationId}/webhooks/endpoints/{id}/disable. */
  disableEndpoint(input: {
    organizationId: string;
    id: string;
  }): Promise<OctapResponse<OpenApi.ConsoleWebhooksDisableEndpointResponse>> {
    return this.request<OpenApi.ConsoleWebhooksDisableEndpointResponse>({
      method: 'post',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/webhooks/endpoints/${encodeURIComponent(input.id)}/disable`,
    });
  }
  /** Sends a POST request to /v1/console/organizations/{organizationId}/webhooks/endpoints/{id}/enable. */
  enableEndpoint(input: {
    organizationId: string;
    id: string;
  }): Promise<OctapResponse<OpenApi.ConsoleWebhooksEnableEndpointResponse>> {
    return this.request<OpenApi.ConsoleWebhooksEnableEndpointResponse>({
      method: 'post',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/webhooks/endpoints/${encodeURIComponent(input.id)}/enable`,
    });
  }
  /** Sends a POST request to /v1/console/organizations/{organizationId}/webhooks/endpoints/{id}/rotate-secret. */
  rotateSecret(input: {
    organizationId: string;
    id: string;
  }): Promise<OctapResponse<OpenApi.ConsoleWebhooksRotateSecretResponse>> {
    return this.request<OpenApi.ConsoleWebhooksRotateSecretResponse>({
      method: 'post',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/webhooks/endpoints/${encodeURIComponent(input.id)}/rotate-secret`,
    });
  }
  /** Sends a GET request to /v1/console/organizations/{organizationId}/webhooks/deliveries. */
  listDeliveries(input: {
    organizationId: string;
  }): Promise<OctapResponse<OpenApi.ConsoleWebhooksListDeliveriesResponse>> {
    return this.request<OpenApi.ConsoleWebhooksListDeliveriesResponse>({
      method: 'get',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/webhooks/deliveries`,
    });
  }
  /** Sends a POST request to /v1/console/organizations/{organizationId}/webhooks/deliveries/{id}/replay. */
  replayDelivery(input: {
    organizationId: string;
    id: string;
  }): Promise<OctapResponse<OpenApi.WebhookDeliveryWithEvent>> {
    return this.request<OpenApi.WebhookDeliveryWithEvent>({
      method: 'post',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/webhooks/deliveries/${encodeURIComponent(input.id)}/replay`,
    });
  }
  /** Sends a GET request to /v1/console/organizations/{organizationId}/events. */
  stream(input: { organizationId: string; lastEventID?: string }): Promise<OctapResponse<unknown>> {
    return this.request<unknown>({
      method: 'get',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/events`,
      headers: {
        ...(input.lastEventID !== undefined ? { 'Last-Event-ID': input.lastEventID } : {}),
      },
    });
  }
  /** Sends a GET request to /v1/console/organizations/{organizationId}/api-credentials. */
  listApiCredentials(input: {
    organizationId: string;
  }): Promise<OctapResponse<OpenApi.ConsoleApiCredentialsListResponse>> {
    return this.request<OpenApi.ConsoleApiCredentialsListResponse>({
      method: 'get',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/api-credentials`,
    });
  }
  /** Sends a POST request to /v1/console/organizations/{organizationId}/api-credentials. */
  issue(input: {
    organizationId: string;
    body: OpenApi.ConsoleApiCredentialsIssueInput;
  }): Promise<OctapResponse<OpenApi.ConsoleApiCredentialsIssueResponse>> {
    return this.request<OpenApi.ConsoleApiCredentialsIssueResponse>({
      method: 'post',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/api-credentials`,
      data: input.body,
    });
  }
  /** Sends a PATCH request to /v1/console/organizations/{organizationId}/api-credentials/{id}. */
  rename(input: {
    organizationId: string;
    id: string;
    body: OpenApi.ConsoleApiCredentialsRenameInput;
  }): Promise<OctapResponse<OpenApi.ConsoleApiCredentialsRenameResponse>> {
    return this.request<OpenApi.ConsoleApiCredentialsRenameResponse>({
      method: 'patch',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/api-credentials/${encodeURIComponent(input.id)}`,
      data: input.body,
    });
  }
  /** Sends a DELETE request to /v1/console/organizations/{organizationId}/api-credentials/{id}. */
  revoke(input: {
    organizationId: string;
    id: string;
  }): Promise<OctapResponse<OpenApi.ConsoleApiCredentialsRevokeResponse>> {
    return this.request<OpenApi.ConsoleApiCredentialsRevokeResponse>({
      method: 'delete',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/api-credentials/${encodeURIComponent(input.id)}`,
    });
  }
  /** Sends a POST request to /v1/console/auth/google. */
  login(
    input: OpenApi.ConsoleIdentityLoginInput,
  ): Promise<OctapResponse<OpenApi.ConsoleIdentityLoginResponse>> {
    return this.request<OpenApi.ConsoleIdentityLoginResponse>({
      method: 'post',
      url: `/v1/console/auth/google`,
      data: input,
    });
  }
  /** Sends a GET request to /v1/console/me. */
  me(): Promise<OctapResponse<OpenApi.ConsoleIdentityMeResponse>> {
    return this.request<OpenApi.ConsoleIdentityMeResponse>({
      method: 'get',
      url: `/v1/console/me`,
    });
  }
  /** Sends a POST request to /v1/console/organization-requests. */
  apply(
    input: OpenApi.ConsoleOrganizationsApplyInput,
  ): Promise<OctapResponse<OpenApi.ConsoleOrganizationsApplyResponse>> {
    return this.request<OpenApi.ConsoleOrganizationsApplyResponse>({
      method: 'post',
      url: `/v1/console/organization-requests`,
      data: input,
    });
  }
  /** Sends a GET request to /v1/console/organization-requests. */
  applications(): Promise<OctapResponse<OpenApi.ConsoleOrganizationsApplicationsResponse>> {
    return this.request<OpenApi.ConsoleOrganizationsApplicationsResponse>({
      method: 'get',
      url: `/v1/console/organization-requests`,
    });
  }
  /** Sends a GET request to /v1/console/organizations/{organizationId}. */
  organization(input: {
    organizationId: string;
  }): Promise<OctapResponse<OpenApi.ConsoleOrganizationsOrganizationResponse>> {
    return this.request<OpenApi.ConsoleOrganizationsOrganizationResponse>({
      method: 'get',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}`,
    });
  }
  /** Sends a PATCH request to /v1/console/organizations/{organizationId}/profile. */
  profile(input: {
    organizationId: string;
    body: OpenApi.ConsoleOrganizationsProfileInput;
  }): Promise<OctapResponse<OpenApi.ConsoleOrganizationsProfileResponse>> {
    return this.request<OpenApi.ConsoleOrganizationsProfileResponse>({
      method: 'patch',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/profile`,
      data: input.body,
    });
  }
  /** Sends a PATCH request to /v1/console/organizations/{organizationId}/settings. */
  settings(input: {
    organizationId: string;
    body: OpenApi.ConsoleOrganizationsSettingsInput;
  }): Promise<OctapResponse<OpenApi.ConsoleOrganizationsSettingsResponse>> {
    return this.request<OpenApi.ConsoleOrganizationsSettingsResponse>({
      method: 'patch',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/settings`,
      data: input.body,
    });
  }
  /** Sends a GET request to /v1/console/organizations/{organizationId}/staff. */
  staff(input: {
    organizationId: string;
  }): Promise<OctapResponse<OpenApi.ConsoleOrganizationsStaffResponse>> {
    return this.request<OpenApi.ConsoleOrganizationsStaffResponse>({
      method: 'get',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/staff`,
    });
  }
  /** Sends a PATCH request to /v1/console/organizations/{organizationId}/staff/{userId}. */
  staffAccess(input: {
    organizationId: string;
    userId: string;
    body: OpenApi.ConsoleOrganizationsStaffAccessInput;
  }): Promise<OctapResponse<OpenApi.ConsoleOrganizationsStaffAccessResponse>> {
    return this.request<OpenApi.ConsoleOrganizationsStaffAccessResponse>({
      method: 'patch',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/staff/${encodeURIComponent(input.userId)}`,
      data: input.body,
    });
  }
  /** Sends a POST request to /v1/console/organizations/{organizationId}/invitations. */
  invite(input: {
    organizationId: string;
    body: OpenApi.ConsoleOrganizationsInviteInput;
  }): Promise<OctapResponse<OpenApi.ConsoleOrganizationsInviteResponse>> {
    return this.request<OpenApi.ConsoleOrganizationsInviteResponse>({
      method: 'post',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/invitations`,
      data: input.body,
    });
  }
  /** Sends a GET request to /v1/console/organizations/{organizationId}/invitations. */
  invitations(input: {
    organizationId: string;
  }): Promise<OctapResponse<OpenApi.ConsoleOrganizationsInvitationsResponse>> {
    return this.request<OpenApi.ConsoleOrganizationsInvitationsResponse>({
      method: 'get',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/invitations`,
    });
  }
  /** Sends a POST request to /v1/console/organizations/{organizationId}/invitations/{id}/revoke. */
  revokeOrganizations(input: {
    organizationId: string;
    id: string;
  }): Promise<OctapResponse<OpenApi.ConsoleOrganizationsRevokeResponse>> {
    return this.request<OpenApi.ConsoleOrganizationsRevokeResponse>({
      method: 'post',
      url: `/v1/console/organizations/${encodeURIComponent(input.organizationId)}/invitations/${encodeURIComponent(input.id)}/revoke`,
    });
  }
  /** Sends a POST request to /v1/console/invitations/{token}/accept. */
  accept(input: {
    token: string;
  }): Promise<OctapResponse<OpenApi.ConsoleOrganizationsAcceptResponse>> {
    return this.request<OpenApi.ConsoleOrganizationsAcceptResponse>({
      method: 'post',
      url: `/v1/console/invitations/${encodeURIComponent(input.token)}/accept`,
    });
  }
}
