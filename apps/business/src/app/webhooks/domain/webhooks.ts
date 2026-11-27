import type { WebhookDeliveryRecord } from '../hooks/useWebhooks';

/** The events OctaP sends, as Core names them, with what each one means. */
export const EVENT_TYPES: { type: string; meaning: string }[] = [
  { type: 'credits.earned', meaning: 'A member earned points; on its way to the chain' },
  { type: 'credits.earn.confirmed', meaning: 'Points a member earned are on-chain' },
  { type: 'credits.earn.failed', meaning: 'Points a member earned could not be issued' },
  { type: 'credits.redemption.confirmed', meaning: 'A member spent points' },
  { type: 'credits.reversed', meaning: 'A transaction was reversed' },
  { type: 'voucher.granted', meaning: 'A member claimed a voucher' },
  { type: 'voucher.redeemed', meaning: 'A member used a voucher' },
  { type: 'voucher.created', meaning: 'A voucher draft was created' },
  { type: 'voucher.submitted', meaning: 'A draft was sent to the Owner for approval' },
  { type: 'voucher.returned', meaning: 'A draft came back: rejected, or taken back' },
  { type: 'voucher.activated', meaning: 'A voucher went live, or was resumed' },
  { type: 'voucher.publish.failed', meaning: 'A voucher could not be published on-chain' },
  { type: 'voucher.paused', meaning: 'A voucher was paused' },
  { type: 'voucher.archived', meaning: 'An imported draft was archived' },
  { type: 'budget.low', meaning: 'The points budget is running low' },
];

/** How many times Core tries a delivery before giving up on it (`DEAD_LETTER`). */
export const MAX_ATTEMPTS = 6;

/** The headers Core sends with every delivery. */
export const DELIVERY_HEADERS = [
  {
    name: 'x-octap-event-id',
    meaning: 'The same on every retry and replay. Use it to skip repeats.',
  },
  { name: 'x-octap-event-type', meaning: 'One of the events below.' },
  {
    name: 'x-octap-signature',
    meaning: 'HMAC-SHA256 of the raw body with your signing secret, in hex.',
  },
];

export type DeliveryFilter = 'all' | 'failed' | 'retrying' | 'delivered';

export const DELIVERY_STATE: Record<
  WebhookDeliveryRecord['status'],
  { label: string; tone: string; filter: Exclude<DeliveryFilter, 'all'> }
> = {
  DELIVERED: { label: 'Delivered', tone: 'badge-success', filter: 'delivered' },
  PENDING: { label: 'Retrying', tone: 'badge-warning', filter: 'retrying' },
  DEAD_LETTER: { label: 'Failed', tone: 'badge-error', filter: 'failed' },
};

/** The host of an endpoint URL, for tight spaces. Falls back to the URL itself. */
export function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/** Core accepts any http(s) URL. Plain http is allowed for testing but sends events unencrypted. */
export function checkUrl(value: string): { error?: string; warning?: string } {
  const url = value.trim();
  if (!url) return { error: 'Enter the URL OctaP should send events to.' };
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { error: 'Enter a full URL, starting with https://' };
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:')
    return { error: 'The URL must start with https:// or http://' };
  if (parsed.protocol === 'http:')
    return { warning: 'Plain http sends events unencrypted. Use https outside of testing.' };
  return {};
}

/** What the last attempt got back: an HTTP status, an error, or nothing yet. */
export function lastResult(delivery: WebhookDeliveryRecord) {
  if (delivery.lastResponseStatus) return `HTTP ${delivery.lastResponseStatus}`;
  if (delivery.lastError) return delivery.lastError;
  return delivery.status === 'DELIVERED' ? 'OK' : 'No response yet';
}
