import type { OctapResponse } from '../types.js';
import { ApiGroup } from '../lib/api-group.js';
import type { HttpClient } from '../lib/http.js';
import type * as OpenApi from './openapi.js';

/** OpenAPI endpoint methods for the platform API group. */
export class PlatformApi extends ApiGroup {
  constructor(http: HttpClient) { super(http); }
  /** Sends a GET request to /v1/platform/health. */
  report(): Promise<OctapResponse<OpenApi.PlatformHealthReportResponse>> {
    return this.request<OpenApi.PlatformHealthReportResponse>({
      method: 'get',
      url: `/v1/platform/health`,
    });
  }
  /** Sends a GET request to /v1/platform/organizations. */
  listOrganizations(input: {
  limit?: number;
  cursor?: string;
  status?: 'ACTIVE' | 'ARCHIVED' | 'PENDING_APPROVAL' | 'SUSPENDED';
  q?: string;
}): Promise<OctapResponse<OpenApi.PlatformOrganizationsListResponse>> {
    return this.request<OpenApi.PlatformOrganizationsListResponse>({
      method: 'get',
      url: `/v1/platform/organizations`,
        params: {
          limit: input.limit,
          cursor: input.cursor,
          status: input.status,
          q: input.q,
        },
    });
  }
  /** Sends a POST request to /v1/platform/organizations. */
  createOrganizations(input: OpenApi.PlatformOrganizationsCreateInput): Promise<OctapResponse<OpenApi.PlatformOrganizationsCreateResponse>> {
    return this.request<OpenApi.PlatformOrganizationsCreateResponse>({
      method: 'post',
      url: `/v1/platform/organizations`,
      data: input,
    });
  }
  /** Sends a GET request to /v1/platform/organizations/{id}. */
  detailOrganizations(input: {
  id: string;
}): Promise<OctapResponse<OpenApi.PlatformOrganizationsDetailResponse>> {
    return this.request<OpenApi.PlatformOrganizationsDetailResponse>({
      method: 'get',
      url: `/v1/platform/organizations/${encodeURIComponent(input.id)}`,
    });
  }
  /** Sends a GET request to /v1/platform/owner-candidates. */
  owners(input: {
  q?: string;
}): Promise<OctapResponse<OpenApi.PlatformOrganizationsOwnersResponse>> {
    return this.request<OpenApi.PlatformOrganizationsOwnersResponse>({
      method: 'get',
      url: `/v1/platform/owner-candidates`,
        params: {
          q: input.q,
        },
    });
  }
  /** Sends a POST request to /v1/platform/organizations/{id}/provision. */
  provisionOrganizations(input: {
  id: string;
  body: OpenApi.PlatformOrganizationsProvisionInput;
}): Promise<OctapResponse<OpenApi.PlatformOrganizationsProvisionResponse>> {
    return this.request<OpenApi.PlatformOrganizationsProvisionResponse>({
      method: 'post',
      url: `/v1/platform/organizations/${encodeURIComponent(input.id)}/provision`,
      data: input.body,
    });
  }
  /** Sends a GET request to /v1/platform/organizations/{organizationId}/budget. */
  readIssuanceBudget(input: {
  organizationId: string;
}): Promise<OctapResponse<OpenApi.PlatformIssuanceBudgetReadResponse>> {
    return this.request<OpenApi.PlatformIssuanceBudgetReadResponse>({
      method: 'get',
      url: `/v1/platform/organizations/${encodeURIComponent(input.organizationId)}/budget`,
    });
  }
  /** Sends a GET request to /v1/platform/change-requests. */
  listChangeRequests(input: {
  limit?: number;
  cursor?: string;
  status?: 'APPROVED' | 'CANCELLED' | 'PENDING' | 'REJECTED';
  organizationId?: string;
}): Promise<OctapResponse<OpenApi.PlatformChangeRequestsListResponse>> {
    return this.request<OpenApi.PlatformChangeRequestsListResponse>({
      method: 'get',
      url: `/v1/platform/change-requests`,
        params: {
          limit: input.limit,
          cursor: input.cursor,
          status: input.status,
          organizationId: input.organizationId,
        },
    });
  }
  /** Sends a POST request to /v1/platform/organizations/{organizationId}/change-requests. */
  propose(input: {
  organizationId: string;
  body: OpenApi.PlatformChangeRequestsProposeInput;
}): Promise<OctapResponse<OpenApi.PlatformChangeRequestsProposeResponse>> {
    return this.request<OpenApi.PlatformChangeRequestsProposeResponse>({
      method: 'post',
      url: `/v1/platform/organizations/${encodeURIComponent(input.organizationId)}/change-requests`,
      data: input.body,
    });
  }
  /** Sends a POST request to /v1/platform/change-requests/{id}/approve. */
  approve(input: {
  id: string;
  body: OpenApi.PlatformChangeRequestsApproveInput;
}): Promise<OctapResponse<OpenApi.PlatformChangeRequestsApproveResponse>> {
    return this.request<OpenApi.PlatformChangeRequestsApproveResponse>({
      method: 'post',
      url: `/v1/platform/change-requests/${encodeURIComponent(input.id)}/approve`,
      data: input.body,
    });
  }
  /** Sends a POST request to /v1/platform/change-requests/{id}/reject. */
  reject(input: {
  id: string;
  body: OpenApi.PlatformChangeRequestsRejectInput;
}): Promise<OctapResponse<OpenApi.PlatformChangeRequestsRejectResponse>> {
    return this.request<OpenApi.PlatformChangeRequestsRejectResponse>({
      method: 'post',
      url: `/v1/platform/change-requests/${encodeURIComponent(input.id)}/reject`,
      data: input.body,
    });
  }
  /** Sends a GET request to /v1/platform/organization-requests. */
  listOrganizationRequests(): Promise<OctapResponse<OpenApi.PlatformOrganizationRequestsListResponse>> {
    return this.request<OpenApi.PlatformOrganizationRequestsListResponse>({
      method: 'get',
      url: `/v1/platform/organization-requests`,
    });
  }
  /** Sends a POST request to /v1/platform/organization-requests/{id}/approve. */
  approveOrganizationRequests(input: {
  id: string;
  body: OpenApi.PlatformOrganizationRequestsApproveInput;
}): Promise<OctapResponse<OpenApi.PlatformOrganizationRequestsApproveResponse>> {
    return this.request<OpenApi.PlatformOrganizationRequestsApproveResponse>({
      method: 'post',
      url: `/v1/platform/organization-requests/${encodeURIComponent(input.id)}/approve`,
      data: input.body,
    });
  }
  /** Sends a POST request to /v1/platform/organization-requests/{id}/reject. */
  rejectOrganizationRequests(input: {
  id: string;
  body: OpenApi.PlatformOrganizationRequestsRejectInput;
}): Promise<OctapResponse<OpenApi.PlatformOrganizationRequestsRejectResponse>> {
    return this.request<OpenApi.PlatformOrganizationRequestsRejectResponse>({
      method: 'post',
      url: `/v1/platform/organization-requests/${encodeURIComponent(input.id)}/reject`,
      data: input.body,
    });
  }
  /** Sends a POST request to /v1/platform/organizations/{organizationId}/owner. */
  bootstrap(input: {
  organizationId: string;
  body: OpenApi.PlatformOrganizationOwnersBootstrapInput;
}): Promise<OctapResponse<OpenApi.PlatformOrganizationOwnersBootstrapResponse>> {
    return this.request<OpenApi.PlatformOrganizationOwnersBootstrapResponse>({
      method: 'post',
      url: `/v1/platform/organizations/${encodeURIComponent(input.organizationId)}/owner`,
      data: input.body,
    });
  }
}