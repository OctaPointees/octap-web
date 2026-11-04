import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useConsoleAuth } from '@octap/shared/google-auth';
import { PageHeader } from '@/components/shared/Display';

export default function ConnectedMembers() {
  const auth = useConsoleAuth()!;
  const cache = useQueryClient();
  const [filters, setFilters] = useState({ q: '', status: '', externalMemberId: '' });
  const [cursors, setCursors] = useState<string[]>(['']);
  const [selected, setSelected] = useState('');
  const [formError, setFormError] = useState('');
  const orgId = auth.organizationId;
  const prefix = ['console-members', orgId];
  const list = useQuery({
    queryKey: [...prefix, filters, cursors.at(-1)],
    queryFn: ({ signal }) => {
      const query = new URLSearchParams({ limit: '25' });
      for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
      if (cursors.at(-1)) query.set('cursor', cursors.at(-1)!);
      return auth.client().listMembers(orgId, query, signal);
    },
    enabled: Boolean(auth.data.organization),
  });
  const detail = useQuery({
    queryKey: [...prefix, 'detail', selected],
    queryFn: ({ signal }) => auth.client().getMember(orgId, selected, signal),
    enabled: Boolean(selected),
  });
  const update = useMutation({
    mutationFn: (input: object) => auth.client().updateMember(orgId, selected, input),
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: prefix });
    },
  });
  return (
    <>
      <PageHeader
        title="Members"
        description="Customer loyalty enrollments in this organization. Staff access is managed separately."
      />
      <form
        className="flex flex-wrap gap-3 mb-5"
        onSubmit={(event) => {
          event.preventDefault();
          const fields = new FormData(event.currentTarget);
          setFilters({
            q: String(fields.get('q')),
            status: String(fields.get('status')),
            externalMemberId: String(fields.get('externalMemberId')),
          });
          setCursors(['']);
          setSelected('');
        }}
      >
        <label>
          Search members
          <input
            name="q"
            className="input input-bordered"
            placeholder="Name, email, phone or POS ID"
          />
        </label>
        <label>
          Enrollment status
          <select name="status" className="select select-bordered">
            <option value="">All</option>
            <option>ACTIVE</option>
            <option>BLOCKED</option>
          </select>
        </label>
        <label>
          External member ID
          <input name="externalMemberId" className="input input-bordered" />
        </label>
        <button className="btn btn-primary">Search</button>
      </form>
      {(list.error || detail.error || update.error || formError) && (
        <p role="alert" className="alert alert-error">
          {formError || (list.error || detail.error || update.error)?.message}
        </p>
      )}
      {list.isPending && <p role="status">Loading members…</p>}
      {list.isSuccess && !list.data.items.length && <p>No enrolled members found.</p>}
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Status</th>
              <th>External ID</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.data?.items.map((member) => (
              <tr key={member.id}>
                <td>{member.displayName || member.email || member.id}</td>
                <td>{member.status}</td>
                <td>{member.externalMemberId || '—'}</td>
                <td>
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      setSelected(member.id);
                      update.reset();
                      setFormError('');
                    }}
                  >
                    View {member.displayName || 'member'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3 mt-4">
        <button
          className="btn btn-outline"
          disabled={cursors.length === 1}
          onClick={() => setCursors((value) => value.slice(0, -1))}
        >
          Previous members
        </button>
        <button
          className="btn btn-outline"
          disabled={!list.data?.nextCursor}
          onClick={() => setCursors((value) => [...value, list.data!.nextCursor!])}
        >
          Next members
        </button>
      </div>
      {detail.data && (
        <section
          key={`${orgId}-${detail.data.id}-${detail.data.status}-${detail.data.externalMemberId}`}
          className="card bg-base-100 border border-base-300 p-5 mt-6"
        >
          <h2 className="text-xl font-semibold">{detail.data.displayName || 'Member detail'}</h2>
          <p>
            {detail.data.email} · {detail.data.phoneNumber}
          </p>
          <p>
            Confirmed balance: {detail.data.balance?.confirmedBalance} · Pending earn:{' '}
            {detail.data.balance?.pendingEarn} · Pending redemption:{' '}
            {detail.data.balance?.pendingRedemption}
          </p>
          <p>
            {detail.data.balance?.stale
              ? 'Pending transactions may change this balance.'
              : 'No pending transactions.'}
          </p>
          {auth.owner && (
            <form
              className="flex flex-wrap gap-4 mt-4"
              onSubmit={(event) => {
                event.preventDefault();
                const fields = new FormData(event.currentTarget);
                setFormError('');
                try {
                  update.mutate({
                    status: String(fields.get('status')),
                    externalMemberId: String(fields.get('externalMemberId')).trim() || null,
                    metadata: JSON.parse(String(fields.get('metadata'))),
                  });
                } catch {
                  setFormError('Metadata must be valid JSON.');
                }
              }}
            >
              <label>
                Member status
                <select
                  aria-label="Member status"
                  name="status"
                  defaultValue={detail.data.status}
                  className="select select-bordered"
                >
                  <option>ACTIVE</option>
                  <option>BLOCKED</option>
                </select>
              </label>
              <label>
                Member external ID
                <input
                  name="externalMemberId"
                  defaultValue={detail.data.externalMemberId || ''}
                  maxLength={160}
                  className="input input-bordered"
                />
              </label>
              <label>
                Member metadata
                <textarea
                  name="metadata"
                  defaultValue={JSON.stringify(detail.data.metadata || {})}
                  className="textarea textarea-bordered"
                />
              </label>
              <button className="btn btn-primary" disabled={update.isPending}>
                Save member
              </button>
            </form>
          )}
        </section>
      )}
    </>
  );
}
