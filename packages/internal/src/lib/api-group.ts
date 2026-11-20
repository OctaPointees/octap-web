import type { AxiosRequestConfig } from 'axios';
import type { HttpClient } from './http.js';
import type { OctapResponse } from '../types.js';

/** Base class for endpoint groups. */
export abstract class ApiGroup {
  constructor(protected readonly http: HttpClient) {}

  protected request<T>(config: AxiosRequestConfig): Promise<OctapResponse<T>> {
    return this.http.request<T>(config);
  }
}
