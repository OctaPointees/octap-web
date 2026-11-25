import { ArrowsClockwise, Power } from 'phosphor-react';
import { Button } from '@octap/shared/components';
import { CopyButton } from '@/components/shared/Controls';
import { Card } from '@/components/shared/Display';
import { cn } from '@/utils/cn';
import { fmtDate } from '@/utils/format';
import type { WebhookDeliveryRecord, WebhookEndpoint } from '../hooks/useWebhooks';

/**
 * The organization's endpoints, newest first, each with its recent failures and its actions: a new
 * signing secret, and turning it off or on. Core has no delete; turning it off stops all events.
 */
export function EndpointList({
  endpoints,
  deliveries,
  busyId,
  isHighlighted,
  onRotate,
  onToggle,
}: {
  endpoints: WebhookEndpoint[];
  deliveries: WebhookDeliveryRecord[];
  /** The endpoint being turned on or off. */
  busyId: string | null;
  isHighlighted: (id: string) => boolean;
  onRotate: (endpoint: WebhookEndpoint) => void;
  onToggle: (endpoint: WebhookEndpoint) => void;
}) {
  const sorted = [...endpoints].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const failures = (id: string) =>
    deliveries.filter((item) => item.endpointId === id && item.status === 'DEAD_LETTER').length;

  return (
    <Card title="Endpoints" bodyClassName="p-0 pt-3">
      <ul className="divide-y divide-base-300 border-t border-base-300">
        {sorted.map((endpoint) => {
          const active = endpoint.status === 'ACTIVE';
          const failed = failures(endpoint.id);
          return (
            <li
              key={endpoint.id}
              className={cn(
                'flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 transition-colors',
                isHighlighted(endpoint.id) && 'bg-primary/10',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'size-2.5 shrink-0 rounded-full',
                  active ? 'bg-success' : 'bg-base-content/25',
                )}
              />
              <div className="min-w-0 flex-1 basis-64">
                <div className="flex min-w-0 items-center gap-1">
                  <code
                    className={cn('truncate font-mono text-sm', !active && 'opacity-60')}
                    title={endpoint.url}
                  >
                    {endpoint.url}
                  </code>
                  <CopyButton value={endpoint.url} />
                </div>
                <p className="truncate text-xs opacity-60">
                  {endpoint.description ? `${endpoint.description}, ` : ''}
                  added {fmtDate(endpoint.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'badge badge-soft badge-sm',
                    active ? 'badge-success' : 'badge-ghost',
                  )}
                >
                  {active ? 'On' : 'Off'}
                </span>
                {failed > 0 && (
                  <span
                    className="badge badge-soft badge-error badge-sm"
                    title="Deliveries that gave up after every retry, among the latest 50"
                  >
                    {failed} failed
                  </span>
                )}
                <Button className="btn-ghost btn-sm" onClick={() => onRotate(endpoint)}>
                  <ArrowsClockwise size={16} className="mr-1.5" aria-hidden /> New secret
                </Button>
                <Button
                  className={cn('btn-sm', active ? 'btn-ghost' : 'btn-outline')}
                  loading={busyId === endpoint.id}
                  onClick={() => onToggle(endpoint)}
                >
                  <Power size={16} className="mr-1.5" aria-hidden />{' '}
                  {active ? 'Turn off' : 'Turn on'}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
