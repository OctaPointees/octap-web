import { OctapError, type HealthCheckResponse } from '@octap/internal-sdk';

export type SystemState = 'checking' | 'ok' | 'degraded' | 'down' | 'offline' | 'unknown';

/** In plain words: merchants don't need to know which piece of infrastructure is involved. */
export const SYSTEM_STATES: Record<SystemState, { title: string; detail: string }> = {
  checking: { title: 'Checking status', detail: 'Asking OctaP how it is doing.' },
  ok: { title: 'All systems normal', detail: 'OctaP and the blockchain are responding.' },
  degraded: { title: 'Blockchain delayed', detail: 'New rewards and points may take longer.' },
  down: { title: 'OctaP is unavailable', detail: 'Some actions won’t work until it’s back.' },
  offline: { title: 'You’re offline', detail: 'Changes won’t save until you reconnect.' },
  unknown: {
    title: 'Status unavailable',
    detail: 'The status check didn’t answer. Everything else may still be working.',
  },
};

/** A health report, or null for anything else, like a page from a proxy that skips `/health`. */
export function readHealth(value: unknown): HealthCheckResponse | null {
  if (typeof value !== 'object' || value === null) return null;
  const report = value as Partial<HealthCheckResponse>;
  const known = report.status === 'ok' || report.status === 'degraded' || report.status === 'down';
  return known && report.checks ? (report as HealthCheckResponse) : null;
}

/**
 * What to tell the user. No response or a 5xx means OctaP can't be reached. Any other failure says
 * nothing about OctaP itself, so it is reported as unknown instead of raising an alarm.
 */
export function systemState({
  online,
  pending,
  report,
  error,
}: {
  online: boolean;
  pending: boolean;
  report: HealthCheckResponse | null;
  error: unknown;
}): SystemState {
  if (!online) return 'offline';
  if (error) {
    const status = error instanceof OctapError ? error.status : null;
    return status === null || status >= 500 ? 'down' : 'unknown';
  }
  if (pending) return 'checking';
  return report?.status ?? 'unknown';
}

/** How long ago, for the status bar. `now` is passed in so it can tick. */
export function ago(time: number, now: number) {
  const minutes = Math.floor((now - time) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

/** Which Sui network this deployment is on. Core doesn't report it, so it is set per deployment. */
export function suiNetwork(): 'testnet' | 'mainnet' | null {
  const network = import.meta.env.VITE_SUI_NETWORK;
  return network === 'testnet' || network === 'mainnet' ? network : null;
}

/** The portal's build, added by the Vite config. Empty when the commit isn't known. */
export const buildCommit = (): string => import.meta.env.VITE_APP_COMMIT ?? '';
