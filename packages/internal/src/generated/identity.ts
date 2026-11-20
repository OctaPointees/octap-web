import type { OctapResponse } from '../types.js';
import { ApiGroup } from '../lib/api-group.js';
import type { HttpClient } from '../lib/http.js';
import type * as OpenApi from './openapi.js';

/** OpenAPI endpoint methods for the identity API group. */
export class IdentityApi extends ApiGroup {
  constructor(http: HttpClient) { super(http); }
  /** Sends a POST request to /v1/identity/google-login. */
  googleLogin(input: OpenApi.IdentityGoogleLoginInput): Promise<OctapResponse<OpenApi.IdentityGoogleLoginResponse>> {
    return this.request<OpenApi.IdentityGoogleLoginResponse>({
      method: 'post',
      url: `/v1/identity/google-login`,
      data: input,
    });
  }
  /** Sends a POST request to /v1/identity/organizations/{organizationId}/enroll. */
  enroll(input: {
  organizationId: string;
  body: OpenApi.IdentityEnrollInput;
}): Promise<OctapResponse<OpenApi.IdentityEnrollResponse>> {
    return this.request<OpenApi.IdentityEnrollResponse>({
      method: 'post',
      url: `/v1/identity/organizations/${encodeURIComponent(input.organizationId)}/enroll`,
      data: input.body,
    });
  }
  /** Sends a POST request to /v1/identity/zklogin/nonce. */
  createNonce(input: OpenApi.IdentityCreateNonceInput): Promise<OctapResponse<OpenApi.IdentityCreateNonceResponse>> {
    return this.request<OpenApi.IdentityCreateNonceResponse>({
      method: 'post',
      url: `/v1/identity/zklogin/nonce`,
      data: input,
    });
  }
  /** Sends a POST request to /v1/identity/zklogin/proof. */
  createProof(input: OpenApi.IdentityCreateProofInput): Promise<OctapResponse<OpenApi.IdentityCreateProofResponse>> {
    return this.request<OpenApi.IdentityCreateProofResponse>({
      method: 'post',
      url: `/v1/identity/zklogin/proof`,
      data: input,
    });
  }
  /** Sends a POST request to /v1/identity/verify. */
  verify(input: {
  organizationId?: string;
  body: OpenApi.CustomerVerificationVerifyInput;
}): Promise<OctapResponse<OpenApi.CustomerVerificationVerifyResponse>> {
    return this.request<OpenApi.CustomerVerificationVerifyResponse>({
      method: 'post',
      url: `/v1/identity/verify`,
        headers: {
          ...(input.organizationId !== undefined ? { 'X-Organization-Id': input.organizationId } : {}),
        },
      data: input.body,
    });
  }
}