import { createBrowserRouter, Navigate } from 'react-router';
import { RequireAdmin } from './guards';

export const router = createBrowserRouter([
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
]);
