import { Fragment, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, Navigate, Outlet, useLocation, useParams } from 'react-router';
import { AccountControls, unwrap, useAuth } from '@octap/shared/authentication';
import { organizationKeys } from '../utils';
import { OrganizationContext, type CurrentOrganization } from './OrganizationContext';

/**
 * Route element for `/organizations/:slug`: loads that organization and provides it to the pages
 * below. Core is still called by ID, taken from the user's membership. A link that uses the
 * organization's ID instead of its slug is redirected to the slug; an organization the user does
 * not belong to sends them to the list.
 */
export function OrganizationProvider() {
  const { slug = '' } = useParams();
  const { pathname, search, hash } = useLocation();
  const { identity, api } = useAuth();
  const organizations = identity?.organizations ?? [];
  const membership = organizations.find((org) => org.slug === slug);
  const byId = membership ? undefined : organizations.find((org) => org.organizationId === slug);
  const organizationId = membership?.organizationId ?? '';
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
            slug,
            membership,
            organization,
            owner: organization.persona === 'BUSINESS_OWNER',
            revision: query.dataUpdatedAt,
          }
        : null,
    [organizationId, slug, membership, organization, query.dataUpdatedAt],
  );

  if (byId) {
    // Same page, with the slug in place of the ID: /organizations/<id>/... becomes /<slug>/...
    const [, root, , ...rest] = pathname.split('/');
    const to = ['', root, byId.slug, ...rest].join('/') + search + hash;
    return <Navigate to={to} replace />;
  }
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
