import ConsoleAccessLayout from './console/AccessLayout';
import { RequireSignIn } from '@octap/shared/authentication';
import { OrganizationScreen } from '@/app/organization/OrganizationScreen';
import BusinessRoot from './Root';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { RequireRoles } from './guards';
import { ADMIN_PORTAL_URL } from '@/components/layout/nav';

import AuthenticationEntryPoint from './auth';
import MerchantLayout from './merchant';
import DeveloperLayout from './developer';
import DeveloperDashboardPage from './developer/pages/DashboardPage';
import DeveloperApiKeysPage from './developer/pages/ApiKeysPage';
import DeveloperWebhooksPage from './developer/pages/WebhooksPage';
import DeveloperMcpPage from './developer/pages/McpPage';
import CampaignsPage from './merchant/pages/CampaignsPage';
import MerchantDashboardPage from './merchant/pages/DashboardPage';
import MembersPage from './merchant/pages/MembersPage';
import PosPage from './merchant/pages/PosPage';
import RewardsPage from './merchant/pages/RewardsPage';
import SettingsPage from './merchant/pages/SettingsPage';
import TransactionsPage from './merchant/pages/TransactionsPage';

import NotFoundPage from './NotFoundPage';

const portalRoutes: RouteObject[] = [
  {
    element: <RequireRoles merchantRoles={['developer', 'owner']} />,
    children: [
      {
        path: '/developer',
        element: <DeveloperLayout />,
        children: [
          { index: true, element: <DeveloperDashboardPage /> },
          { path: 'api-keys', element: <DeveloperApiKeysPage /> },
          { path: 'members', element: <MembersPage /> },
          { path: 'rewards', element: <RewardsPage /> },
          { path: 'webhooks', element: <DeveloperWebhooksPage /> },
          { path: 'mcp', element: <DeveloperMcpPage /> },
        ],
      },
    ],
  },
  {
    element: <RequireRoles merchantRoles={['developer', 'owner', 'cashier', 'manager']} />,
    children: [
      {
        children: [
          {
            path: '/merchant',
            element: <MerchantLayout />,
            children: [
              { index: true, element: <MerchantDashboardPage /> },
              { path: 'pos', element: <PosPage /> },
              { path: 'campaigns', element: <CampaignsPage /> },
              { path: 'rewards', element: <RewardsPage /> },
              { path: 'members', element: <MembersPage /> },
              { path: 'transactions', element: <TransactionsPage /> },
              { path: 'settings', element: <SettingsPage /> },
              { path: 'team', element: <SettingsPage /> },
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
        element: <ConsoleAccessLayout />,
        children: [
          { path: '/onboarding', element: <OrganizationScreen /> },
          {
            path: '/organizations',
            element: <OrganizationScreen adminPortalUrl={ADMIN_PORTAL_URL} />,
          },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter([
  { element: <BusinessRoot />, children: [...portalRoutes, ...accountRoutes] },
]);
