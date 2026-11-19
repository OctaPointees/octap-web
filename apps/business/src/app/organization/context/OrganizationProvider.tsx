import { Fragment, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, Navigate, Outlet, useParams } from 'react-router';
import { AccountControls, useAuth } from '@octap/shared/authentication';
import { organizationKeys } from '../utils';
import { OrganizationContext, type CurrentOrganization } from './OrganizationContext';

/**
 * Route element for `/organizations/:organizationId`: loads that organization and provides it to
 * the pages below. An organization the user does not belong to sends them to the list.
 */
export function OrganizationProvider() {
  const { organizationId = '' } = useParams();
  const { identity, client } = useAuth();
  const membership = identity?.organizations.find((org) => org.organizationId === organizationId);
  const query = useQuery({
    queryKey: organizationKeys.detail(organizationId),
    queryFn: ({ signal }) => client().getConsoleOrganization(organizationId, signal),
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
    <div className="flex place-center flex-col h-full">
      <div className="flex flex-col place-center w-1/3 h-1/3 gap-12 bg-base-200/58 backdrop-blur-2xl rounded-box">
        <img src="/favicon.svg" className="size-30" />
        {error ? (
          <>
            <p role="alert">{error.message}</p>
            <Link className="link" to="/organizations">
              Back to organizations
            </Link>
          </>
        ) : (
          <>
            <span className="loading loading-spinner loading-lg" />
            Fetching the latest data for you! Hang tight!
          </>
        )}
      </div>
      {error && <AccountControls />}
    </div>
  );
}
