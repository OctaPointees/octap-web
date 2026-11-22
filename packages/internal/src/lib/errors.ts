/** Why an SDK call failed. */
export type OctapErrorCode =
  /** Core answered with a non-2xx status; see `status` and `body`. */
  | 'HTTP_ERROR'
  /** No response arrived: offline, CORS, DNS, or the 30 second timeout. */
  | 'NETWORK_ERROR';

/**
 * Error returned by every SDK method. Like `ConsoleApiError` in `@octap/shared`, it is a plain
 * `Error` plus the HTTP status, so callers can tell 400 from 403 without a transport-specific type.
 */
export class OctapError extends Error {
  override readonly name = 'OctapError';

  constructor(
    message: string,
    readonly code: OctapErrorCode,
    /** HTTP status, or `null` when no response arrived. */
    readonly status: number | null = null,
    /** Parsed response body (JSON when possible, otherwise text), or `null`. */
    readonly body: unknown = null,
  ) {
    super(message);
  }
}
