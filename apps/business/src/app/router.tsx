import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { RequireSignIn } from '@octap/shared/authentication';
import BusinessRoot from './Root';
import { RequireOwner } from './guards';
import NotFoundPage from './NotFoundPage';
import AuthenticationEntryPoint from './auth';

import OrganizationLayout from './organization';
import { OrganizationProvider } from './organization/context/OrganizationProvider';
import OrganizationsPage from './organization/pages/OrganizationsPage';
import OnboardingPage from './organization/pages/OnboardingPage';
import OrganizationHome from './organization/pages/OrganizationHome';
import { OrganizationSettings } from './organization/components/OrganizationSettings';

import MerchantLayout from './merchant';
import DeveloperLayout from './developer';
import DeveloperApiKeysPage from './developer/pages/ApiKeysPage';
import Dashboard from './console/Dashboard';
import Members from './console/Members';
import Rewards from './console/Rewards';

/** Pages of one organization, under `/organizations/:slug`. */
const organizationRoutes: RouteObject[] = [
  { index: true, element: <OrganizationHome /> },
  {
    path: 'merchant',
    element: <RequireOwner />,
    children: [
      {
        element: <MerchantLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'rewards', element: <Rewards /> },
          { path: 'members', element: <Members /> },
          { path: 'settings', element: <OrganizationSettings view="profile" /> },
          { path: 'team', element: <OrganizationSettings view="team" /> },
        ],
      },
    ],
  },
  {
    path: 'developer',
    element: <DeveloperLayout />,
    children: [
      { index: true, element: <Dashboard developer /> },
      { path: 'api-keys', element: <DeveloperApiKeysPage /> },
      { path: 'members', element: <Members /> },
      { path: 'rewards', element: <Rewards /> },
    ],
  },
];

const routes: RouteObject[] = [
  { path: '/', element: <AuthenticationEntryPoint /> },
  { path: '/login', element: <Navigate to="/" /> },
  {
    element: <RequireSignIn />,
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
