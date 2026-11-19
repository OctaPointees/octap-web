import { ArrowLeft } from 'phosphor-react';
import { Link, useSearchParams } from 'react-router';
import { useAuth } from '@octap/shared/authentication';
import { InvitationForm } from '../components/InvitationForm';
import { OrganizationRequestList } from '../components/OrganizationRequestList';
import { OrganizationSetup } from '../components/OrganizationSetup';

/**
 * `/onboarding`: create an organization, or accept the invitation in `?invitation=`. Sits on
 * the page background, capped at 1600px like the organization list.
 */
export default function OnboardingPage() {
  const { identity } = useAuth();
  const invitation = useSearchParams()[0].get('invitation') ?? '';
  if (!identity) return null;

  return (
    <section className="mx-auto w-full max-w-[1600px] pt-4 space-y-5">
      {/* Form column capped at 1200px; your requests fill the rest beside it (below it on
          narrower screens). */}
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1200px)_minmax(18rem,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <Link
            to="/organizations"
            className="inline-flex w-fit items-center gap-1.5 text-sm opacity-70 hover:opacity-100 hover:underline"
          >
            <ArrowLeft size={14} /> Back to organizations
          </Link>
          <h1 className="text-2xl font-bold">
            {invitation ? 'Accept a Developer invitation' : 'Create an organization'}
          </h1>
          {identity.organizations.length === 0 && (
            <p>
              Your account has no active organization access. Request a new organization or accept
              an invitation.
            </p>
          )}
          {/* Only when opened from an invitation link: the link fills in the token. */}
          {invitation ? <InvitationForm token={invitation} /> : <OrganizationSetup />}
        </div>
        {!invitation && <OrganizationRequestList />}
      </div>
    </section>
  );
}
