import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiCredentialsApi, type ConsoleCredential } from '@octap/services';
import { useAuth } from '@octap/shared/authentication';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { useState } from 'react';
import { Key, PencilSimple, Plus, Warning } from 'phosphor-react';
import { Button } from '@/components/shared/Button';
import { CopyButton, TextInput } from '@/components/shared/Controls';
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  StatusBadge,
} from '@/components/shared/Display';
import { ConfirmDialog, Modal } from '@/components/shared/Modal';
import { fmtDate, fmtRelative } from '@/utils/format';
import { notify } from '@/utils/toast';

export default function DeveloperApiKeysPage() {
  const auth = useAuth();
  const organization = useOrganization();
  const orgId = organization.organizationId;
  const cache = useQueryClient();
  const queryKey = ['console-api-credentials', orgId];
  const api = createApiCredentialsApi(auth.client().request);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [scope, setScope] = useState<'read' | 'write'>('read');
  const [issuedSecret, setIssuedSecret] = useState<string | null>(null);
  const [editing, setEditing] = useState<ConsoleCredential | null>(null);
  const [editName, setEditName] = useState('');
  const [revoking, setRevoking] = useState<ConsoleCredential | null>(null);
  const keys = useQuery({
    queryKey,
    queryFn: ({ signal }) => api.list(orgId, signal),
  });
  const refresh = () => cache.invalidateQueries({ queryKey });
  const create = useMutation({
    mutationFn: () => api.issue(orgId, { name: name.trim(), scope }),
    onSuccess: (result) => {
      void refresh();
      setCreating(false);
      setIssuedSecret(result.rawKey);
      setName('');
      setScope('read');
      notify.success('API key created');
    },
    onError: notify.error,
  });
  const rename = useMutation({
    mutationFn: () => api.rename(orgId, editing!.id, editName.trim()),
    onSuccess: () => {
      void refresh();
      setEditing(null);
      notify.success('API key renamed');
    },
    onError: notify.error,
  });
  const revoke = useMutation({
    mutationFn: () => api.revoke(orgId, revoking!.id),
    onSuccess: () => {
      void refresh();
      setRevoking(null);
      notify.success('API key revoked');
    },
    onError: notify.error,
  });

  return (
    <>
      <PageHeader
        title="API keys"
        description="Create and manage credentials for your organization's integrations."
        actions={
          <Button className="btn-primary" onClick={() => setCreating(true)}>
            <Plus /> Create key
          </Button>
        }
      />
      <Card title="Keep keys secure">
        <p className="text-sm opacity-70">
          Use keys only from your server. A newly created secret is shown once; store it securely.
        </p>
      </Card>
      {keys.error && <ErrorState error={keys.error} onRetry={() => void keys.refetch()} />}
      {keys.isLoading && <LoadingBlock rows={2} />}
      {keys.data?.length === 0 && (
        <EmptyState icon={Key} title="No API keys yet" description="Create a key to get started." />
      )}
      {!!keys.data?.length && (
        <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Key</th>
                <th>Scopes</th>
                <th>Created</th>
                <th>Last used</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {keys.data.map((key) => {
                const active = key.status.toLowerCase() === 'active';
                const canManage = organization.owner || !key.scopes.includes('write');
                return (
                  <tr key={key.id}>
                    <td className="font-medium">{key.name}</td>
                    <td className="font-mono text-xs">{key.keyPrefix}••••</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.map((value) => (
                          <span className="badge badge-ghost badge-xs" key={value}>
                            {value}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-xs">
                      {key.createdAt ? fmtDate(key.createdAt) : 'Unknown'}
                    </td>
                    <td className="text-xs">
                      {key.lastUsedAt ? fmtRelative(key.lastUsedAt) : 'Never'}
                    </td>
                    <td>
                      <StatusBadge status={key.status.toLowerCase()} />
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {canManage && (
                          <Button
                            className="btn-ghost btn-xs"
                            aria-label={`Rename ${key.name}`}
                            onClick={() => {
                              setEditing(key);
                              setEditName(key.name);
                            }}
                          >
                            <PencilSimple />
                          </Button>
                        )}
                        {active && canManage && (
                          <Button
                            className="btn-ghost btn-xs text-error"
                            aria-label={`Revoke ${key.name}`}
                            onClick={() => setRevoking(key)}
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {creating && (
        <Modal
          open
          onOpenChange={(open) => !open && setCreating(false)}
          title="Create API key"
          size="md"
          footer={
            <>
              <Button onClick={() => setCreating(false)}>Cancel</Button>
              <Button
                className="btn-primary"
                disabled={!name.trim() || create.isPending}
                onClick={() => create.mutate()}
              >
                {create.isPending ? 'Creating…' : 'Create key'}
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm">
              Key name
              <TextInput
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Production backend"
                maxLength={100}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Access scope
              <select
                className="select"
                value={scope}
                onChange={(event) => setScope(event.target.value as 'read' | 'write')}
              >
                <option value="read">Read only</option>
                {organization.owner && <option value="write">Read and write</option>}
              </select>
            </label>
            {!organization.owner && (
              <p className="text-xs opacity-60">
                Only an owner can create a key with write access.
              </p>
            )}
          </div>
        </Modal>
      )}
      {editing && (
        <Modal
          open
          onOpenChange={(open) => !open && setEditing(null)}
          title="Rename API key"
          size="sm"
          footer={
            <>
              <Button onClick={() => setEditing(null)}>Cancel</Button>
              <Button
                className="btn-primary"
                disabled={!editName.trim() || rename.isPending}
                onClick={() => rename.mutate()}
              >
                {rename.isPending ? 'Saving…' : 'Save name'}
              </Button>
            </>
          }
        >
          <label className="flex flex-col gap-1 text-sm">
            Key name
            <TextInput
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              maxLength={100}
            />
          </label>
        </Modal>
      )}
      {issuedSecret && (
        <Modal
          open
          onOpenChange={(open) => !open && setIssuedSecret(null)}
          title="Save your secret key"
          description="This is the only time the full key is shown. Store it securely."
          size="md"
          footer={
            <Button className="btn-primary" onClick={() => setIssuedSecret(null)}>
              I’ve saved it
            </Button>
          }
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 break-all rounded-box bg-base-200 p-3 font-mono text-xs">
              <span className="flex-1">{issuedSecret}</span>
              <CopyButton value={issuedSecret} label="Copy" />
            </div>
            <div className="alert alert-warning alert-soft text-xs">
              <Warning size={16} /> Never embed a key in a browser or mobile app.
            </div>
          </div>
        </Modal>
      )}
      {revoking && (
        <ConfirmDialog
          open
          title="Revoke API key?"
          description={`“${revoking.name}” will stop working immediately.`}
          confirmLabel="Revoke key"
          tone="error"
          onOpenChange={(open) => !open && setRevoking(null)}
          onConfirm={() => revoke.mutate()}
          loading={revoke.isPending}
        />
      )}
    </>
  );
}
