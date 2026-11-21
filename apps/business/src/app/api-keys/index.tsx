import { useState } from 'react';
import { Key, Plus } from 'phosphor-react';
import type { ConsoleCredential } from '@octap/services';
import { Button } from '@octap/shared/components';
import { Card, EmptyState, ErrorState, PageHeader } from '@/components/shared/Display';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { cn } from '@/utils/cn';
import { CreateKeyDialog } from './components/CreateKeyDialog';
import { KeyTable } from './components/KeyTable';
import { RenameKeyDialog } from './components/RenameKeyDialog';
import { RevokeKeyDialog } from './components/RevokeKeyDialog';
import { isActiveKey } from './domain/keys';
import { useApiKeys } from './hooks/useApiKeys';

type View = 'active' | 'revoked';

/** The organization's API keys. Both Owners and Developers work here, within Core's key rules. */
export default function ApiKeysPage() {
  const { owner } = useOrganization();
  const keys = useApiKeys();
  const [view, setView] = useState<View>('active');
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<ConsoleCredential | null>(null);
  const [revoking, setRevoking] = useState<ConsoleCredential | null>(null);
  const groups: Record<View, ConsoleCredential[]> = {
    active: keys.data?.filter(isActiveKey) ?? [],
    revoked: keys.data?.filter((key) => !isActiveKey(key)) ?? [],
  };
  // The tabs hide without revoked keys, as after switching organization, so don't stay on one.
  const shownView: View = groups.revoked.length ? view : 'active';
  const tabs: { value: View; label: string }[] = [
    { value: 'active', label: 'Active' },
    { value: 'revoked', label: 'Revoked' },
  ];

  return (
    <>
      <PageHeader
        title="API keys"
        description="Your server uses these keys to call OctaP. Keep them out of browsers and mobile apps."
        actions={
          <Button className="btn-primary" onClick={() => setCreating(true)}>
            <span className="flex items-center gap-2">
              <Plus size={16} aria-hidden />
              Create key
            </span>
          </Button>
        }
      />

      {keys.error ? (
        <ErrorState error={keys.error} onRetry={() => void keys.refetch()} />
      ) : !keys.data ? (
        <div className="flex flex-col gap-2 rounded-box border border-base-300 p-4" aria-busy>
          {Array.from({ length: 3 }, (_, row) => (
            <div key={row} className="skeleton h-12 w-full" />
          ))}
        </div>
      ) : !keys.data.length ? (
        <Card>
          <EmptyState
            icon={Key}
            title="No API keys yet"
            description="Create a key to connect your server to OctaP."
            action={
              <Button className="btn-primary btn-sm" onClick={() => setCreating(true)}>
                Create key
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          {groups.revoked.length > 0 && (
            <div
              role="tablist"
              aria-label="Filter by status"
              className="tabs tabs-box tabs-sm w-fit *:min-w-24"
            >
              {tabs.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={view === value}
                  className={cn('tab gap-1.5 transition-all', {
                    'tab-active bg-primary text-primary-content font-bold': view === value,
                  })}
                  onClick={() => setView(value)}
                >
                  {label}
                  <span className="text-xs opacity-60 tabular-nums">{groups[value].length}</span>
                </button>
              ))}
            </div>
          )}
          <KeyTable
            key={shownView}
            keys={groups[shownView]}
            owner={owner}
            emptyMessage={
              shownView === 'active'
                ? 'No active keys. Create one to connect your server.'
                : 'No revoked keys.'
            }
            onRename={setRenaming}
            onRevoke={setRevoking}
          />
        </>
      )}

      <CreateKeyDialog open={creating} onClose={() => setCreating(false)} />
      <RenameKeyDialog apiKey={renaming} onClose={() => setRenaming(null)} />
      <RevokeKeyDialog apiKey={revoking} onClose={() => setRevoking(null)} />
    </>
  );
}
