import { useEffect, useState, useSyncExternalStore } from 'react';
import { onlineManager, useQuery, useQueryClient, type QueryCache } from '@tanstack/react-query';
import { OctapError } from '@octap/internal-sdk';
import { unwrap, useAuth } from '@octap/shared/authentication';
import { readHealth, systemState } from '../domain/status';

const systemKeys = { health: ['system', 'health'] as const };

const HEALTHY_POLL_MS = 60_000;
/** Faster while something is wrong, so recovery shows soon. Core caches its probe for 5 seconds. */
const TROUBLE_POLL_MS = 15_000;

/**
 * How OctaP is doing, from Core's public `/health`. It polls only while the tab is visible, and
 * tries once more before reporting a failure, so one dropped request doesn't raise an alarm.
 */
export function useSystemStatus() {
  const { api } = useAuth();
  const online = useSyncExternalStore(
    (listener) => onlineManager.subscribe(listener),
    () => onlineManager.isOnline(),
  );
  const health = useQuery({
    queryKey: systemKeys.health,
    queryFn: async () => {
      const startedAt = performance.now();
      const answer = await unwrap(api.health.check());
      return {
        report: readHealth(answer),
        roundTripMs: Math.round(performance.now() - startedAt),
      };
    },
    staleTime: TROUBLE_POLL_MS,
    retry: 1,
    retryDelay: 1000,
    refetchInterval: (query) =>
      query.state.data?.report?.status === 'ok' && !query.state.error
        ? HEALTHY_POLL_MS
        : TROUBLE_POLL_MS,
  });

  // Core sends its report with a 503 too, so the details can still say what is down.
  const report =
    health.error instanceof OctapError
      ? readHealth(health.error.body)
      : (health.data?.report ?? null);

  return {
    state: systemState({ online, pending: health.isPending, report, error: health.error }),
    report,
    roundTripMs: health.error ? null : (health.data?.roundTripMs ?? null),
    checkedAt: health.dataUpdatedAt,
  };
}

/** When the oldest data on screen was read. The status check itself doesn't count. */
function oldestUpdate(cache: QueryCache) {
  let oldest = 0;
  for (const query of cache.getAll()) {
    const updatedAt = query.state.dataUpdatedAt;
    if (query.queryKey[0] === 'system' || !updatedAt || !query.isActive()) continue;
    if (!oldest || updatedAt < oldest) oldest = updatedAt;
  }
  return oldest;
}

export function useLastUpdated() {
  const cache = useQueryClient().getQueryCache();
  return useSyncExternalStore(
    (listener) => cache.subscribe(listener),
    () => oldestUpdate(cache),
  );
}

/** The current time, ticking, for "2m ago" labels. */
export function useNow(intervalMs = 15_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
