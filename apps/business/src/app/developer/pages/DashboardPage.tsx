import { Activity, Key, PlugsConnected, ShareNetwork } from 'phosphor-react';
import { useEffect, useState } from 'react';
import { useMerchantOverview, useApiKeys, useMerchantTenant } from '@/queries/merchant';
import { Card, ErrorState, LoadingBlock, PageHeader, StatCard } from '@/components/shared/Display';
import { Link } from 'react-router';

export default function DeveloperDashboardPage() {
  const tenant = useMerchantTenant();
  const overview = useMerchantOverview('30d');
  const keys = useApiKeys();
  const tenantId = tenant.data?.id;
  const [webhookConfigured, setWebhookConfigured] = useState(false);
  useEffect(() => {
    if (!tenantId) return;
    try {
      const config = JSON.parse(localStorage.getItem(`octap.webhooks:${tenantId}`) ?? '{}') as { url?: string };
      setWebhookConfigured(!!config.url);
    } catch {
      setWebhookConfigured(false);
    }
  }, [tenantId]);
  if (overview.isLoading || tenant.isLoading || keys.isLoading) return <LoadingBlock rows={3} />;
  if (overview.error) return <ErrorState error={overview.error} onRetry={overview.refetch} />;
  if (tenant.error) return <ErrorState error={tenant.error} onRetry={tenant.refetch} />;
  if (keys.error) return <ErrorState error={keys.error} onRetry={keys.refetch} />;
  if (!overview.data || !tenant.data) return null;

  const activeKeys = keys.data?.filter((key) => key.status === 'active').length ?? 0;
  const calls = overview.data.kpis.apiCalls.value;
  const todayCalls = overview.data.series.at(-1)?.apiCalls ?? 0;
  return (
    <>
      <PageHeader title="Developer dashboard" description={`Integration status and API activity for ${tenant.data.name}.`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="API calls (30 days)" value={calls.toLocaleString()} icon={Activity} hint={`${todayCalls.toLocaleString()} today`} />
        <StatCard label="Active API keys" value={activeKeys} icon={Key} hint={`${keys.data?.length ?? 0} total keys`} />
        <StatCard label="Webhook endpoint" value={webhookConfigured ? 'Configured' : 'Not configured'} icon={ShareNetwork} hint={webhookConfigured ? 'Ready to receive events' : 'Set an endpoint to receive events'} />
        <StatCard label="MCP server" value={tenant.data.mcp.enabled ? 'Enabled' : 'Disabled'} icon={PlugsConnected} hint={`${Object.values(tenant.data.mcp.tools).filter(Boolean).length} tools enabled`} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Recent API activity">
          <div className="flex items-end justify-between gap-4">
            <div><div className="text-3xl font-bold">{calls.toLocaleString()}</div><p className="text-sm opacity-60">Requests in the last 30 days</p></div>
            <div className="flex h-20 items-end gap-1" aria-label="API calls over the last seven days">
              {overview.data.series.slice(-7).map((point) => <div key={point.date} title={`${point.date}: ${point.apiCalls} calls`} className="min-w-3 flex-1 rounded-t bg-primary/70" style={{ height: `${Math.max(8, Math.min(100, point.apiCalls / Math.max(1, ...overview.data!.series.slice(-7).map((p) => p.apiCalls)) * 100))}%` }} />)}
            </div>
          </div>
        </Card>
        <Card title="Integration shortcuts">
          <div className="flex flex-col divide-y divide-base-300">
            <Link className="flex items-center justify-between py-3 text-sm hover:text-primary" to="/developer/api-keys">Manage API keys <span aria-hidden>→</span></Link>
            <Link className="flex items-center justify-between py-3 text-sm hover:text-primary" to="/developer/webhooks">Configure webhooks <span aria-hidden>→</span></Link>
            <Link className="flex items-center justify-between py-3 text-sm hover:text-primary" to="/developer/mcp">Manage MCP tools <span aria-hidden>→</span></Link>
          </div>
        </Card>
      </div>
    </>
  );
}
