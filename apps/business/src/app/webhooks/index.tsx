import { useState } from 'react';
import { LockSimple, Plus, ShareNetwork } from 'phosphor-react';
import { Button, ConfirmDialog, useRowFlash } from '@octap/shared/components';
import { Card, EmptyState, ErrorState, PageHeader } from '@/components/shared/Display';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { DeliveryList } from './components/DeliveryList';
import { AddEndpointDialog, RotateSecretDialog } from './components/EndpointDialogs';
import { EndpointList } from './components/EndpointList';
import { DELIVERY_HEADERS, EVENT_TYPES } from './domain/webhooks';
import {
  useSetEndpointActive,
  useWebhookDeliveries,
  useWebhookEndpoints,
  type WebhookEndpoint,
} from './hooks/useWebhooks';

/** How to receive events: the headers on every request and the events OctaP sends. */
function ReceivingGuide() {
  return (
    <Card>
      <details className="group text-sm">
        <summary className="cursor-pointer font-semibold select-none">
          How to receive events
        </summary>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h3 className="font-medium">Every request</h3>
            <p className="opacity-70">
              A JSON <code className="font-mono">POST</code>. Answer with any 2xx status within 10
              seconds. Anything else is tried again, up to 6 tries in all, waiting 1, 2, 5, 15 and
              30 minutes between them. After that it shows as failed, and you can send it again.
            </p>
            <dl className="flex flex-col gap-2">
              {DELIVERY_HEADERS.map((header) => (
                <div key={header.name}>
                  <dt className="font-mono text-xs font-semibold">{header.name}</dt>
                  <dd className="opacity-70">{header.meaning}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-medium">Events</h3>
            <dl className="flex flex-col gap-1.5">
              {EVENT_TYPES.map((event) => (
                <div key={event.type} className="grid gap-x-3 sm:grid-cols-[14rem_minmax(0,1fr)]">
                  <dt className="font-mono text-xs">{event.type}</dt>
                  <dd className="opacity-70">{event.meaning}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </details>
    </Card>
  );
}

/**
 * Where OctaP sends events about the organization's points and vouchers, and how sending them went.
 * Core lets only the Owner see or change webhooks, so anyone else gets a short explanation.
 */
export default function WebhooksPage() {
  const { owner } = useOrganization();
  const endpoints = useWebhookEndpoints();
  const deliveries = useWebhookDeliveries();
  const setActive = useSetEndpointActive();
  const { flashRow, isFlashing } = useRowFlash();
  const [adding, setAdding] = useState(false);
  const [rotating, setRotating] = useState<WebhookEndpoint | null>(null);
  const [turningOff, setTurningOff] = useState<WebhookEndpoint | null>(null);
  const busyId = setActive.isPending ? setActive.variables.id : null;

  const toggle = (endpoint: WebhookEndpoint) => {
    // Turning off stops events, so it asks first. Turning on needs no second look.
    if (endpoint.status === 'ACTIVE') setTurningOff(endpoint);
    else setActive.mutate({ id: endpoint.id, active: true });
  };

  if (!owner)
    return (
      <>
        <PageHeader
          title="Webhooks"
          description="Where OctaP sends events about your points and vouchers."
        />
        <Card>
          <EmptyState
            icon={LockSimple}
            title="Only the Owner can manage webhooks"
            description="Ask your organization's Owner to add an endpoint or check deliveries."
          />
        </Card>
      </>
    );

  const error = endpoints.error ?? deliveries.error;
  return (
    <>
      <PageHeader
        title="Webhooks"
        description="Where OctaP sends events about your points and vouchers, and how sending them went."
        actions={
          <Button className="btn-primary" onClick={() => setAdding(true)}>
            <span className="flex items-center gap-2">
              <Plus size={16} aria-hidden />
              Add endpoint
            </span>
          </Button>
        }
      />

      {error ? (
        <ErrorState
          error={error}
          onRetry={() => {
            void endpoints.refetch();
            void deliveries.refetch();
          }}
        />
      ) : !endpoints.data || !deliveries.data ? (
        <div
          className="flex flex-col gap-2 rounded-box border border-base-300 bg-base-100 p-4"
          aria-busy
        >
          {Array.from({ length: 3 }, (_, row) => (
            <div key={row} className="skeleton h-12 w-full" />
          ))}
        </div>
      ) : !endpoints.data.length ? (
        <div className="animate-reveal flex flex-col gap-4">
          <Card>
            <EmptyState
              icon={ShareNetwork}
              title="No endpoints yet"
              description="Add a URL on your server, and OctaP tells it when members earn, spend or claim."
              action={
                <Button className="btn-primary btn-sm" onClick={() => setAdding(true)}>
                  Add endpoint
                </Button>
              }
            />
          </Card>
          <ReceivingGuide />
        </div>
      ) : (
        <div className="animate-reveal flex flex-col gap-4">
          <EndpointList
            endpoints={endpoints.data}
            deliveries={deliveries.data}
            busyId={busyId}
            isHighlighted={isFlashing}
            onRotate={setRotating}
            onToggle={toggle}
          />
          <DeliveryList deliveries={deliveries.data} endpoints={endpoints.data} />
          <ReceivingGuide />
        </div>
      )}

      <AddEndpointDialog open={adding} onAdded={flashRow} onClose={() => setAdding(false)} />
      <RotateSecretDialog endpoint={rotating} onClose={() => setRotating(null)} />
      <ConfirmDialog
        open={!!turningOff}
        onOpenChange={(open) => !open && setTurningOff(null)}
        title="Turn off this endpoint?"
        description="OctaP stops sending it events until you turn it back on. Events in between are not sent later."
        confirmLabel="Turn off"
        tone="warning"
        loading={setActive.isPending}
        onConfirm={() =>
          turningOff &&
          setActive.mutate(
            { id: turningOff.id, active: false },
            { onSuccess: () => setTurningOff(null) },
          )
        }
      >
        {turningOff && <code className="font-mono text-sm break-all">{turningOff.url}</code>}
      </ConfirmDialog>
    </>
  );
}
