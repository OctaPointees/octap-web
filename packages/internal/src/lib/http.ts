import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import type { OctapError, OctapResponse } from '../types.js';
import type { SessionStorage } from './storage.js';

/** Shared Axios transport and response normalization. */
export class HttpClient {
  private readonly axios: AxiosInstance;

  constructor(apiUrl: string, private readonly sessionStorage: SessionStorage) {
    this.axios = axios.create({
      baseURL: apiUrl.replace(/\/+$/, ''),
      headers: { Accept: 'application/json' },
    });

    this.axios.interceptors.request.use((config) => {
      const token = this.sessionStorage.getSession()?.accessToken;
      if (token !== undefined) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
      return config;
    });
  }

  /** Sends a request and converts success or failure to the common result shape. */
  async request<T>(config: AxiosRequestConfig): Promise<OctapResponse<T>> {
    try {
      const response = await this.axios.request<T>(config);
      return { data: response.data, error: null };
    } catch (error: unknown) {
      return {
        data: null,
        error: (axios.isAxiosError(error)
          ? error
          : new AxiosError(String(error), 'ERR_UNKNOWN')) as OctapError<T>,
      };
    }
  }
}
