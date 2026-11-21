import { useState } from 'react';
import { Key, Plus } from 'phosphor-react';
import type { ConsoleCredential } from '@octap/services';
import { Button, useRowFlash } from '@octap/shared/components';
import { Segmented } from '@/components/shared/Controls';
import { Card, EmptyState, ErrorState, PageHeader } from '@/components/shared/Display';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
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
  const { flashRow, isFlashing } = useRowFlash();
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
  const tab = (value: View, label: string) => ({
    value,
    label: (
      <>
        {label}
        <span className="text-xs opacity-70 tabular-nums">{groups[value].length}</span>
      </>
    ),
  });

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
        <div
          className="flex flex-col gap-2 rounded-box border border-base-300 bg-base-100 p-4"
          aria-busy
        >
          {Array.from({ length: 3 }, (_, row) => (
            <div key={row} className="skeleton h-12 w-full" />
          ))}
        </div>
      ) : !keys.data.length ? (
        <Card className="animate-reveal">
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
        <div className="animate-reveal flex flex-col gap-4">
          {groups.revoked.length > 0 && (
            <Segmented
              value={shownView}
              onValueChange={setView}
              options={[tab('active', 'Active'), tab('revoked', 'Revoked')]}
            />
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
            isHighlighted={isFlashing}
            onRename={setRenaming}
            onRevoke={setRevoking}
          />
        </div>
      )}

      <CreateKeyDialog
        open={creating}
        onCreated={(id) => {
          setView('active');
          flashRow(id);
        }}
        onClose={() => setCreating(false)}
      />
      <RenameKeyDialog apiKey={renaming} onRenamed={flashRow} onClose={() => setRenaming(null)} />
      <RevokeKeyDialog apiKey={revoking} onClose={() => setRevoking(null)} />
    </>
  );
}
