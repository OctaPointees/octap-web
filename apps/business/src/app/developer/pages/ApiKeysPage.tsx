import { useState } from 'react';
import { Key, Plus, Warning } from 'phosphor-react';
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
import { useBillingState } from '@/queries/merchant';
import type { ApiKey, ApiScope } from '@/types/domain';
import { fmtCompact, fmtDate, fmtRelative } from '@/utils/format';
import { notify } from '@/utils/toast';
import { Link } from 'react-router';

const SCOPES: { value: ApiScope; description: string }[] = [
  { value: 'points:earn', description: 'Issue points at checkout' },
  { value: 'points:redeem', description: 'Redeem member points' },
  { value: 'balances:read', description: 'Read member balances' },
  { value: 'members:read', description: 'Read member profiles and history' },
  { value: 'campaigns:read', description: 'Read campaigns' },
  { value: 'campaigns:write', description: 'Create and update campaigns' },
];

export default function DeveloperApiKeysPage() {
  const keys = useApiKeys();
  const billing = useBillingState();
  const create = useCreateApiKey();
  const revoke = useRevokeApiKey();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [env, setEnv] = useState<ApiKey['env']>('test');
  const [scopes, setScopes] = useState<ApiScope[]>(['points:earn', 'balances:read']);
  const [secret, setSecret] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<ApiKey | null>(null);
  const [nameError, setNameError] = useState('');
  const productionUnlocked = billing.data?.status === 'active' && billing.data.plan !== 'sandbox';

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
              {productionUnlocked ? <Segmented value={env} onValueChange={setEnv} options={[{ label: 'Test (testnet)', value: 'test' }, { label: 'Production (mainnet)', value: 'live' }]} /> : <><Segmented value="test" onValueChange={() => setEnv('test')} options={[{ label: 'Sandbox test key', value: 'test' }]} /><p className="mt-2 text-xs opacity-65">Production keys require an active subscription. <Link className="link link-primary" to="/developer/billing">View plans and upgrade</Link>.</p></>}
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
