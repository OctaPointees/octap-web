import type { OctapResponse } from '../types.js';
import { ApiGroup } from '../lib/api-group.js';
import type { HttpClient } from '../lib/http.js';
import type * as OpenApi from './openapi.js';

/** OpenAPI endpoint methods for the webhooks API group. */
export class WebhooksApi extends ApiGroup {
  constructor(http: HttpClient) {
    super(http);
  }
  /** Sends a GET request to /v1/webhooks/endpoints. */
  listEndpoints(input: {
    organizationId?: string;
  }): Promise<OctapResponse<OpenApi.WebhooksListEndpointsResponse>> {
    return this.request<OpenApi.WebhooksListEndpointsResponse>({
      method: 'get',
      url: `/v1/webhooks/endpoints`,
      headers: {
        ...(input.organizationId !== undefined
          ? { 'X-Organization-Id': input.organizationId }
          : {}),
      },
    });
  }
  /** Sends a GET request to /v1/webhooks/deliveries. */
  listDeliveries(input: {
    organizationId?: string;
  }): Promise<OctapResponse<OpenApi.WebhooksListDeliveriesResponse>> {
    return this.request<OpenApi.WebhooksListDeliveriesResponse>({
      method: 'get',
      url: `/v1/webhooks/deliveries`,
      headers: {
        ...(input.organizationId !== undefined
          ? { 'X-Organization-Id': input.organizationId }
          : {}),
      },
    });
  }
}
