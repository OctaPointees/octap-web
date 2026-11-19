import { Buildings, ShieldCheck, UsersThree } from 'phosphor-react';
import { Link } from 'react-router';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { organizationPath } from '@/app/organization/utils';
import { Card, PageHeader, StatCard, StatusBadge } from '@/components/shared/Display';

export default function ConnectedDashboard({ developer = false }: { developer?: boolean }) {
  const organization = useOrganization();
  const org = organization.organization;
  const path = (panel: 'merchant' | 'developer', page: string) =>
    organizationPath(organization.organizationId, panel, page);
  return (
    <>
      <PageHeader
        title={developer ? 'Developer dashboard' : `${org.name} loyalty`}
        description={
          developer
            ? 'Integration status and credentials for this organization.'
            : 'Your organization and access are verified by OctaP Core.'
        }
      />
      {/* One 6-column grid: stats take 2 columns each and cards 3, so both rows share edges. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div className="xl:col-span-2 *:h-full">
          <StatCard label="Organization" value={org.name} icon={Buildings} hint={org.slug} />
        </div>
        <div className="xl:col-span-2 *:h-full">
          <StatCard
            label="Organization status"
            value={<StatusBadge status={org.status.toLowerCase()} className="badge-lg" />}
            icon={ShieldCheck}
          />
        </div>
        <div className="sm:col-span-2 xl:col-span-2 *:h-full">
          <StatCard
            label="Your access"
            value={org.persona === 'BUSINESS_OWNER' ? 'Business Owner' : 'Business Developer'}
            icon={UsersThree}
          />
        </div>
        <Card
          className="sm:col-span-2 xl:col-span-3"
          title={developer ? 'Recent API activity' : 'Issuance vs redemption'}
        >
          <p className="text-sm opacity-65">Live analytics are not connected yet.</p>
        </Card>
        <Card
          className="sm:col-span-2 xl:col-span-3"
          title={developer ? 'Integration shortcuts' : 'Organization shortcuts'}
        >
          <div className="flex flex-col gap-3">
            {developer ? (
              <>
                <Link className="link" to={path('developer', 'api-keys')}>
                  API credentials
                </Link>
              </>
            ) : (
              <>
                {organization.owner && (
                  <>
                    <Link className="link" to={path('merchant', 'settings')}>
                      Organization settings
                    </Link>
                    <Link className="link" to={path('merchant', 'team')}>
                      Team and invitations
                    </Link>
                  </>
                )}
                <Link className="link" to={path('developer', 'api-keys')}>
                  API credentials
                </Link>
              </>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
