import { createBrowserRouter, Navigate } from 'react-router-dom';
import RootLayout from './RootLayout';
import { RequireRole } from './guards';

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
      { path: '/', element: <Navigate to="/login" replace /> },
      {
        path: '/login',
        lazy: async () => ({ Component: (await import('../pages/login/Login')).default }),
      },
      {
        element: <RequireRole area="business" />,
        children: [
          {
            path: '/dashboard',
            lazy: async () => ({
              Component: (await import('../pages/dashboard/Dashboard')).default,
            }),
          },
        ],
      },
      {
        element: <RequireRole area="admin" />,
        children: [
          {
            path: '/admin',
            lazy: async () => ({ Component: (await import('../pages/Admin')).default }),
          },
        ],
      },
      {
        element: <RequireRole area="developer" />,
        children: [
          {
            path: '/developers',
            lazy: async () => ({
              Component: (await import('../pages/developers/DevLayout')).default,
            }),
            children: [
              { index: true, element: <Navigate to="overview" replace /> },
              {
                path: 'overview',
                lazy: async () => ({
                  Component: (await import('../pages/developers/Overview')).default,
                }),
              },
              {
                path: 'keys',
                lazy: async () => ({
                  Component: (await import('../pages/developers/ApiKeys')).default,
                }),
              },
              {
                path: 'sandbox',
                lazy: async () => ({
                  Component: (await import('../pages/developers/Sandbox')).default,
                }),
              },
              {
                path: 'mock',
                lazy: async () => ({
                  Component: (await import('../pages/developers/MockPage')).default,
                }),
              },
              {
                path: 'logs',
                lazy: async () => ({
                  Component: (await import('../pages/developers/Logs')).default,
                }),
              },
              {
                path: 'webhooks',
                lazy: async () => ({
                  Component: (await import('../pages/developers/Webhooks')).default,
                }),
              },
              {
                path: 'mcp',
                lazy: async () => ({
                  Component: (await import('../pages/developers/Mcp')).default,
                }),
              },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/login" replace /> },
    ],
  },
]);
