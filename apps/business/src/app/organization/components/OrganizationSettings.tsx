import type { ReactNode } from 'react';
import { PageHeader } from '@/components/shared/Display';
import { useOrganization } from '../hooks/useOrganization';
import { OrganizationGeneralForm, OrganizationIdentityForm } from './OrganizationProfileForm';
import { TeamManager } from './TeamManager';

/** One settings topic: its title and explanation on the left, its card on the right. */
function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-10">
      <div className="mt-4">
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm opacity-65">{description}</p>
      </div>
      <div className="max-w-3xl">{children}</div>
    </section>
  );
}

/** The Business Owner's organization settings, or its team and invitations. */
export function OrganizationSettings({ view }: { view: 'profile' | 'team' }) {
  const { organization, revision } = useOrganization();
  // A save reloads the organization; the forms start again from what Core now has.
  const key = `${organization.id}-${revision}`;

  if (view === 'team')
    return (
      <>
        <PageHeader
          title="Team and invitations"
          description="Invite Developers to this organization and manage their access."
        />
        <section className="space-y-5 rounded-box border border-base-300 bg-base-100 p-6">
          <TeamManager />
        </section>
      </>
    );

  return (
    <>
      <PageHeader
        title="Organization settings"
        description="Your organization's name and the legal identity OctaP holds for it."
      />
      <div className="flex flex-col gap-10">
        <SettingsSection
          title="General"
          description="How the organization appears in OctaP. The name saves straight away."
        >
          <OrganizationGeneralForm key={key} organization={organization} />
        </SettingsSection>
        <SettingsSection
          title="Legal identity"
          description="Who the organization is legally. A System Admin approves every change."
        >
          <OrganizationIdentityForm key={key} organization={organization} />
        </SettingsSection>
      </div>
    </>
  );
}
