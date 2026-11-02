import { useEffect, useState } from 'react';
import { ArrowClockwise, Plus, ShareNetwork, Trash } from 'phosphor-react';
import { Button } from '@/components/shared/Button';
import { CopyButton, TextInput } from '@/components/shared/Controls';
import { Card, ErrorState, LoadingBlock, PageHeader, StatusBadge } from '@/components/shared/Display';
import { useMerchantTenant } from '@/queries/merchant';
import { notify } from '@/utils/toast';

const EVENTS = ['points.earned', 'points.redeemed', 'reward.redeemed', 'member.joined'] as const;
type WebhookConfig = { url: string; events: string[]; secret: string; enabled: boolean };
const STORAGE_KEY = 'octap.webhooks';
const EMPTY: WebhookConfig = { url: '', events: [], secret: '', enabled: false };

function loadConfig(storageKey: string): WebhookConfig {
  try { return { ...EMPTY, ...JSON.parse(localStorage.getItem(storageKey) ?? '{}') as Partial<WebhookConfig> }; }
  catch { return EMPTY; }
}

export default function DeveloperWebhooksPage() {
  const tenant = useMerchantTenant();
  if (tenant.isLoading) return <LoadingBlock rows={2} />;
  if (tenant.error) return <ErrorState error={tenant.error} onRetry={tenant.refetch} />;
  if (!tenant.data) return null;
  return <WebhookSettings key={tenant.data.id} storageKey={`${STORAGE_KEY}:${tenant.data.id}`} />;
}

function WebhookSettings({ storageKey }: { storageKey: string }) {
  const [config, setConfig] = useState<WebhookConfig>(() => loadConfig(storageKey));
  const [url, setUrl] = useState(config.url);
  const [urlError, setUrlError] = useState('');
  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(config)); }, [config, storageKey]);

  const save = () => {
    let parsed: URL;
    try { parsed = new URL(url); } catch { setUrlError('Enter a valid HTTPS URL.'); return; }
    if (parsed.protocol !== 'https:') { setUrlError('Webhook endpoints must use HTTPS.'); return; }
    setUrlError('');
    setConfig((old) => ({ ...old, url: parsed.toString(), enabled: true, secret: old.secret || `whsec_${crypto.randomUUID().replaceAll('-', '')}` }));
    notify.success('Webhook endpoint saved');
  };
  const rotate = () => setConfig((old) => ({ ...old, secret: `whsec_${crypto.randomUUID().replaceAll('-', '')}` }));

  return <>
    <PageHeader title="Webhooks" description="Send real-time event notifications to your HTTPS endpoint." actions={config.url ? <Button className="btn-error btn-soft" onClick={() => { setConfig(EMPTY); setUrl(''); notify.success('Webhook endpoint removed'); }}><Trash /> Remove endpoint</Button> : undefined} />
    <div className="grid gap-4 xl:grid-cols-2">
      <Card title="Endpoint setup">
        <p className="mb-4 text-sm opacity-65">We’ll send signed POST requests when selected events occur. Return a 2xx response to acknowledge delivery.</p>
        <label className="flex flex-col gap-1 text-sm">Endpoint URL<TextInput value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://api.example.com/octap/webhooks" invalid={!!urlError} /></label>
        {urlError && <p className="mt-1 text-xs text-error">{urlError}</p>}
        <fieldset className="mt-4 flex flex-col gap-2"><legend className="mb-2 text-sm font-medium">Events</legend>{EVENTS.map((eventName) => <label key={eventName} className="flex items-center gap-2 text-sm"><input type="checkbox" className="checkbox checkbox-sm" checked={config.events.includes(eventName)} onChange={(event) => setConfig((old) => ({ ...old, events: event.target.checked ? [...old.events, eventName] : old.events.filter((name) => name !== eventName) }))} /><code>{eventName}</code></label>)}</fieldset>
        <Button className="btn-primary mt-4" disabled={!config.events.length} onClick={save}>{config.url ? 'Save endpoint' : <><Plus /> Add endpoint</>}</Button>
      </Card>
      <Card title="Signing secret">
        {config.secret ? <><p className="mb-3 text-sm opacity-65">Use this secret to verify the <code>OctaP-Signature</code> header for each delivery.</p><div className="flex items-center gap-2 rounded-box bg-base-200 p-3 font-mono text-xs"><span className="flex-1 break-all">{config.secret}</span><CopyButton value={config.secret} label="Copy" /></div><Button className="btn-ghost btn-sm mt-3" onClick={rotate}><ArrowClockwise /> Rotate secret</Button></> : <div className="flex flex-col items-center gap-2 py-6 text-center"><ShareNetwork size={28} className="opacity-50" /><p className="text-sm opacity-60">Add an endpoint to generate a signing secret.</p></div>}
      </Card>
    </div>
    <Card title="Recent deliveries" actions={<span className="badge badge-ghost">Demo history</span>}>
      {config.url ? <div className="overflow-x-auto"><table className="table"><thead><tr><th>Event</th><th>Endpoint</th><th>Status</th><th>Attempts</th><th>Recent delivery</th><th /></tr></thead><tbody>{config.events.map((eventName, index) => <tr key={eventName}><td><code className="text-xs">{eventName}</code></td><td className="max-w-64 truncate text-xs">{config.url}</td><td><StatusBadge status={index === 0 ? 'confirmed' : 'pending'} /></td><td>{index === 0 ? 1 : 2}</td><td className="text-xs">{index === 0 ? 'Just now' : '12 minutes ago'}</td><td><Button className="btn-ghost btn-xs" onClick={() => notify.success(`Test event ${eventName} queued`)}><ArrowClockwise /> Retry</Button></td></tr>)}</tbody></table></div> : <p className="py-6 text-center text-sm opacity-60">No endpoint configured yet.</p>}
      {config.url && <p className="mt-3 text-xs opacity-50">Demo delivery history is illustrative. Live delivery attempts will appear here when webhooks are connected to the OctaP API.</p>}
    </Card>
  </>;
}
