import { Warning } from 'phosphor-react';
import { Card, ErrorState, LoadingBlock, PageHeader } from '@/components/shared/Display';
import { Switch } from '@/components/shared/Controls';
import { useMerchantTenant, useUpdateMcp } from '@/queries/merchant';
import type { McpTool } from '@/types/domain';
import { notify } from '@/utils/toast';

const TOOLS: { tool: McpTool; description: string; sensitive?: boolean }[] = [
  { tool: 'get_balance', description: 'Look up a member’s points balance by phone' },
  { tool: 'list_campaigns', description: 'List active and scheduled campaigns' },
  { tool: 'list_rewards', description: 'List available rewards' },
  { tool: 'get_member_history', description: 'Read a member’s points history' },
  { tool: 'create_campaign', description: 'Create campaign drafts', sensitive: true },
  { tool: 'issue_points', description: 'Issue points to members, subject to the monthly cap', sensitive: true },
];

export default function DeveloperMcpPage() {
  const tenant = useMerchantTenant();
  const update = useUpdateMcp();
  if (tenant.isLoading) return <LoadingBlock rows={2} />;
  if (tenant.error) return <ErrorState error={tenant.error} onRetry={tenant.refetch} />;
  const business = tenant.data;
  if (!business) return null;
  const unavailable = business.plan === 'starter';
  const set = (patch: Parameters<typeof update.mutate>[0]) => update.mutate(patch, { onError: (error) => notify.error(error), onSuccess: () => notify.success('MCP settings updated') });

  return <>
    <PageHeader title="MCP tools" description="Control which tools AI agents can call for this business." />
    {unavailable && <div className="alert alert-warning alert-soft"><Warning /> MCP access is available on Growth and Enterprise plans.</div>}
    <Card title="MCP server" className="max-w-4xl">
      <Switch checked={business.mcp.enabled} disabled={unavailable || update.isPending} onCheckedChange={(enabled) => set({ enabled })} label="Enable MCP server" description="Allow connected agents to use the selected tools for this business." />
      <div className="mt-4 rounded-box bg-base-200 p-3 font-mono text-sm">https://mcp.octap.io/{business.slug}</div>
    </Card>
    <Card title="Available tools" className="max-w-4xl">
      <div className="divide-y divide-base-300">{TOOLS.map(({ tool, description, sensitive }) => <div key={tool} className="flex items-center justify-between gap-4 py-4"><div><div className="flex items-center gap-2 font-mono text-sm">{tool}{sensitive && <span className="badge badge-warning badge-xs">Writes data</span>}</div><p className="mt-1 text-xs opacity-60">{description}</p></div><Switch checked={business.mcp.tools[tool]} disabled={unavailable || !business.mcp.enabled || update.isPending} onCheckedChange={(toolEnabled) => set({ tool, toolEnabled })} label="" /></div>)}</div>
    </Card>
  </>;
}
