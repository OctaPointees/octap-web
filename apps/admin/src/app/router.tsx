import { ConsoleRoot } from '@octap/shared/google-auth';
import { queryClient } from '../queries/client';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { RequireAdmin } from './guards';

const demoRoutes: RouteObject[] = [
  { path: '/', element: <Navigate to="/admin" replace /> },
  { path: '/login', lazy: async () => ({ Component: (await import('./auth')).default }) },
  {
    Component: RequireAdmin,
    children: [
      {
        path: '/admin',
        lazy: async () => ({ Component: (await import('./admin')).default }),
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import('./admin/pages/DashboardPage')).default,
            }),
          },
          {
            path: 'metrics',
            lazy: async () => ({ Component: (await import('./admin/pages/MetricsPage')).default }),
          },
          {
            path: 'partners',
            lazy: async () => ({ Component: (await import('./admin/pages/PartnersPage')).default }),
          },
          {
            path: 'partners/:id',
            lazy: async () => ({
              Component: (await import('./admin/pages/PartnerDetailPage')).default,
            }),
          },
          {
            path: 'vouchers',
            lazy: async () => ({ Component: (await import('./admin/pages/VouchersPage')).default }),
          },
          {
            path: 'audit',
            lazy: async () => ({ Component: (await import('./admin/pages/AuditPage')).default }),
          },
        ],
      },
    ],
  },
  { path: '*', lazy: async () => ({ Component: (await import('./NotFoundPage')).default }) },
];

export const router = createBrowserRouter(
  import.meta.env.VITE_ENABLE_DEMO_AUTH === 'true'
    ? demoRoutes
    : [
        {
          element: (
            <ConsoleRoot
              portal="admin"
              clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}
              apiBaseUrl={import.meta.env.VITE_CORE_API_URL ?? ''}
              onReset={() => queryClient.clear()}
            />
          ),
          children: demoRoutes,
        },
      ],
);
