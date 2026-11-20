import type { OctapResponse } from '../types.js';
import { ApiGroup } from '../lib/api-group.js';
import type { HttpClient } from '../lib/http.js';
import type * as OpenApi from './openapi.js';

/** OpenAPI endpoint methods for the credits API group. */
export class CreditsApi extends ApiGroup {
  constructor(http: HttpClient) {
    super(http);
  }
  /** Sends a POST request to /v1/credits/earn. */
  earn(input: {
    organizationId?: string;
    body: OpenApi.CreditsEarnInput;
  }): Promise<OctapResponse<OpenApi.CreditsEarnResponse>> {
    return this.request<OpenApi.CreditsEarnResponse>({
      method: 'post',
      url: `/v1/credits/earn`,
      headers: {
        ...(input.organizationId !== undefined
          ? { 'X-Organization-Id': input.organizationId }
          : {}),
      },
      data: input.body,
    });
  }
  /** Sends a POST request to /v1/credits/redeem/reserve. */
  reservePosRedemption(input: {
    organizationId?: string;
    body: OpenApi.CreditsReservePosRedemptionInput;
  }): Promise<OctapResponse<OpenApi.CreditsReservePosRedemptionResponse>> {
    return this.request<OpenApi.CreditsReservePosRedemptionResponse>({
      method: 'post',
      url: `/v1/credits/redeem/reserve`,
      headers: {
        ...(input.organizationId !== undefined
          ? { 'X-Organization-Id': input.organizationId }
          : {}),
      },
      data: input.body,
    });
  }
  /** Sends a POST request to /v1/credits/redeem/finalize. */
  finalizePosRedemption(
    input: OpenApi.CreditsFinalizePosRedemptionInput,
  ): Promise<OctapResponse<OpenApi.CreditsFinalizePosRedemptionResponse>> {
    return this.request<OpenApi.CreditsFinalizePosRedemptionResponse>({
      method: 'post',
      url: `/v1/credits/redeem/finalize`,
      data: input,
    });
  }
  /** Sends a POST request to /v1/credits/transactions/{transactionId}/reverse. */
  reverseTransaction(input: {
    transactionId: string;
    organizationId?: string;
    body: OpenApi.CreditsReverseTransactionInput;
  }): Promise<OctapResponse<OpenApi.CreditsReverseTransactionResponse>> {
    return this.request<OpenApi.CreditsReverseTransactionResponse>({
      method: 'post',
      url: `/v1/credits/transactions/${encodeURIComponent(input.transactionId)}/reverse`,
      headers: {
        ...(input.organizationId !== undefined
          ? { 'X-Organization-Id': input.organizationId }
          : {}),
      },
      data: input.body,
    });
  }
  /** Sends a GET request to /v1/credits/budget. */
  getBudget(input: {
    organizationId?: string;
  }): Promise<OctapResponse<OpenApi.CreditsGetBudgetResponse>> {
    return this.request<OpenApi.CreditsGetBudgetResponse>({
      method: 'get',
      url: `/v1/credits/budget`,
      headers: {
        ...(input.organizationId !== undefined
          ? { 'X-Organization-Id': input.organizationId }
          : {}),
      },
    });
  }
  /** Sends a GET request to /v1/credits/members/{memberId}/balance. */
  getBalance(input: {
    memberId: string;
    programId?: string;
    organizationId?: string;
  }): Promise<OctapResponse<OpenApi.CreditsGetBalanceResponse>> {
    return this.request<OpenApi.CreditsGetBalanceResponse>({
      method: 'get',
      url: `/v1/credits/members/${encodeURIComponent(input.memberId)}/balance`,
      params: {
        programId: input.programId,
      },
      headers: {
        ...(input.organizationId !== undefined
          ? { 'X-Organization-Id': input.organizationId }
          : {}),
      },
    });
  }
  /** Sends a GET request to /v1/credits/members/{memberId}/transactions. */
  getTransactions(input: {
    memberId: string;
    limit?: string;
    cursor?: string;
    organizationId?: string;
  }): Promise<OctapResponse<OpenApi.CreditsGetTransactionsResponse>> {
    return this.request<OpenApi.CreditsGetTransactionsResponse>({
      method: 'get',
      url: `/v1/credits/members/${encodeURIComponent(input.memberId)}/transactions`,
      params: {
        limit: input.limit,
        cursor: input.cursor,
      },
      headers: {
        ...(input.organizationId !== undefined
          ? { 'X-Organization-Id': input.organizationId }
          : {}),
      },
    });
  }
}
