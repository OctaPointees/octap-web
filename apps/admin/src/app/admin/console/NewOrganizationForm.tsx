import { useState } from 'react';
import { useConsoleAuth } from '@octap/shared/google-auth';
export function NewOrganizationForm() {
  const auth = useConsoleAuth()!;
  const client = auth.client;
  const [candidates, setCandidates] = useState<
    Array<{ id: string; email: string; fullName: string }>
  >([]);
  const [type, setType] = useState('INDIVIDUAL_HOUSEHOLD');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function mutate(action: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {' '}
      {error && <p role="alert">{error}</p>}{' '}
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
    </>
  );
}
