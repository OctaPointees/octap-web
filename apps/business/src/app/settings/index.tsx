import type { ReactNode } from 'react';
import { Info } from 'phosphor-react';
import { PageHeader } from '@/components/shared/Display';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { RefundPolicySection } from './components/RefundPolicyForm';
import {
  OrganizationGeneralForm,
  OrganizationIdentityForm,
  VoucherApprovalForm,
} from './components/SettingsForms';

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
  const { organization, owner } = useOrganization();
  // Each form starts again only when what it shows changes in Core, so saving one form (which
  // reloads the organization) never drops what someone is typing in another.
  const keys = {
    general: `${organization.id}-${organization.name}`,
    identity: [
      organization.id,
      organization.organizationType,
      organization.legalName,
      organization.taxId,
      organization.representativeName,
      organization.nationalIdLast4,
    ].join('-'),
    approval: `${organization.id}-${organization.voucherApprovalRequired}`,
  };
  const readOnly = !owner;

  return (
    <>
      <PageHeader
        title="Organization settings"
        description={
          owner
            ? "Your organization's name, legal identity, voucher approval and refund rules."
            : "Your organization's name and the legal identity OctaP holds for it."
        }
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
          <OrganizationGeneralForm
            key={keys.general}
            organization={organization}
            readOnly={readOnly}
          />
        </SettingsSection>
        <SettingsSection
          title="Legal identity"
          description="Who the organization is legally. A System Admin approves every change."
        >
          <OrganizationIdentityForm
            key={keys.identity}
            organization={organization}
            readOnly={readOnly}
          />
        </SettingsSection>
        <SettingsSection
          title="Voucher approval"
          description="Whether vouchers a Developer creates wait for the Owner before members can claim them. Owners always activate their own."
        >
          <VoucherApprovalForm
            key={keys.approval}
            organization={organization}
            readOnly={readOnly}
          />
        </SettingsSection>
        {/* Core answers 403 to anyone else, reads included, so it has no read-only view. */}
        {owner && (
          <SettingsSection
            title="Refund policy"
            description="When customers can get points back on a claimed voucher. Each change is a new version and applies to vouchers activated afterwards."
          >
            <RefundPolicySection />
          </SettingsSection>
        )}
      </div>
    </>
  );
}
