import { useState } from 'react';
import { ArrowCounterClockwise, CaretRight, ShareNetwork } from 'phosphor-react';
import { Button, Modal, useExitValue } from '@octap/shared/components';
import { CopyButton, Segmented } from '@/components/shared/Controls';
import { Card, EmptyState } from '@/components/shared/Display';
import { cn } from '@/utils/cn';
import { fmtDate, fmtNumber, fmtRelative } from '@/utils/format';
import {
  DELIVERY_STATE,
  hostOf,
  lastResult,
  MAX_ATTEMPTS,
  type DeliveryFilter,
} from '../domain/webhooks';
import {
  useReplayDelivery,
  type WebhookDeliveryRecord,
  type WebhookEndpoint,
} from '../hooks/useWebhooks';

const FILTERS: { value: DeliveryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'failed', label: 'Failed' },
  { value: 'retrying', label: 'Retrying' },
  { value: 'delivered', label: 'Delivered' },
];

/** One delivery in full: where it went, how each try went, and the exact payload sent. */
function DeliveryDetails({
  delivery: requested,
  endpoint,
  replaying,
  onReplay,
  onClose,
}: {
  delivery: WebhookDeliveryRecord | null;
  endpoint: WebhookEndpoint | undefined;
  replaying: boolean;
  onReplay: (delivery: WebhookDeliveryRecord) => void;
  onClose: () => void;
}) {
  // Keeps showing the last delivery while the dialog animates out.
  const delivery = useExitValue(requested);
  const payload = delivery ? JSON.stringify(delivery.payload, null, 2) : '';
  const state = delivery ? DELIVERY_STATE[delivery.status] : undefined;
  const row = (label: string, value: React.ReactNode) => (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 py-1">
      <dt className="opacity-60">{label}</dt>
      <dd className="break-words">{value}</dd>
    </div>
  );

  return (
    <Modal
      open={!!requested}
      onOpenChange={(open) => !open && onClose()}
      title={delivery?.eventType ?? 'Delivery'}
      description="What OctaP sent, and what came back."
      footer={
        <>
          {delivery?.status === 'DEAD_LETTER' && (
            <Button className="btn-primary" loading={replaying} onClick={() => onReplay(delivery)}>
              <ArrowCounterClockwise size={16} className="mr-1.5" aria-hidden /> Send again
            </Button>
          )}
          <Button className="btn-ghost" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      {delivery && state && (
        <div className="flex flex-col gap-4 text-sm">
          <dl>
            {row(
              'Status',
              <span className={cn('badge badge-soft badge-sm', state.tone)}>{state.label}</span>,
            )}
            {row('Endpoint', <code className="font-mono">{endpoint?.url ?? 'Unknown'}</code>)}
            {row('Attempts', `${fmtNumber(delivery.attemptCount)} of ${MAX_ATTEMPTS}`)}
            {row('Last result', lastResult(delivery))}
            {delivery.status === 'PENDING' && row('Next try', fmtRelative(delivery.nextAttemptAt))}
            {row('Event ID', <code className="font-mono text-xs">{delivery.eventId}</code>)}
            {row('Created', fmtDate(delivery.createdAt))}
          </dl>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">Payload</span>
              <CopyButton value={payload} />
            </div>
            <pre className="max-h-80 overflow-auto rounded-field bg-base-200 p-3 font-mono text-xs">
              {payload}
            </pre>
          </div>
        </div>
      )}
    </Modal>
  );
}

/**
 * The latest deliveries Core keeps (50), newest first, filterable by outcome. A failed one, that
 * gave up after every retry, can be sent again with the same event ID.
 */
export function DeliveryList({
  deliveries,
  endpoints,
}: {
  deliveries: WebhookDeliveryRecord[];
  endpoints: WebhookEndpoint[];
}) {
  const replay = useReplayDelivery();
  const [filter, setFilter] = useState<DeliveryFilter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const endpointOf = (id: string) => endpoints.find((endpoint) => endpoint.id === id);
  const counts: Record<DeliveryFilter, number> = { all: 0, failed: 0, retrying: 0, delivered: 0 };
  for (const delivery of deliveries) {
    counts.all += 1;
    counts[DELIVERY_STATE[delivery.status].filter] += 1;
  }
  const shown = deliveries.filter(
    (delivery) => filter === 'all' || DELIVERY_STATE[delivery.status].filter === filter,
  );
  // Looked up again on every render, so the dialog shows a replay's new status.
  const open = deliveries.find((delivery) => delivery.id === openId) ?? null;
  const sendAgain = (delivery: WebhookDeliveryRecord) => replay.mutate(delivery.id);

  return (
    <Card
      title="Recent deliveries"
      bodyClassName="p-0 pt-3"
      actions={
        deliveries.length > 0 && (
          <Segmented
            value={filter}
            onValueChange={setFilter}
            options={FILTERS.map(({ value, label }) => ({
              value,
              label: (
                <>
                  {label}
                  <span className="text-xs opacity-70 tabular-nums">{counts[value]}</span>
                </>
              ),
            }))}
          />
        )
      }
    >
      {!deliveries.length ? (
        <EmptyState
          icon={ShareNetwork}
          title="No deliveries yet"
          description="Each event OctaP sends to your endpoints shows here, with what came back."
        />
      ) : !shown.length ? (
        <p className="border-t border-base-300 px-5 py-8 text-center text-sm opacity-60">
          No {FILTERS.find((item) => item.value === filter)!.label.toLowerCase()} deliveries among
          the latest {fmtNumber(deliveries.length)}.
        </p>
      ) : (
        <ul className="divide-y divide-base-300 border-t border-base-300">
          {shown.map((delivery) => {
            const state = DELIVERY_STATE[delivery.status];
            const endpoint = endpointOf(delivery.endpointId);
            return (
              <li
                key={delivery.id}
                className="flex items-center gap-3 px-5 py-2.5 hover:bg-base-200/60"
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left outline-none focus-visible:underline"
                  onClick={() => setOpenId(delivery.id)}
                >
                  <span className={cn('badge badge-soft badge-sm w-20 shrink-0', state.tone)}>
                    {state.label}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-sm">{delivery.eventType}</span>
                    <span className="block truncate text-xs opacity-60">
                      {endpoint ? hostOf(endpoint.url) : 'Unknown endpoint'}, {lastResult(delivery)}
                      {delivery.attemptCount > 1 &&
                        `, ${fmtNumber(delivery.attemptCount)} of ${MAX_ATTEMPTS} tries`}
                    </span>
                  </span>
                  <span className="hidden w-24 shrink-0 text-right text-xs opacity-60 sm:block">
                    {fmtRelative(delivery.updatedAt)}
                  </span>
                </button>
                {delivery.status === 'DEAD_LETTER' ? (
                  <Button
                    className="btn-ghost btn-xs shrink-0"
                    loading={replay.isPending && replay.variables === delivery.id}
                    onClick={() => sendAgain(delivery)}
                  >
                    Send again
                  </Button>
                ) : (
                  <CaretRight size={14} className="shrink-0 opacity-40" aria-hidden />
                )}
              </li>
            );
          })}
        </ul>
      )}

      <DeliveryDetails
        delivery={open}
        endpoint={open ? endpointOf(open.endpointId) : undefined}
        replaying={replay.isPending && replay.variables === open?.id}
        onReplay={sendAgain}
        onClose={() => setOpenId(null)}
      />
    </Card>
  );
}
