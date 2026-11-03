import { Buildings, ShieldCheck, UsersThree } from 'phosphor-react';
import { Link } from 'react-router';
import { useConsoleAuth } from '@octap/shared/google-auth';
import { Card, PageHeader, StatCard } from '@/components/shared/Display';

export default function ConnectedDashboard({ developer = false }: { developer?: boolean }) {
  const auth = useConsoleAuth();
  const org = auth?.data.organization;
  if (!org) return null;
  return (
    <>
      <PageHeader
        title={developer ? 'Developer dashboard' : `${org.name} loyalty`}
        description={
          developer
            ? `Integration status for ${org.name}.`
            : 'Your organization and access are verified by OctaP Core.'
        }
      />
      {auth.notice && (
        <p role="status" className="alert alert-success">
          {auth.notice}
        </p>
      )}
      {auth.error && (
        <p role="alert" className="alert alert-error">
          {auth.error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Organization" value={org.name} icon={Buildings} hint={org.slug} />
        <StatCard label="Organization status" value={org.status} icon={ShieldCheck} />
        <StatCard
          label="Your access"
          value={org.persona === 'BUSINESS_OWNER' ? 'Business Owner' : 'Business Developer'}
          icon={UsersThree}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card title={developer ? 'Recent API activity' : 'Issuance vs redemption'}>
          <p className="text-sm opacity-65">Live analytics are not connected yet.</p>
        </Card>
        <Card title={developer ? 'Integration shortcuts' : 'Organization shortcuts'}>
          <div className="flex flex-col gap-3">
            {auth.owner && (
              <>
                <Link className="link" to="/merchant/settings">
                  Organization settings
                </Link>
                <Link className="link" to="/merchant/team">
                  Team and invitations
                </Link>
              </>
            )}
            <Link className="link" to="/developer/api-keys">
              API credentials
            </Link>
            <Link className="link" to="/organizations">
              Switch organization
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}
