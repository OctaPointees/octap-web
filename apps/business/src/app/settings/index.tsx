import type { ReactNode } from 'react';
import { Info } from 'phosphor-react';
import { PageHeader } from '@/components/shared/Display';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { OrganizationGeneralForm, OrganizationIdentityForm } from './components/SettingsForms';

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

/**
 * The organization's settings. Every member can read them; only the Owner can change them, as
 * Core allows, so anyone else gets the same sections read-only.
 */
export default function SettingsPage() {
  const { organization, owner, revision } = useOrganization();
  // A save reloads the organization; the forms start again from what Core now has.
  const key = `${organization.id}-${revision}`;
  const readOnly = !owner;

  return (
    <>
      <PageHeader
        title="Organization settings"
        description="Your organization's name and the legal identity OctaP holds for it."
      />
      {readOnly && (
        <p role="note" className="mb-6 flex items-start gap-2 text-sm opacity-75">
          <Info size={18} className="mt-0.5 shrink-0" aria-hidden />
          You can view these settings. Only the organization's Owner can change them.
        </p>
      )}
      <div className="flex flex-col gap-10">
        <SettingsSection
          title="General"
          description="How the organization appears in OctaP. The name saves straight away."
        >
          <OrganizationGeneralForm key={key} organization={organization} readOnly={readOnly} />
        </SettingsSection>
        <SettingsSection
          title="Legal identity"
          description="Who the organization is legally. A System Admin approves every change."
        >
          <OrganizationIdentityForm key={key} organization={organization} readOnly={readOnly} />
        </SettingsSection>
      </div>
    </>
  );
}
