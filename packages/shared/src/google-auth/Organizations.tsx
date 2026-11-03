import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useConsoleAuth } from './console-session';

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
