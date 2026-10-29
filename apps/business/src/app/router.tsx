import { createBrowserRouter, Navigate } from 'react-router';
import { RequireRole } from './guards';

import AuthenticationEntryPoint from './auth';
import MerchantLayout from './merchant';
import CampaignsPage from './merchant/pages/CampaignsPage';
import MerchantDashboardPage from './merchant/pages/DashboardPage';
import DevelopersPage from './merchant/pages/DevelopersPage';
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
    element: <RequireRole role="merchant" />,
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
          { path: 'developers', element: <DevelopersPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: '/login', element: <Navigate to="/" /> },
  { path: '/', element: <AuthenticationEntryPoint /> },
  { path: '*', element: <NotFoundPage /> },
]);
