import type { OctapResponse } from '../types.js';
import { ApiGroup } from '../lib/api-group.js';
import type { HttpClient } from '../lib/http.js';
import type * as OpenApi from './openapi.js';

/** OpenAPI endpoint methods for the organizations API group. */
export class OrganizationsApi extends ApiGroup {
  constructor(http: HttpClient) {
    super(http);
  }
  /** Sends a GET request to /v1/organizations/resolve/{slug}. */
  resolve(input: {
    slug: string;
  }): Promise<OctapResponse<OpenApi.OrganizationResolutionResolveResponse>> {
    return this.request<OpenApi.OrganizationResolutionResolveResponse>({
      method: 'get',
      url: `/v1/organizations/resolve/${encodeURIComponent(input.slug)}`,
    });
  }
}
