import { PageHeader } from '@/components/shared/Display';
import { useOrganization } from '../hooks/useOrganization';
import { OrganizationProfileForm } from './OrganizationProfileForm';
import { TeamManager } from './TeamManager';

/** The Business Owner's organization profile, or its team and invitations. */
export function OrganizationSettings({ view }: { view: 'profile' | 'team' }) {
  const { data, error, loading, owner, revision } = useOrganization();
  const organization = data.organization;

  return (
    <>
      <PageHeader
        title={view === 'team' ? 'Team and invitations' : 'Organization settings'}
        description="Manage your organization with your persisted Business Owner permissions."
      />
      {error && (
        <p role="alert" className="alert alert-error">
          {error}
        </p>
      )}
      {loading && <p role="status">Loading current access and organization data…</p>}
      {!loading && organization && (
        <section className="bg-base-100 border border-base-300 rounded-box p-6 space-y-5">
          <h1 className="text-2xl font-bold">{organization.name}</h1>
          <p>
            {organization.persona === 'BUSINESS_OWNER' ? 'Business Owner' : 'Business Developer'} ·{' '}
            {organization.status} · {organization.slug}
          </p>
          {owner &&
            (view === 'team' ? (
              <TeamManager />
            ) : (
              <OrganizationProfileForm
                key={`${organization.id}-${revision}`}
                organization={organization}
              />
            ))}
        </section>
      )}
    </>
  );
}
