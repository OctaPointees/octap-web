import { Buildings, ShieldCheck, UsersThree } from 'phosphor-react';
import { Link } from 'react-router';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { organizationPath, type OrganizationPage } from '@/app/organization/utils';
import { useFocus } from '@/app/workspace/focus';
import { Card, PageHeader, StatCard, StatusBadge } from '@/components/shared/Display';

/** The organization's dashboard, in its Business or Developer variant from the sidebar focus. */
export default function DashboardPage() {
  const organization = useOrganization();
  const developer = useFocus() === 'developer';
  const org = organization.organization;
  const path = (page: OrganizationPage) => organizationPath(organization.slug, page);
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
                <Link className="link" to={path('api-keys')}>
                  API credentials
                </Link>
              </>
            ) : (
              <>
                <Link className="link" to={path('settings')}>
                  Organization settings
                </Link>
                {organization.owner && (
                  <Link className="link" to={path('team')}>
                    Team and invitations
                  </Link>
                )}
                <Link className="link" to={path('api-keys')}>
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
