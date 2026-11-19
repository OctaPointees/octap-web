import { RequireSignIn } from '@octap/shared/authentication';
import OrganizationLayout from './organization';
import OrganizationsPage from './organization/pages/OrganizationsPage';
import OnboardingPage from './organization/pages/OnboardingPage';
import BusinessRoot from './Root';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { RequireRoles } from './guards';

import AuthenticationEntryPoint from './auth';
import MerchantLayout from './merchant';
import DeveloperLayout from './developer';
import Dashboard from './console/Dashboard';
import Members from './console/Members';
import Rewards from './console/Rewards';
import { OrganizationSettings } from './organization/components/OrganizationSettings';
import DeveloperApiKeysPage from './developer/pages/ApiKeysPage';

import NotFoundPage from './NotFoundPage';

const portalRoutes: RouteObject[] = [
  {
    element: <RequireRoles allow={['owner', 'developer']} />,
    children: [
      {
        path: '/developer',
        element: <DeveloperLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'api-keys', element: <DeveloperApiKeysPage /> },
          { path: 'members', element: <Members /> },
          { path: 'rewards', element: <Rewards /> },
        ],
      },
    ],
  },
  {
    element: <RequireRoles allow={['owner']} />,
    children: [
      {
        children: [
          {
            path: '/merchant',
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
    ],
  },
  { path: '/login', element: <Navigate to="/" /> },
  { path: '/', element: <AuthenticationEntryPoint /> },
  { path: '*', element: <NotFoundPage /> },
];

const accountRoutes: RouteObject[] = [
  {
    element: <RequireSignIn />,
    children: [
      {
        element: <OrganizationLayout />,
        children: [
          { path: '/onboarding', element: <OnboardingPage /> },
          { path: '/organizations', element: <OrganizationsPage /> },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter([
  { element: <BusinessRoot />, children: [...portalRoutes, ...accountRoutes] },
]);
