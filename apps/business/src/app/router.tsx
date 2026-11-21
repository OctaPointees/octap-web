import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { RequireSignIn } from '@octap/shared/authentication';
import BusinessRoot from './Root';
import NotFoundPage from './NotFoundPage';
import AuthenticationEntryPoint from './auth';

import OrganizationLayout from './organization';
import { OrganizationProvider } from './organization/context/OrganizationProvider';
import OrganizationsPage from './organization/pages/OrganizationsPage';
import OnboardingPage from './organization/pages/OnboardingPage';

import WorkspaceLayout from './workspace';
import { LegacyPanelRedirect } from './workspace/LegacyPanelRedirect';
import DashboardPage from './dashboard';
import RewardsPage from './rewards';
import MembersPage from './members';
import ApiKeysPage from './api-keys';
import TeamPage from './team';
import SettingsPage from './settings';

/**
 * Pages of one organization, under `/organizations/:slug`, one per feature. Who may do what on a
 * page is decided by the page from the user's role; the sidebar focus only filters the menu.
 */
const organizationRoutes: RouteObject[] = [
  {
    element: <WorkspaceLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'rewards', element: <RewardsPage /> },
      { path: 'members', element: <MembersPage /> },
      { path: 'api-keys', element: <ApiKeysPage /> },
      { path: 'team', element: <TeamPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  // Pages used to be split into a Business and a Developer panel.
  { path: 'merchant/*', element: <LegacyPanelRedirect /> },
  { path: 'developer/*', element: <LegacyPanelRedirect /> },
];

const routes: RouteObject[] = [
  { path: '/', element: <AuthenticationEntryPoint /> },
  { path: '/login', element: <Navigate to="/" /> },
  {
    element: <RequireSignIn loginPath="/" keepState />,
    children: [
      {
        element: <OrganizationLayout />,
        children: [
          { path: '/organizations', element: <OrganizationsPage /> },
          { path: '/onboarding', element: <OnboardingPage /> },
        ],
      },
      {
        path: '/organizations/:slug',
        element: <OrganizationProvider />,
        children: organizationRoutes,
      },
    ],
  },
  // Dashboards used to live here, before the organization was part of the URL.
  { path: '/merchant/*', element: <Navigate to="/organizations" replace /> },
  { path: '/developer/*', element: <Navigate to="/organizations" replace /> },
  { path: '*', element: <NotFoundPage /> },
];

export const router = createBrowserRouter([{ element: <BusinessRoot />, children: routes }]);
