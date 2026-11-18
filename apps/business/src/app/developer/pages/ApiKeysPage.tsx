import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiCredentialsApi, type ConsoleCredential } from '@octap/services';
import { useConsoleAuth } from '@octap/shared/google-auth';
import { useState } from 'react';
import { Key, PencilSimple, Plus, Warning } from 'phosphor-react';
import { Button } from '@/components/shared/Button';
import { CopyButton, Segmented, TextInput } from '@/components/shared/Controls';
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  StatusBadge,
} from '@/components/shared/Display';
import { ConfirmDialog, Modal } from '@/components/shared/Modal';
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '@/queries/merchant';
import type { ApiKey, ApiScope } from '@/types/domain';
import { fmtCompact, fmtDate, fmtRelative } from '@/utils/format';
import { notify } from '@/utils/toast';

const SCOPES: { value: ApiScope; description: string }[] = [
  { value: 'points:earn', description: 'Issue points at checkout' },
  { value: 'points:redeem', description: 'Redeem member points' },
  { value: 'balances:read', description: 'Read member balances' },
  { value: 'members:read', description: 'Read member profiles and history' },
  { value: 'campaigns:read', description: 'Read campaigns' },
  { value: 'campaigns:write', description: 'Create and update campaigns' },
];

function DemoDeveloperApiKeysPage() {
  const keys = useApiKeys();
  const create = useCreateApiKey();
  const revoke = useRevokeApiKey();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [env, setEnv] = useState<ApiKey['env']>('test');
  const [scopes, setScopes] = useState<ApiScope[]>(['points:earn', 'balances:read']);
  const [secret, setSecret] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<ApiKey | null>(null);
  const [nameError, setNameError] = useState('');

  const submit = () => {
    setNameError('');
    create.mutate(
      { name, env, scopes },
      {
        onSuccess: (result) => {
          setSecret(result.secret);
          void keys.refetch();
        },
        onError: (error) => {
          const fieldErrors = (error as { fieldErrors?: Record<string, string> }).fieldErrors;
          if (fieldErrors?.name) setNameError(fieldErrors.name);
          else notify.error(error);
        },
      },
    );
  };

  return (
    <>
      <PageHeader
        title="API keys"
        description="Create tenant-scoped credentials for your POS and backend integrations."
        actions={
          <Button className="btn-primary" onClick={() => setCreating(true)}>
            <Plus /> Create key
          </Button>
        }
      />
      <Card title="Keep keys secure">
        <p className="text-sm opacity-70">
          Use keys only from your server. Never include a live key in a browser or mobile app. Each
          key is limited to the scopes selected when it is created.
        </p>
      </Card>
      {keys.error && <ErrorState error={keys.error} onRetry={keys.refetch} />}
      {keys.isLoading && <LoadingBlock rows={2} />}
      {keys.data?.length === 0 && (
        <EmptyState
          icon={Key}
          title="No API keys yet"
          description="Create a test key to start an integration."
        />
      )}
      {!!keys.data?.length && (
        <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100 flex-1">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Key</th>
                <th>Scopes</th>
                <th>Usage (30d)</th>
                <th>Last used</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {keys.data.map((key) => (
                <tr key={key.id}>
                  <td>
                    <div className="font-medium">{key.name}</div>
                    <div className="text-xs opacity-60">Created {fmtDate(key.createdAt)}</div>
                  </td>
                  <td className="font-mono text-xs">
                    {key.prefix}_••••{' '}
                    <span
                      className={`badge badge-xs ml-2 ${key.env === 'live' ? 'badge-primary' : 'badge-ghost'}`}
                    >
                      {key.env}
                    </span>
                  </td>
                  <td>
                    <div className="flex max-w-xs flex-wrap gap-1">
                      {key.scopes.map((scope) => (
                        <span key={scope} className="badge badge-ghost badge-xs font-mono">
                          {scope}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>{fmtCompact(key.requests30d)}</td>
                  <td className="text-xs">
                    {key.lastUsedAt ? fmtRelative(key.lastUsedAt) : 'Never'}
                  </td>
                  <td>
                    <StatusBadge status={key.status} />
                  </td>
                  <td>
                    {key.status === 'active' && (
                      <Button
                        className="btn-ghost btn-xs text-error"
                        onClick={() => setRevoking(key)}
                      >
                        Revoke
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {creating && !secret && (
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
                disabled={!name.trim() || !scopes.length || create.isPending}
                onClick={submit}
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
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. District 1 POS"
                invalid={!!nameError}
              />
            </label>
            {nameError && <p className="text-xs text-error">{nameError}</p>}
            <div>
              <p className="mb-2 text-sm font-medium">Environment</p>
              <Segmented
                value={env}
                onValueChange={setEnv}
                options={[
                  { label: 'Test (testnet)', value: 'test' },
                  { label: 'Live (mainnet)', value: 'live' },
                ]}
              />
            </div>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium">Scopes</legend>
              {SCOPES.map((scope) => (
                <label key={scope.value} className="flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={scopes.includes(scope.value)}
                    onChange={(e) =>
                      setScopes((old) =>
                        e.target.checked
                          ? [...old, scope.value]
                          : old.filter((value) => value !== scope.value),
                      )
                    }
                  />
                  <span>
                    <code>{scope.value}</code>
                    <span className="ml-2 text-xs opacity-60">{scope.description}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            {scopes.length === 0 && (
              <p className="text-xs text-error">Choose at least one scope.</p>
            )}
          </div>
        </Modal>
      )}
      {secret && (
        <Modal
          open
          onOpenChange={(open) => !open && setSecret(null)}
          title="Save your secret key"
          description="This is the only time the full key is shown. Save it in your server’s secret manager."
          size="md"
          footer={
            <Button
              className="btn-primary"
              onClick={() => {
                setSecret(null);
                setCreating(false);
                setName('');
              }}
            >
              I’ve saved it
            </Button>
          }
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 break-all rounded-box bg-base-200 p-3 font-mono text-xs">
              <span className="flex-1">{secret}</span>
              <CopyButton value={secret} label="Copy" />
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
          onConfirm={() =>
            revoke.mutate(revoking.id, {
              onSuccess: () => {
                notify.success('API key revoked');
                setRevoking(null);
              },
              onError: notify.error,
            })
          }
          loading={revoke.isPending}
        />
      )}
    </>
  );
}

export default function DeveloperApiKeysPage() {
  return import.meta.env.VITE_ENABLE_DEMO_AUTH === 'true' ? (
    <DemoDeveloperApiKeysPage />
  ) : (
    <ConnectedApiKeysPage />
  );
}

function ConnectedApiKeysPage() {
  const auth = useConsoleAuth()!;
  const orgId = auth.organizationId;
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
                const canManage = auth.owner || !key.scopes.includes('write');
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
                    <td className="text-xs">{key.createdAt ? fmtDate(key.createdAt) : '—'}</td>
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
                className="select select-bordered"
                value={scope}
                onChange={(event) => setScope(event.target.value as 'read' | 'write')}
              >
                <option value="read">Read only</option>
                {auth.owner && <option value="write">Read and write</option>}
              </select>
            </label>
            {!auth.owner && (
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
