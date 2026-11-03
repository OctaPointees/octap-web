import { useEffect, useState } from 'react';
import { useConsoleAuth, type GovernanceRequest } from '@octap/shared/google-auth';

export function GovernanceReview() {
  const auth = useConsoleAuth()!;
  const client = auth.client;
  const [status, setStatus] = useState('PENDING');
  const [cursor, setCursor] = useState('');
  const [data, setData] = useState<{ items: GovernanceRequest[]; nextCursor: string | null }>({
    items: [],
    nextCursor: null,
  });
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
  }, [client, status, cursor, auth.revision]);
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
      {auth.error && <p role="alert">{auth.error}</p>}
      {data?.items.length === 0 && <p>No organization change requests.</p>}
      {data?.items.map((request) => (
        <article key={request.id} className="card border border-base-300 p-5">
          <h3 className="font-semibold">
            {request.requestType.replaceAll('_', ' ')} · {request.status}
          </h3>
          <p>Organization: {request.organizationName || request.organizationId}</p>
          <p>Requested by: {request.requesterEmail}</p>
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
              Reviewed by {request.reviewerEmail || 'Unavailable'} · {request.reason}
            </p>
          )}
          {request.status === 'PENDING' && (
            <form
              className="flex flex-wrap gap-3 mt-3"
              onSubmit={(event) => event.preventDefault()}
              onClick={(event) => {
                const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
                  'button[data-decision]',
                );
                if (!button || !event.currentTarget.reportValidity()) return;
                const fields = new FormData(event.currentTarget);
                setBusy(true);
                setError('');
                void auth
                  .perform(async () => {
                    await client().decideChange(
                      request.id,
                      button.dataset.decision as 'approve' | 'reject',
                      String(fields.get('reason')),
                    );
                  }, 'Organization decision recorded')
                  .then(() => {
                    setCursor('');
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
              <button
                type="button"
                className="btn btn-primary"
                data-decision="approve"
                disabled={busy}
              >
                Approve {request.requestType}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                data-decision="reject"
                disabled={busy}
              >
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
