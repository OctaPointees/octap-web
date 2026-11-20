import type { OctapResponse } from '../types.js';
import { ApiGroup } from '../lib/api-group.js';
import type { HttpClient } from '../lib/http.js';
import type * as OpenApi from './openapi.js';

/** OpenAPI endpoint methods for the rewards API group. */
export class RewardsApi extends ApiGroup {
  constructor(http: HttpClient) { super(http); }
  /** Sends a GET request to /v1/rewards/refund-policy. */
  getRefundPolicy(input: {
  organizationId?: string;
}): Promise<OctapResponse<OpenApi.VoucherRefundPolicyDto>> {
    return this.request<OpenApi.VoucherRefundPolicyDto>({
      method: 'get',
      url: `/v1/rewards/refund-policy`,
        headers: {
          ...(input.organizationId !== undefined ? { 'X-Organization-Id': input.organizationId } : {}),
        },
    });
  }
  /** Sends a GET request to /v1/rewards/refund-policy/history. */
  getRefundPolicyHistory(input: {
  limit?: number;
  beforeVersion?: number;
  organizationId?: string;
}): Promise<OctapResponse<OpenApi.RewardsGetRefundPolicyHistoryResponse>> {
    return this.request<OpenApi.RewardsGetRefundPolicyHistoryResponse>({
      method: 'get',
      url: `/v1/rewards/refund-policy/history`,
        params: {
          limit: input.limit,
          beforeVersion: input.beforeVersion,
        },
        headers: {
          ...(input.organizationId !== undefined ? { 'X-Organization-Id': input.organizationId } : {}),
        },
    });
  }
  /** Sends a POST request to /v1/rewards/vouchers. */
  createVoucher(input: {
  organizationId?: string;
  body: OpenApi.RewardsCreateVoucherInput;
}): Promise<OctapResponse<OpenApi.VoucherDto>> {
    return this.request<OpenApi.VoucherDto>({
      method: 'post',
      url: `/v1/rewards/vouchers`,
        headers: {
          ...(input.organizationId !== undefined ? { 'X-Organization-Id': input.organizationId } : {}),
        },
      data: input.body,
    });
  }
  /** Sends a GET request to /v1/rewards/vouchers. */
  listVouchers(input: {
  organizationId?: string;
}): Promise<OctapResponse<OpenApi.RewardsListVouchersResponse>> {
    return this.request<OpenApi.RewardsListVouchersResponse>({
      method: 'get',
      url: `/v1/rewards/vouchers`,
        headers: {
          ...(input.organizationId !== undefined ? { 'X-Organization-Id': input.organizationId } : {}),
        },
    });
  }
  /** Sends a GET request to /v1/rewards/vouchers/{id}. */
  getVoucher(input: {
  id: string;
  organizationId?: string;
}): Promise<OctapResponse<OpenApi.VoucherDto>> {
    return this.request<OpenApi.VoucherDto>({
      method: 'get',
      url: `/v1/rewards/vouchers/${encodeURIComponent(input.id)}`,
        headers: {
          ...(input.organizationId !== undefined ? { 'X-Organization-Id': input.organizationId } : {}),
        },
    });
  }
  /** Sends a PATCH request to /v1/rewards/vouchers/{id}. */
  updateVoucher(input: {
  id: string;
  organizationId?: string;
  body: OpenApi.RewardsUpdateVoucherInput;
}): Promise<OctapResponse<OpenApi.VoucherDto>> {
    return this.request<OpenApi.VoucherDto>({
      method: 'patch',
      url: `/v1/rewards/vouchers/${encodeURIComponent(input.id)}`,
        headers: {
          ...(input.organizationId !== undefined ? { 'X-Organization-Id': input.organizationId } : {}),
        },
      data: input.body,
    });
  }
  /** Sends a POST request to /v1/rewards/vouchers/{id}/claim. */
  claimVoucher(input: {
  id: string;
  organizationId?: string;
  body: OpenApi.RewardsClaimVoucherInput;
}): Promise<OctapResponse<OpenApi.RewardsClaimVoucherResponse>> {
    return this.request<OpenApi.RewardsClaimVoucherResponse>({
      method: 'post',
      url: `/v1/rewards/vouchers/${encodeURIComponent(input.id)}/claim`,
        headers: {
          ...(input.organizationId !== undefined ? { 'X-Organization-Id': input.organizationId } : {}),
        },
      data: input.body,
    });
  }
  /** Sends a GET request to /v1/rewards/claims/{id}. */
  getClaim(input: {
  id: string;
  organizationId?: string;
}): Promise<OctapResponse<OpenApi.RewardsGetClaimResponse>> {
    return this.request<OpenApi.RewardsGetClaimResponse>({
      method: 'get',
      url: `/v1/rewards/claims/${encodeURIComponent(input.id)}`,
        headers: {
          ...(input.organizationId !== undefined ? { 'X-Organization-Id': input.organizationId } : {}),
        },
    });
  }
  /** Sends a POST request to /v1/rewards/vouchers/{id}/grant. */
  grantVoucher(input: {
  id: string;
  organizationId?: string;
  body: OpenApi.RewardsGrantVoucherInput;
}): Promise<OctapResponse<OpenApi.RewardsGrantVoucherResponse>> {
    return this.request<OpenApi.RewardsGrantVoucherResponse>({
      method: 'post',
      url: `/v1/rewards/vouchers/${encodeURIComponent(input.id)}/grant`,
        headers: {
          ...(input.organizationId !== undefined ? { 'X-Organization-Id': input.organizationId } : {}),
        },
      data: input.body,
    });
  }
  /** Sends a POST request to /v1/rewards/vouchers/use. */
  prepareVoucherUse(input: {
  organizationId?: string;
  body: OpenApi.RewardsPrepareVoucherUseInput;
}): Promise<OctapResponse<OpenApi.RewardsPrepareVoucherUseResponse>> {
    return this.request<OpenApi.RewardsPrepareVoucherUseResponse>({
      method: 'post',
      url: `/v1/rewards/vouchers/use`,
        headers: {
          ...(input.organizationId !== undefined ? { 'X-Organization-Id': input.organizationId } : {}),
        },
      data: input.body,
    });
  }
  /** Sends a POST request to /v1/rewards/vouchers/use/finalize. */
  finalizeVoucherUse(input: OpenApi.RewardsFinalizeVoucherUseInput): Promise<OctapResponse<OpenApi.RewardsFinalizeVoucherUseResponse>> {
    return this.request<OpenApi.RewardsFinalizeVoucherUseResponse>({
      method: 'post',
      url: `/v1/rewards/vouchers/use/finalize`,
      data: input,
    });
  }
  /** Sends a GET request to /v1/rewards/members/{memberId}/vouchers. */
  listMemberVouchers(input: {
  memberId: string;
  organizationId?: string;
}): Promise<OctapResponse<OpenApi.RewardsListMemberVouchersResponse>> {
    return this.request<OpenApi.RewardsListMemberVouchersResponse>({
      method: 'get',
      url: `/v1/rewards/members/${encodeURIComponent(input.memberId)}/vouchers`,
        headers: {
          ...(input.organizationId !== undefined ? { 'X-Organization-Id': input.organizationId } : {}),
        },
    });
  }
}