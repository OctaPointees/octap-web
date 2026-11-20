import type { OctapResponse } from '../types.js';
import { ApiGroup } from '../lib/api-group.js';
import type { HttpClient } from '../lib/http.js';
import type * as OpenApi from './openapi.js';

/** OpenAPI endpoint methods for the health API group. */
export class HealthApi extends ApiGroup {
  constructor(http: HttpClient) { super(http); }
  /** Sends a GET request to /health. */
  check(): Promise<OctapResponse<OpenApi.HealthCheckResponse>> {
    return this.request<OpenApi.HealthCheckResponse>({
      method: 'get',
      url: `/health`,
    });
  }
}