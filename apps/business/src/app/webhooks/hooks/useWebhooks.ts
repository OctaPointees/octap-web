import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ConsoleWebhooksListDeliveriesResponse,
  ConsoleWebhooksListEndpointsResponse,
} from '@octap/internal-sdk';
import { unwrap, useAuth } from '@octap/shared/authentication';
import { notify } from '@octap/shared/components';
import { useOrganization } from '@/app/organization/hooks/useOrganization';

export type WebhookEndpoint = ConsoleWebhooksListEndpointsResponse[number];
export type WebhookDeliveryRecord = ConsoleWebhooksListDeliveriesResponse[number];

/**
 * Query keys for webhooks, shared with the dashboard. The dashboard keeps deliveries without their
 * payload under `deliveries`; this page keeps them whole one level below, so invalidating
 * `deliveries` refreshes both.
 */
export const webhookKeys = {
  endpoints: (organizationId: string) =>
    ['console', 'organization', organizationId, 'webhook-endpoints'] as const,
  deliveries: (organizationId: string) =>
    ['console', 'organization', organizationId, 'webhook-deliveries'] as const,
  fullDeliveries: (organizationId: string) =>
    [...webhookKeys.deliveries(organizationId), 'full'] as const,
};

/** How often the delivery list reloads while some delivery is still being retried. */
const RETRY_POLL_MS = 15_000;

/** The organization's webhook endpoints. Core lets only the Owner read them. */
export function useWebhookEndpoints() {
  const { api } = useAuth();
  const { organizationId, owner } = useOrganization();
  return useQuery({
    queryKey: webhookKeys.endpoints(organizationId),
    queryFn: () => unwrap(api.console.listEndpoints({ organizationId })),
    enabled: owner,
  });
}

/**
 * The latest deliveries, newest first, with their payloads. Core returns the last 50. Reloads by
 * itself while any is still pending, so retries show up as they happen.
 */
export function useWebhookDeliveries() {
  const { api } = useAuth();
  const { organizationId, owner } = useOrganization();
  return useQuery({
    queryKey: webhookKeys.fullDeliveries(organizationId),
    queryFn: () => unwrap(api.console.listDeliveries({ organizationId })),
    enabled: owner,
    refetchInterval: (query) =>
      query.state.data?.some((delivery) => delivery.status === 'PENDING') ? RETRY_POLL_MS : false,
  });
}

/**
 * Writes a changed endpoint into the cached list, so the page needs no reload. Copies only the
 * endpoint's own fields, so a signing secret in Core's answer never reaches the cache.
 */
function useStoreEndpoint() {
  const { organizationId } = useOrganization();
  const cache = useQueryClient();
  return (answer: WebhookEndpoint & { secret?: string }) => {
    const { id, organizationId: org, url, description, status, createdAt, updatedAt } = answer;
    const changed: WebhookEndpoint = {
      id,
      organizationId: org,
      url,
      description,
      status,
      createdAt,
      updatedAt,
    };
    return cache.setQueryData<WebhookEndpoint[]>(webhookKeys.endpoints(organizationId), (list) =>
      list?.some((item) => item.id === changed.id)
        ? list.map((item) => (item.id === changed.id ? changed : item))
        : [changed, ...(list ?? [])],
    );
  };
}

/**
 * Adds an endpoint. Core answers with its signing secret, shown this once, so the answer is never
 * cached: `gcTime: 0` drops it as soon as the dialog resets.
 */
export function useRegisterEndpoint() {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  const store = useStoreEndpoint();
  return useMutation({
    meta: { invalidates: [] },
    gcTime: 0,
    mutationFn: (body: { url: string; description?: string }) =>
      unwrap(api.console.registerEndpoint({ organizationId, body })),
    onSuccess: (answer) => store(answer),
    onError: (cause) => notify.error(cause, 'Could not add the endpoint'),
  });
}

/** Issues a new signing secret. The old one stops working at once. Never cached, like the above. */
export function useRotateSecret() {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  const store = useStoreEndpoint();
  return useMutation({
    meta: { invalidates: [] },
    gcTime: 0,
    mutationFn: (id: string) => unwrap(api.console.rotateSecret({ organizationId, id })),
    onSuccess: (answer) => store(answer),
    onError: (cause) => notify.error(cause, 'Could not create a new secret'),
  });
}

/** Turns an endpoint on or off. Off, OctaP stops sending it events. */
export function useSetEndpointActive() {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  const store = useStoreEndpoint();
  return useMutation({
    meta: { invalidates: [] },
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      unwrap(
        active
          ? api.console.enableEndpoint({ organizationId, id })
          : api.console.disableEndpoint({ organizationId, id }),
      ),
    onSuccess: (endpoint) => {
      store(endpoint);
      notify.success(endpoint.status === 'ACTIVE' ? 'Endpoint turned on' : 'Endpoint turned off');
    },
    onError: (cause) => notify.error(cause, 'Could not change the endpoint'),
  });
}

/** Sends a failed delivery again, with the same event ID, so the receiver can skip duplicates. */
export function useReplayDelivery() {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  return useMutation({
    meta: { invalidates: [webhookKeys.deliveries(organizationId)] },
    mutationFn: (id: string) => unwrap(api.console.replayDelivery({ organizationId, id })),
    onSuccess: () => notify.success('Delivery queued again'),
    onError: (cause) => notify.error(cause, 'Could not send the delivery again'),
  });
}
