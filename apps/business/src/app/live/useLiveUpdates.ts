import { useEffect, useRef } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useAuth } from '@octap/shared/authentication';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { readStreamEvent, staleKeys, STREAM_CONTROL } from './events';
import { setLiveStatus, useLiveRetryRequest, type PauseReason } from './liveStatus';

/** A burst of events, such as an import of many vouchers, reloads each screen once, not per event. */
const BURST_MS = 300;
/** Waits between reconnects, doubling up to the last. */
const RETRY_MS = [1_000, 2_000, 5_000, 10_000, 30_000];
/** Core allows 5 streams per person; past that it answers 429, so wait longer before trying again. */
const TOO_MANY_MS = 60_000;

/** Stops the stream for good: no access, or the session ended. */
class StopStream extends Error {
  constructor(readonly reason: PauseReason) {
    super('The event stream was refused');
  }
}
/** Core answered something other than a stream; try again later. */
class RetryLater extends Error {
  constructor(readonly waitMs?: number) {
    super('The event stream is unavailable');
  }
}

/**
 * Keeps this tab in step with the organization while it is open: Core's event stream (OCT-326)
 * says what changed, and the screens showing it reload. One stream per tab, opened once for the
 * whole workspace. It closes while the tab is hidden and, when the tab comes back, resumes from the
 * last event seen, so nothing is missed. "Try now" and a new sign-in resume from it too. If the stream can't be had, nothing breaks: screens
 * refresh as they did before, on focus and on their own timers.
 */
export function useLiveUpdates() {
  const { apiBaseUrl, getAccessToken, refresh, identity } = useAuth();
  // Changes only with a new sign-in, so the stream reopens with the new token, not on every refresh.
  const signedInUntil = identity?.expiresAt;
  const { organizationId } = useOrganization();
  const cache = useQueryClient();
  // "Try now" in the status bar: reopens the stream at once.
  const retryRequest = useLiveRetryRequest();
  // The last event seen, kept across reopens so Core replays what came in between. Only for the
  // organization it came from.
  const lastEvent = useRef<{ organizationId: string; id: string }>(undefined);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const stop = new AbortController();
    let attempt = 0;
    // Set once the stream is refused for good. Showing the tab again must not claim to connect.
    let stopped = false;
    const resumeFrom =
      lastEvent.current?.organizationId === organizationId ? lastEvent.current.id : undefined;

    // Stale keys collected during a burst, flushed together.
    const pending = new Map<string, QueryKey>();
    let flushTimer: number | undefined;
    const markStale = (keys: QueryKey[]) => {
      for (const key of keys) pending.set(JSON.stringify(key), key);
      flushTimer ??= window.setTimeout(() => {
        flushTimer = undefined;
        const keys = [...pending.values()];
        pending.clear();
        for (const queryKey of keys) void cache.invalidateQueries({ queryKey });
      }, BURST_MS);
    };
    const reloadEverything = () =>
      void cache.invalidateQueries({ queryKey: ['console', 'organization', organizationId] });

    const onVisibility = () => {
      if (!stopped) setLiveStatus(document.hidden ? 'off' : 'connecting');
    };
    document.addEventListener('visibilitychange', onVisibility);
    setLiveStatus(document.hidden ? 'off' : 'connecting');

    void fetchEventSource(
      `${apiBaseUrl.replace(/\/+$/, '')}/v1/console/organizations/${encodeURIComponent(organizationId)}/events`,
      {
        signal: stop.signal,
        // Lowercase, as the library names the header when it reconnects on its own.
        headers: {
          Authorization: `Bearer ${token}`,
          ...(resumeFrom && { 'last-event-id': resumeFrom }),
        },
        // Closes while hidden and reopens with Last-Event-ID when the tab is shown again.
        openWhenHidden: false,
        async onopen(response) {
          const type = response.headers.get('content-type') ?? '';
          if (response.ok && type.includes('text/event-stream')) {
            attempt = 0;
            setLiveStatus('live');
            return;
          }
          if (response.status === 401) throw new StopStream('signedOut');
          if (response.status === 403) throw new StopStream('noAccess');
          throw new RetryLater(response.status === 429 ? TOO_MANY_MS : undefined);
        },
        onmessage(message) {
          if (message.id) lastEvent.current = { organizationId, id: message.id };
          if (message.event === STREAM_CONTROL.reset) return reloadEverything();
          if (message.event === STREAM_CONTROL.tokenExpired) throw new StopStream('signedOut');
          if (message.event === STREAM_CONTROL.accessRevoked) {
            // Access changed: read who we are again, which also leaves the organization if gone.
            void refresh().catch(() => {});
            throw new StopStream('noAccess');
          }
          const event = readStreamEvent(message.data);
          if (event) markStale(staleKeys(organizationId, event.subject));
        },
        onclose() {
          // Core closed the stream without saying why: reconnect and resume.
          throw new RetryLater();
        },
        onerror(error) {
          if (error instanceof StopStream) {
            stopped = true;
            document.removeEventListener('visibilitychange', onVisibility);
            setLiveStatus('paused', error.reason);
            throw error;
          }
          const busyFor = error instanceof RetryLater ? error.waitMs : undefined;
          const wait = busyFor ?? RETRY_MS[Math.min(attempt, RETRY_MS.length - 1)];
          attempt += 1;
          setLiveStatus('paused', busyFor ? 'busy' : 'unreachable', Date.now() + wait);
          return wait;
        },
      },
    ).catch(() => {
      // Stopped for good (see `StopStream`), or aborted on the way out.
    });

    return () => {
      stop.abort();
      window.clearTimeout(flushTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      setLiveStatus('off');
    };
  }, [apiBaseUrl, getAccessToken, refresh, organizationId, cache, signedInUntil, retryRequest]);
}
