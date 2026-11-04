import { useEffect, useState } from 'react';
import { useConsoleAuth, type PlatformOrganization } from '@octap/shared/google-auth';
import { NewOrganizationForm } from './NewOrganizationForm';

export function PlatformOrganizations() {
  const auth = useConsoleAuth()!;
  const client = auth.client;
  const [query, setQuery] = useState({ q: '', status: '' });
  const [cursor, setCursor] = useState('');
  const [rows, setRows] = useState<{ items: PlatformOrganization[]; nextCursor: string | null }>({
    items: [],
    nextCursor: null,
  });
  const [selected, setSelected] = useState('');
  const [detail, setDetail] = useState<PlatformOrganization | null>(null);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState('');
  const [requestType, setRequestType] = useState('SUSPEND');
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [operationKey, setOperationKey] = useState(() => crypto.randomUUID());
  const actionType =
    detail?.status === 'SUSPENDED'
      ? 'REINSTATE'
      : requestType === 'REINSTATE'
        ? 'SUSPEND'
        : requestType;
  useEffect(() => {
    const abort = new AbortController();
    void (async () => {
      try {
        const parameters = new URLSearchParams({ limit: '25' });
        for (const [key, value] of Object.entries(query)) if (value) parameters.set(key, value);
        if (cursor) parameters.set('cursor', cursor);
        setRows(await client().listPlatformOrganizations(parameters, abort.signal));
        setError('');
      } catch (cause) {
        if (!abort.signal.aborted) {
          setRows({ items: [], nextCursor: null });
          setError((cause as Error).message);
        }
      }
    })();
    return () => abort.abort();
  }, [client, query, cursor, revision, auth.revision]);
  useEffect(() => {
    if (!selected) return;
    const abort = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    void client()
      .getPlatformOrganization(selected, abort.signal)
      .then((result) => {
        if (abort.signal.aborted) return;
        setDetail(result);
        if (['PENDING', 'PROCESSING'].includes(result.provisioning?.status || ''))
          timer = setTimeout(() => setRevision((value) => value + 1), 5000);
      })
      .catch((cause: Error) => {
        if (!abort.signal.aborted) {
          setDetail(null);
          setError(cause.message);
        }
      });
    return () => {
      abort.abort();
      if (timer) clearTimeout(timer);
    };
  }, [client, selected, revision, auth.revision]);
  async function mutate(action: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    try {
      await action();
      setRevision((value) => value + 1);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mt-8 flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">Organizations</h2>
      {error && (
        <p role="alert" className="alert alert-error">
          {error}
        </p>
      )}
      <form
        className="flex flex-wrap gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const fields = new FormData(event.currentTarget);
          setQuery({ q: String(fields.get('q')), status: String(fields.get('status')) });
          setCursor('');
        }}
      >
        <label>
          Find organization
          <input name="q" className="input input-bordered" />
        </label>
        <label>
          Organization status
          <select name="status" aria-label="Organization status" className="select select-bordered">
            <option value="">All</option>
            {['ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED', 'ARCHIVED'].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <button className="btn btn-outline">Find organizations</button>
      </form>
      <button
        className="btn btn-primary self-start"
        onClick={() => setCreateOpen((value) => !value)}
      >
        New organization
      </button>
      {createOpen && <NewOrganizationForm />}
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Organization</th>
              <th>Status</th>
              <th>Program</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.items.map((org) => (
              <tr key={org.id}>
                <td>
                  {org.name} · {org.slug}
                </td>
                <td>{org.status}</td>
                <td>{org.programStatus || 'Not provisioned'}</td>
                <td>
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      setDetail(null);
                      setSelected(org.id);
                      setOperationKey(crypto.randomUUID());
                      setRequestType(org.status === 'SUSPENDED' ? 'REINSTATE' : 'SUSPEND');
                    }}
                  >
                    Manage {org.name}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3">
        <button className="btn btn-outline" disabled={!cursor} onClick={() => setCursor('')}>
          First organizations
        </button>
        <button
          className="btn btn-outline"
          disabled={!rows.nextCursor}
          onClick={() => setCursor(rows.nextCursor!)}
        >
          More organizations
        </button>
      </div>
      {detail && detail.id === selected && (
        <section className="card border border-base-300 p-5 flex flex-col gap-3">
          <h3 className="text-xl font-semibold">Manage {detail.name}</h3>
          <p>
            {detail.status} · {detail.organizationType}
          </p>
          {import.meta.env.VITE_ENABLE_ORG_SLUG_ENTRY === 'true' && (
            <p>Business portal path: /orgs/{detail.slug}</p>
          )}
          <p>
            Program: {detail.programStatus || 'Not provisioned'} · {detail.programControlId}
          </p>
          <p role="status">Provisioning: {detail.provisioning?.status || 'Not requested'}</p>
          {detail.provisioning?.errorMessage && (
            <p role="alert">{detail.provisioning.errorMessage}</p>
          )}
          <button
            className="btn btn-outline self-start"
            onClick={() => setRevision((value) => value + 1)}
          >
            Refresh organization status
          </button>
          {detail.status === 'ACTIVE' &&
            !detail.programStatus &&
            !['PENDING', 'PROCESSING', 'UNKNOWN'].includes(detail.provisioning?.status || '') && (
              <form
                className="flex flex-wrap gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const fields = new FormData(event.currentTarget);
                  void mutate(async () => {
                    await client().provisionOrganization(detail.id, {
                      earnBps: Number(fields.get('earnBps')),
                      expiryDays: Number(fields.get('expiryDays')),
                      totalBudget: Number(fields.get('totalBudget')),
                      shardCount: Number(fields.get('shardCount')),
                      idempotencyKey: operationKey,
                    });
                    setOperationKey(crypto.randomUUID());
                  });
                }}
              >
                <label>
                  Earn rate (basis points)
                  <input
                    name="earnBps"
                    type="number"
                    min={0}
                    max={10000}
                    defaultValue={100}
                    required
                    className="input input-bordered"
                  />
                </label>
                <label>
                  Point expiry days
                  <input
                    name="expiryDays"
                    type="number"
                    min={1}
                    max={3650}
                    defaultValue={365}
                    required
                    className="input input-bordered"
                  />
                </label>
                <label>
                  Issuance budget
                  <input
                    name="totalBudget"
                    type="number"
                    min={1}
                    defaultValue={100000}
                    required
                    className="input input-bordered"
                  />
                </label>
                <label>
                  Shard count
                  <input
                    name="shardCount"
                    type="number"
                    min={1}
                    max={16}
                    defaultValue={1}
                    required
                    className="input input-bordered"
                  />
                </label>
                <button className="btn btn-primary" disabled={busy}>
                  Request program provisioning
                </button>
              </form>
            )}
          {['ACTIVE', 'SUSPENDED'].includes(detail.status) && (
            <form
              className="flex flex-wrap gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                const fields = new FormData(event.currentTarget);
                void mutate(() =>
                  auth.perform(async (api) => {
                    await api.proposeChange(
                      detail.id,
                      {
                        requestType: actionType,
                        payload:
                          actionType === 'UPDATE_PROFILE'
                            ? { name: String(fields.get('name')) }
                            : {},
                        reason: String(fields.get('reason')),
                      },
                      true,
                    );
                  }, 'Organization change submitted for review.'),
                );
              }}
            >
              <label>
                Platform requested change
                <select
                  aria-label="Platform requested change"
                  className="select select-bordered"
                  value={actionType}
                  onChange={(event) => setRequestType(event.target.value)}
                >
                  {detail.status === 'SUSPENDED' ? (
                    <option value="REINSTATE">Reinstate organization</option>
                  ) : (
                    <>
                      <option value="SUSPEND">Suspend organization</option>
                      <option value="DEACTIVATE">Deactivate organization</option>
                      <option value="UPDATE_PROFILE">Change display name</option>
                    </>
                  )}
                </select>
              </label>
              {actionType === 'UPDATE_PROFILE' && (
                <label>
                  Platform requested name
                  <input
                    name="name"
                    required
                    minLength={2}
                    maxLength={160}
                    className="input input-bordered"
                  />
                </label>
              )}
              <label>
                Platform change reason
                <input name="reason" required maxLength={1000} className="input input-bordered" />
              </label>
              <button className="btn btn-outline" disabled={busy || auth.busy}>
                Submit platform change
              </button>
            </form>
          )}
        </section>
      )}
    </section>
  );
}
