import { useEffect, useState } from 'react';
import { useConsoleAuth } from './console-session';
import type { ConsoleStaff } from './portal-api';

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
      .catch((cause: Error) => {
        if (!abort.signal.aborted) setError(cause.message);
      });
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
