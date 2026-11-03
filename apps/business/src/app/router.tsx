import ConsoleAccessLayout from './console/AccessLayout';
import { ConsoleRoot, ConsoleSignedIn, ConsoleScreen } from '@octap/shared/google-auth';
import { queryClient } from '../queries/client';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { RequireRoles } from './guards';

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
import WalletApp from './wallet';

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

const liveRoutes: RouteObject[] = [
  ...portalRoutes,
  {
    element: <ConsoleSignedIn />,
    children: [
      {
        element: <ConsoleAccessLayout />,
        children: [
          { path: '/onboarding', element: <ConsoleScreen /> },
          { path: '/organizations', element: <ConsoleScreen /> },
          { path: '/admin', element: <ConsoleScreen /> },
        ],
      },
    ],
  },
];
export const router = createBrowserRouter(
  import.meta.env.VITE_ENABLE_DEMO_AUTH === 'true'
    ? [{ path: '/wallet', element: <WalletApp /> }, ...portalRoutes]
    : [
        {
          element: (
            <ConsoleRoot
              portal="business"
              clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}
              apiBaseUrl={import.meta.env.VITE_CORE_API_URL ?? ''}
              onReset={() => queryClient.clear()}
            />
          ),
          children: liveRoutes,
        },
      ],
);
