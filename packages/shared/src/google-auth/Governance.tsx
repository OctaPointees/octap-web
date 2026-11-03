import { useEffect, useState } from 'react';
import { useConsoleAuth } from './console-session';
import type { ConsoleStaff, GovernanceRequest } from './portal-api';

export function OrganizationChangeForm() {
  const auth = useConsoleAuth()!;
  const client = auth.client;
  const orgId = auth.organizationId;
  const [staff, setStaff] = useState<ConsoleStaff[]>([]);
  const [type, setType] = useState('TRANSFER_OWNERSHIP');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    void client()
      .listConsoleStaff(orgId, abort.signal)
      .then(setStaff)
      .catch(() => {});
    return () => abort.abort();
  }, [client, orgId]);
  return (
    <section className="card border border-base-300 p-5 mt-6">
      <h2 className="text-xl font-semibold">Organization change request</h2>
      <p>
        Changes take effect after System Admin approval. Suspension blocks organization access;
        deactivation permanently archives it.
      </p>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <form
        className="flex flex-wrap gap-4 mt-4"
        onSubmit={(event) => {
          event.preventDefault();
          const fields = new FormData(event.currentTarget);
          setBusy(true);
          setError('');
          setNotice('');
          const payload =
            type === 'TRANSFER_OWNERSHIP'
              ? { targetUserId: String(fields.get('targetUserId')) }
              : type === 'UPDATE_PROFILE'
                ? { name: String(fields.get('name')) }
                : {};
          void client()
            .proposeChange(orgId, {
              requestType: type,
              reason: String(fields.get('reason')),
              payload,
            })
            .then(() => setNotice('Change request submitted for review.'))
            .catch((cause: Error) => setError(cause.message))
            .finally(() => setBusy(false));
        }}
      >
        <label>
          Requested change
          <select
            aria-label="Requested change"
            className="select select-bordered"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="TRANSFER_OWNERSHIP">Transfer ownership</option>
            <option value="UPDATE_PROFILE">Change display name</option>
            <option value="SUSPEND">Suspend organization</option>
            <option value="DEACTIVATE">Deactivate organization</option>
          </select>
        </label>
        {type === 'TRANSFER_OWNERSHIP' && (
          <label>
            New Business Owner
            <select
              aria-label="New Business Owner"
              name="targetUserId"
              required
              className="select select-bordered"
            >
              <option value="">Choose an active Developer</option>
              {staff
                .filter(
                  (person) => person.persona === 'BUSINESS_DEVELOPER' && person.status === 'ACTIVE',
                )
                .map((person) => (
                  <option value={person.id} key={person.id}>
                    {person.fullName} ({person.email})
                  </option>
                ))}
            </select>
          </label>
        )}
        {type === 'UPDATE_PROFILE' && (
          <label>
            Requested display name
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
          Request reason
          <input name="reason" required maxLength={1000} className="input input-bordered" />
        </label>
        <button className="btn btn-primary" disabled={busy}>
          Submit change request
        </button>
      </form>
    </section>
  );
}

export function GovernanceReview() {
  const auth = useConsoleAuth()!;
  const client = auth.client;
  const [status, setStatus] = useState('PENDING');
  const [cursor, setCursor] = useState('');
  const [data, setData] = useState<{ items: GovernanceRequest[]; nextCursor: string | null }>({
    items: [],
    nextCursor: null,
  });
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    void (async () => {
      try {
        const query = new URLSearchParams({ limit: '25' });
        if (status) query.set('status', status);
        if (cursor) query.set('cursor', cursor);
        const result = await client().listChanges(query, abort.signal);
        setData(result);
        setError('');
      } catch (cause) {
        if (!abort.signal.aborted) {
          setData({ items: [], nextCursor: null });
          setError((cause as Error).message);
        }
      }
    })();
    return () => abort.abort();
  }, [client, status, cursor, revision]);
  return (
    <section className="mt-8 flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">Organization governance</h2>
      <label>
        Request status
        <select
          aria-label="Request status"
          className="select select-bordered"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setCursor('');
          }}
        >
          <option>PENDING</option>
          <option>APPROVED</option>
          <option>REJECTED</option>
          <option value="">All</option>
        </select>
      </label>
      {error && (
        <p role="alert" className="alert alert-error">
          {error}
        </p>
      )}
      {data?.items.length === 0 && <p>No organization change requests.</p>}
      {data?.items.map((request) => (
        <article key={request.id} className="card border border-base-300 p-5">
          <h3 className="font-semibold">
            {request.requestType.replaceAll('_', ' ')} · {request.status}
          </h3>
          <p>Organization: {request.organizationName || request.organizationId}</p>
          <p>Request reason: {request.payload.requestedReason || request.reason}</p>
          {request.payload.name && <p>Proposed name: {request.payload.name}</p>}
          {request.payload.targetUserId && (
            <p>
              New Owner: {request.payload.targetName || request.payload.targetUserId} (
              {request.payload.targetEmail})
            </p>
          )}
          {request.reviewedById && (
            <p>
              Reviewed by {request.reviewedById} · {request.reason}
            </p>
          )}
          {request.status === 'PENDING' && (
            <form
              className="flex flex-wrap gap-3 mt-3"
              onSubmit={(event) => {
                event.preventDefault();
                const fields = new FormData(event.currentTarget);
                const button = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement;
                setBusy(true);
                setError('');
                void client()
                  .decideChange(
                    request.id,
                    button.value as 'approve' | 'reject',
                    String(fields.get('reason')),
                  )
                  .then(() => {
                    setCursor('');
                    setRevision((value) => value + 1);
                  })
                  .catch((cause: Error) => setError(cause.message))
                  .finally(() => setBusy(false));
              }}
            >
              <label>
                Review reason
                <input
                  aria-label={`Review reason ${request.id}`}
                  name="reason"
                  required
                  maxLength={1000}
                  className="input input-bordered"
                />
              </label>
              <button className="btn btn-primary" value="approve" disabled={busy}>
                Approve {request.requestType}
              </button>
              <button className="btn btn-outline" value="reject" disabled={busy}>
                Reject {request.requestType}
              </button>
            </form>
          )}
        </article>
      ))}
      <div className="flex gap-3">
        <button className="btn btn-outline" disabled={!cursor} onClick={() => setCursor('')}>
          First requests
        </button>
        <button
          className="btn btn-outline"
          disabled={!data?.nextCursor}
          onClick={() => setCursor(data!.nextCursor!)}
        >
          More requests
        </button>
      </div>
    </section>
  );
}
