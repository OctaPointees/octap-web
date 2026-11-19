import { Navigate, Outlet } from 'react-router';
import { AccountControls, useAuth } from '@octap/shared/authentication';
import { useOrganization } from '@/app/organization/hooks/useOrganization';

/** Signed in, with an organization selected, in the panel its role allows. */
export function RequireRoles({ allow }: { allow: ('owner' | 'developer')[] }) {
  const { identity } = useAuth();
  const organization = useOrganization();

  if (!identity) return <Navigate to="/login" replace />;
  if (!organization.selected)
    return (
      <Navigate to={identity.organizations.length ? '/organizations' : '/onboarding'} replace />
    );
  if (!allow.includes(organization.owner ? 'owner' : 'developer'))
    return <Navigate to={organization.owner ? '/merchant' : '/developer'} replace />;
  if (!organization.data.organization)
    return (
      <div className="flex place-center flex-col h-full">
        <div className="flex flex-col place-center w-1/3 h-1/3 gap-12 bg-base-200/58 backdrop-blur-2xl rounded-box">
          <img src="/favicon.svg" className="size-30" />
          <span className="loading loading-spinner loading-lg" />
          Fetching the latest data for you! Hang tight!
        </div>

        {organization.error && <AccountControls />}
      </div>
    );
  return <Outlet />;
}
