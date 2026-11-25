import { useSyncExternalStore } from 'react';

/**
 * Whether this tab is getting live updates from Core:
 * - `off`: no organization open, or the tab is hidden (the stream closes then, and catches up when
 *   the tab comes back).
 * - `connecting`: opening, or reopening after a drop.
 * - `live`: changes show as they happen.
 * - `paused`: Core can't be reached for now, or refused the stream; screens refresh as before.
 */
export type LiveStatus = 'off' | 'connecting' | 'live' | 'paused';

/**
 * Why live updates are paused:
 * - `unreachable`: the connection dropped or Core answered with an error. Retried on its own.
 * - `busy`: too many tabs have a stream open for this person (Core allows 5). Retried on its own.
 * - `signedOut`: the sign-in the stream used ended. Not retried.
 * - `noAccess`: Core refused this organization's stream. Not retried.
 */
export type PauseReason = 'unreachable' | 'busy' | 'signedOut' | 'noAccess';

export type LiveState = {
  status: LiveStatus;
  reason?: PauseReason;
  /** When the next reconnect happens, for reasons that retry on their own. */
  retryAt?: number;
};

let state: LiveState = { status: 'off' };
/** Bumped by "Try now", which reopens the stream at once. */
let retryRequest = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export function setLiveStatus(status: LiveStatus, reason?: PauseReason, retryAt?: number) {
  if (status === state.status && reason === state.reason && retryAt === state.retryAt) return;
  state = status === 'paused' ? { status, reason, retryAt } : { status };
  emit();
}

/** Reopens the stream now instead of waiting for the next try. */
export function retryLiveNow() {
  retryRequest += 1;
  emit();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useLiveStatus() {
  return useSyncExternalStore(
    subscribe,
    () => state.status,
    () => 'off' as const,
  );
}

/** The status with why it is paused and when it tries again. */
export function useLiveState() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}

/** Changes each time someone asks to reconnect now. */
export function useLiveRetryRequest() {
  return useSyncExternalStore(
    subscribe,
    () => retryRequest,
    () => 0,
  );
}
