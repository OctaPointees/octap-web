import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useConsoleAuth } from './console-session';
import type { PlatformOrganization } from './portal-api';

export function OrganizationEntry() {
  const { slug = '' } = useParams();
  return <ResolvedOrganization key={slug} slug={slug} />;
}
function ResolvedOrganization({ slug }: { slug: string }) {
  const auth = useConsoleAuth()!;
  const client = auth.client;
  const [resolved, setResolved] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const abort = new AbortController();
    void client()
      .resolveOrganization(slug, abort.signal)
      .then((org) => setResolved(org.organizationId))
      .catch((cause: Error) => {
        if (!abort.signal.aborted) setError(cause.message);
      });
    return () => abort.abort();
  }, [slug, client]);
  const membership = auth.identity?.organizations.find((org) => org.organizationId === resolved);
  return (
    <main className="max-w-xl mx-auto p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Open organization</h1>
      {error ? (
        <p role="alert">{error}</p>
      ) : !resolved ? (
        <p role="status">Resolving organization…</p>
      ) : membership ? (
        <>
          <p>{membership.name}</p>
          <button className="btn btn-primary" onClick={() => auth.choose(resolved)}>
            Enter {membership.name}
          </button>
        </>
      ) : (
        <p role="alert">
          Your account does not have access to this organization. Ask its Business Owner for an
          invitation.
        </p>
      )}
      <Link to="/organizations" className="link">
        Choose another organization
      </Link>
    </main>
  );
}

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
  const [candidates, setCandidates] = useState<
    Array<{ id: string; email: string; fullName: string }>
  >([]);
  const [type, setType] = useState('INDIVIDUAL_HOUSEHOLD');
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
      {createOpen && (
        <div className="card border border-base-300 p-5 flex flex-col gap-4">
          <form
            className="flex flex-wrap gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const q = String(new FormData(event.currentTarget).get('ownerSearch'));
              void mutate(async () => setCandidates(await client().ownerCandidates(q)));
            }}
          >
            <label>
              Find initial Owner
              <input
                name="ownerSearch"
                minLength={2}
                maxLength={160}
                required
                className="input input-bordered"
              />
            </label>
            <button className="btn btn-outline" disabled={busy}>
              Find Google user
            </button>
          </form>
          <form
            className="flex flex-wrap gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              const fields = new FormData(event.currentTarget);
              const input = {
                name: String(fields.get('name')),
                slug: String(fields.get('slug')),
                organizationType: type,
                ownerUserId: String(fields.get('ownerUserId')),
                ...(type === 'COMPANY'
                  ? {
                      legalName: String(fields.get('legalName')),
                      taxId: String(fields.get('taxId')),
                    }
                  : { representativeName: String(fields.get('representativeName')) }),
              };
              void mutate(async () => {
                await auth.perform(async (api) => {
                  await api.createPlatformOrganization(input);
                }, 'Organization application created. Review it before provisioning.');
              });
            }}
          >
            <label>
              Initial Business Owner
              <select
                name="ownerUserId"
                aria-label="Initial Business Owner"
                required
                className="select select-bordered"
              >
                <option value="">Choose a Google user</option>
                {candidates.map((user) => (
                  <option value={user.id} key={user.id}>
                    {user.fullName} ({user.email})
                  </option>
                ))}
              </select>
            </label>
            <label>
              New organization name
              <input
                name="name"
                required
                minLength={2}
                maxLength={160}
                className="input input-bordered"
              />
            </label>
            <label>
              Organization slug
              <input
                name="slug"
                required
                pattern="[a-z0-9][a-z0-9-]{1,46}[a-z0-9]"
                className="input input-bordered"
              />
            </label>
            <label>
              New organization type
              <select
                aria-label="New organization type"
                className="select select-bordered"
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                <option value="INDIVIDUAL_HOUSEHOLD">Individual / Household business</option>
                <option value="COMPANY">Company</option>
              </select>
            </label>
            {type === 'COMPANY' ? (
              <>
                <label>
                  Legal company name
                  <input name="legalName" required minLength={2} className="input input-bordered" />
                </label>
                <label>
                  Registration / tax number
                  <input name="taxId" required className="input input-bordered" />
                </label>
              </>
            ) : (
              <label>
                Representative name
                <input
                  name="representativeName"
                  required
                  minLength={2}
                  className="input input-bordered"
                />
              </label>
            )}
            <button className="btn btn-primary" disabled={busy || auth.busy}>
              Create organization application
            </button>
          </form>
          {auth.notice && <p role="status">{auth.notice}</p>}
          {auth.error && <p role="alert">{auth.error}</p>}
        </div>
      )}
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
          <p>Business portal path: /orgs/{detail.slug}</p>
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
