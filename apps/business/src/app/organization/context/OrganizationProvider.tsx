import { Fragment, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, Navigate, Outlet, useParams } from 'react-router';
import { AccountControls, useAuth } from '@octap/shared/authentication';
import { unwrap } from '@octap/shared/authentication';
import { organizationKeys } from '../utils';
import { OrganizationContext, type CurrentOrganization } from './OrganizationContext';

/**
 * Route element for `/organizations/:organizationId`: loads that organization and provides it to
 * the pages below. An organization the user does not belong to sends them to the list.
 */
export function OrganizationProvider() {
  const { organizationId = '' } = useParams();
  const { identity, api } = useAuth();
  const membership = identity?.organizations.find((org) => org.organizationId === organizationId);
  const query = useQuery({
    queryKey: organizationKeys.detail(organizationId),
    queryFn: () => unwrap(api.console.organization({ organizationId })),
    enabled: !!membership,
  });

  const organization = query.data;
  const value = useMemo<CurrentOrganization | null>(
    () =>
      membership && organization
        ? {
            organizationId,
            membership,
            organization,
            owner: organization.persona === 'BUSINESS_OWNER',
            revision: query.dataUpdatedAt,
          }
        : null,
    [organizationId, membership, organization, query.dataUpdatedAt],
  );

  if (!membership) return <Navigate to="/organizations" replace />;
  if (!value) return <OrganizationLoading error={query.error} />;
  return (
    <OrganizationContext.Provider value={value}>
      {/* A different organization starts its pages fresh. */}
      <Fragment key={organizationId}>
        <Outlet />
      </Fragment>
    </OrganizationContext.Provider>
  );
}

function OrganizationLoading({ error }: { error: Error | null }) {
  return (
    <div className="flex min-h-dvh flex-col place-center gap-6 p-4">
      <div className="flex w-full max-w-md flex-col place-center gap-8 rounded-box bg-base-200/58 p-8 text-center backdrop-blur-2xl">
        <img src="/favicon.svg" className="size-24" alt="" />
        {error ? (
          <div role="alert" className="flex flex-col gap-3">
            <p className="font-semibold">This organization could not be loaded.</p>
            <p className="text-sm opacity-75">{error.message}</p>
            <Link className="link" to="/organizations">
              Back to organizations
            </Link>
          </div>
        ) : (
          <div role="status" className="flex flex-col place-center gap-4">
            <span className="loading loading-spinner loading-lg" aria-hidden />
            Fetching the latest data for you! Hang tight!
          </div>
        )}
      </div>
      {error && <AccountControls />}
    </div>
  );
}
