import { createBrowserRouter, Navigate } from 'react-router';
import { RequireBusinessMode, RequireDeveloperAccess, RequireRole } from './guards';

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

export const router = createBrowserRouter([
  { path: '/wallet', element: <WalletApp /> },
  {
    element: <RequireDeveloperAccess />,
    children: [
      {
        path: '/developer',
        element: <DeveloperLayout />,
        children: [
          { index: true, element: <DeveloperDashboardPage /> },
          { path: 'api-keys', element: <DeveloperApiKeysPage /> },
          { path: 'webhooks', element: <DeveloperWebhooksPage /> },
          { path: 'mcp', element: <DeveloperMcpPage /> },
        ],
      },
    ],
  },
  {
    element: <RequireRole role="merchant" />,
    children: [
      {
        element: <RequireBusinessMode />,
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
            ],
          },
        ],
      },
    ],
  },
  { path: '/login', element: <Navigate to="/" /> },
  { path: '/', element: <AuthenticationEntryPoint /> },
  { path: '*', element: <NotFoundPage /> },
]);
