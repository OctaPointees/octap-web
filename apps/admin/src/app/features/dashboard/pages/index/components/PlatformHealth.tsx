import type { DependencyCheck, HealthStatus } from '@octap/internal-sdk';
import { unwrap, useAuth } from '@octap/shared/authentication';
import { Button } from '@octap/shared/components';
import { cn } from '@octap/shared/utils';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ArrowClockwise } from 'phosphor-react';

const STATUS: Record<HealthStatus, { label: string; badge: string }> = {
  ok: { label: 'Healthy', badge: 'badge-success' },
  degraded: { label: 'Degraded', badge: 'badge-warning' },
  down: { label: 'Down', badge: 'badge-error' },
};

const DEPENDENCIES = [
  { key: 'database', label: 'Database' },
  { key: 'redis', label: 'Redis' },
  { key: 'sui', label: 'Sui' },
] as const;

/** A duration in seconds as a short text, such as "45s", "12m" or "3h". */
function age(seconds: number | null) {
  if (seconds == null) return 'None';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
}

/** Core's own health report: its dependencies and how far its workers are behind. */
export function PlatformHealth() {
  const { api } = useAuth();
  const health = useQuery({
    queryKey: ['platform', 'health'],
    queryFn: () => unwrap(api.platform.report()),
    refetchInterval: 30_000,
  });
  const report = health.data;

  return (
    <div className="p-4 border h-fit shrink-0 rounded-box border-base-300 bg-base-100 w-78">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h2 className="font-bold">Platform health</h2>
        {report && (
          <span className={cn('badge badge-soft', STATUS[report.status].badge)}>
            {STATUS[report.status].label}
          </span>
        )}
      </div>

      <p className="text-sm text-base-content/70">
        {report
          ? `Checked ${formatDistanceToNow(new Date(report.checkedAt), { addSuffix: true })}`
          : health.isPending
            ? 'Checking...'
            : 'Not checked'}
      </p>

      {health.isError && (
        <div role="alert" className="alert alert-error alert-soft mt-4 whitespace-normal">
          {health.error instanceof Error ? health.error.message : 'Could not load platform health.'}
        </div>
      )}

      {health.isPending && (
        <div className="flex justify-center my-8">
          <span className="loading loading-spinner" />
        </div>
      )}

      {report && (
        <div className="my-4 space-y-5">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase text-base-content/60">Dependencies</h3>
            {DEPENDENCIES.map(({ key, label }) => (
              <DependencyRow key={key} label={label} check={report.checks[key]} />
            ))}
          </section>

          {report.workerLag && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-base-content/60">Workers</h3>
              <LagRow
                label="Oldest pending operation"
                value={age(report.workerLag.operations.oldestWorkerOwedAgeSeconds)}
              />
              <LagRow
                label="Webhooks due"
                value={`${report.workerLag.webhookDeliveries.due} of ${report.workerLag.webhookDeliveries.pending} pending`}
              />
              <LagRow
                label="Webhooks dead-lettered"
                value={report.workerLag.webhookDeliveries.deadLettered}
                warn={report.workerLag.webhookDeliveries.deadLettered > 0}
              />
              {report.workerLag.indexer.map((stream) => (
                <LagRow
                  key={stream.streamName}
                  label={`Indexer ${stream.streamName}`}
                  value={
                    stream.checkpointsBehind == null
                      ? `updated ${age(stream.sinceUpdateSeconds)} ago`
                      : `${stream.checkpointsBehind} behind`
                  }
                />
              ))}
            </section>
          )}
        </div>
      )}

      <Button
        className="btn-block btn-primary"
        icon={ArrowClockwise}
        onClick={() => void health.refetch()}
        loading={health.isFetching}
      >
        Reload
      </Button>
    </div>
  );
}

function DependencyRow({ label, check }: { label: string; check: DependencyCheck }) {
  const up = check.status === 'up';
  return (
    <div className="text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-medium">
          <span
            aria-hidden
            className={cn('status', { 'status-success': up, 'status-error': !up })}
          />
          {label}
        </span>
        <span className="tabular-nums text-base-content/70">
          {up ? `${Math.round(check.latencyMs)} ms` : 'Down'}
        </span>
      </div>
      {check.error && <p className="mt-1 text-xs text-error break-words">{check.error}</p>}
    </div>
  );
}

function LagRow({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: string | number;
  warn?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="truncate">{label}</span>
      <span className={cn('shrink-0 tabular-nums text-base-content/70', { 'text-warning': warn })}>
        {value}
      </span>
    </div>
  );
}
