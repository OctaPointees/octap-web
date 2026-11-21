import { ArrowLeft } from 'phosphor-react';
import { Link } from 'react-router';
import { useAuth } from '@octap/shared/authentication';
import { InvitationForm } from '../components/InvitationForm';
import { OrganizationRequestList } from '../components/OrganizationRequestList';
import { OrganizationSetup } from '../components/OrganizationSetup';
import { useInvitationToken } from '../hooks/useInvitationToken';

/**
 * `/onboarding`: create an organization, or accept the invitation that the login page passed
 * on in router state (an `?invitation=` here is moved out of the URL the same way). An invitation
 * gets a single centered card; creating one sits on the page background, capped at 1600px like
 * the organization list.
 */
export default function OnboardingPage() {
  const { identity } = useAuth();
  const invitation = useInvitationToken();
  if (!identity) return null;

  if (invitation)
    return (
      <section className="mx-auto w-full max-w-md pt-[6vh] pb-6">
        <InvitationForm token={invitation} />
      </section>
    );

  return (
    <section className="mx-auto w-full max-w-(--size-article) pt-4 space-y-5">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,900px)_minmax(18rem,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <Link
            to="/organizations"
            className="inline-flex w-fit items-center gap-1.5 text-sm opacity-70 hover:opacity-100 hover:underline"
          >
            <ArrowLeft size={14} /> Back to organizations
          </Link>
          <h1 className="text-2xl font-bold">Create an organization</h1>
          {identity.organizations.length === 0 && (
            <p>
              Your account has no active organization access. Request a new organization or accept
              an invitation.
            </p>
          )}

          <OrganizationSetup />
        </div>
        <OrganizationRequestList />
      </div>
    </section>
  );
}
