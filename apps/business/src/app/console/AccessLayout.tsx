import { Buildings, Gear, Layout, UsersThree } from 'phosphor-react';
import { ConsoleAccountControls, useConsoleAuth } from '@octap/shared/google-auth';
import { Outlet, useLocation } from 'react-router';
import PortalLayout from '@/components/layout/PortalLayout';

export default function ConsoleAccessLayout() {
  const auth = useConsoleAuth();
  const location = useLocation();
  if (location.pathname === '/onboarding' && auth?.identity)
    return (
      <div className="min-h-screen bg-base-200">
        <header className="border-b border-base-300 bg-base-100 px-4 sm:px-8 py-4">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/icons/logo_light.png" className="size-10" alt="" />
              <span className="font-bold text-lg">OctaP</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-sm">
                <p className="font-semibold">{auth.identity.user.fullName}</p>
                <p className="opacity-65">{auth.identity.user.email}</p>
              </div>
              {auth.identity.organizations.length > 0 && (
                <button
                  className="btn btn-outline btn-sm"
                  disabled={auth.busy}
                  onClick={() => void auth.skipSetup()}
                >
                  Skip setup
                </button>
              )}
              <ConsoleAccountControls />
              {auth.identity.user.systemRole === 'SYSTEM_ADMIN' && (
                <a
                  className="link text-sm"
                  href={
                    import.meta.env.VITE_ADMIN_PORTAL_URL ||
                    (import.meta.env.DEV ? 'http://localhost:5000/admin' : '/admin')
                  }
                >
                  Platform administration
                </a>
              )}
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    );
  const nav = [
    ...(auth?.selected
      ? [{ label: 'Dashboard', path: auth.owner ? '/merchant' : '/developer', icon: Layout }]
      : []),
    { label: 'Organizations', path: '/organizations', icon: Buildings },
    { label: 'Organization onboarding', path: '/onboarding', icon: Gear },
    ...(auth?.identity?.user.systemRole === 'SYSTEM_ADMIN'
      ? [
          {
            label: 'Platform administration',
            path:
              import.meta.env.VITE_ADMIN_PORTAL_URL ||
              (import.meta.env.DEV ? 'http://localhost:5000/admin' : '/admin'),
            icon: UsersThree,
          },
        ]
      : []),
  ];
  return (
    <PortalLayout
      subtitle="OctaP account"
      roleLabel={auth?.identity?.user.systemRole === 'SYSTEM_ADMIN' ? 'System Admin' : 'Account'}
      nav={nav}
      useSearch={() => ({ data: [], isFetching: false })}
    />
  );
}
