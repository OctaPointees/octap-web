import type { HttpClient, RequestConfig } from './http.js';
import type { OctapResponse } from '../types.js';

/** Base class for endpoint groups. */
export abstract class ApiGroup {
  constructor(protected readonly http: HttpClient) {}

  protected request<T>(config: RequestConfig): Promise<OctapResponse<T>> {
    return this.http.request<T>(config);
  }
}
