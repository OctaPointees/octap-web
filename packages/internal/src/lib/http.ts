import type { OctapResponse } from '../types.js';
import { OctapError } from './errors.js';

type QueryValue = string | number | boolean | null | undefined;

/** One request as the generated endpoint classes describe it. */
export interface RequestConfig {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  /** Path relative to the API origin, already URL-encoded. */
  url: string;
  /** Query parameters; `undefined` and `null` values are left out. */
  params?: Record<string, QueryValue | readonly QueryValue[]>;
  headers?: Record<string, string>;
  /** JSON request body. */
  data?: unknown;
}

const REQUEST_TIMEOUT_MS = 30_000;

/** Shared `fetch` transport and response normalization. */
export class HttpClient {
  private readonly baseUrl: string;

  constructor(
    apiBaseUrl: string,
    /** Returns the current bearer token, or `null` when signed out. */
    private readonly getAccessToken: () => string | null,
    /** Called when Core rejects a request that carried a token. */
    private readonly onUnauthorized?: () => void,
  ) {
    this.baseUrl = apiBaseUrl.replace(/\/+$/, '');
  }

  /** Sends a request and converts success or failure to the common result shape. */
  async request<T>(config: RequestConfig): Promise<OctapResponse<T>> {
    const token = this.getAccessToken();
    let response: Response;
    try {
      response = await fetch(this.buildUrl(config), {
        method: config.method.toUpperCase(),
        cache: 'no-store',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          Accept: 'application/json',
          ...(config.data !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...config.headers,
          ...(token !== null ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(config.data !== undefined ? { body: JSON.stringify(config.data) } : {}),
      });
    } catch (error: unknown) {
      return {
        data: null,
        error: new OctapError(
          error instanceof Error ? error.message : String(error),
          'NETWORK_ERROR',
        ),
      };
    }

    if (response.status === 401 && token !== null) {
      try {
        this.onUnauthorized?.();
      } catch {
        // The app's handler failing must not hide the 401 from the caller.
      }
    }

    const body = await readBody(response);
    if (!response.ok) {
      const message =
        typeof body === 'object' && body !== null && 'message' in body
          ? String(body.message)
          : `Core request failed (${response.status}).`;
      return { data: null, error: new OctapError(message, 'HTTP_ERROR', response.status, body) };
    }
    return { data: body as T, error: null };
  }

  private buildUrl({ url, params }: RequestConfig): string {
    const query = new URLSearchParams();
    for (const [name, value] of Object.entries(params ?? {})) {
      for (const item of Array.isArray(value) ? value : [value]) {
        if (item !== undefined && item !== null) query.append(name, String(item));
      }
    }
    const search = query.toString();
    return `${this.baseUrl}${url}${search === '' ? '' : `?${search}`}`;
  }
}

/** Parses JSON when possible, falls back to text, and returns `null` for an empty body. */
async function readBody(response: Response): Promise<unknown> {
  const text = await response.text().catch(() => '');
  if (text === '') return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
