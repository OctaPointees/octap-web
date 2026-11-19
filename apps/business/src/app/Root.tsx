import { Outlet } from 'react-router';
import { AuthProvider, ResumeGate } from '@octap/shared/authentication';
import { OrganizationProvider } from '@/app/organization/context/OrganizationProvider';
import { queryClient } from '../queries/client';

/** Sign-in for every route, then the organization the user works in. */
export default function BusinessRoot() {
  return (
    <AuthProvider
      portal="business"
      clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}
      apiBaseUrl={import.meta.env.VITE_CORE_API_URL ?? ''}
      onSessionEnd={() => queryClient.clear()}
    >
      <OrganizationProvider>
        <ResumeGate>
          <Outlet />
        </ResumeGate>
      </OrganizationProvider>
    </AuthProvider>
  );
}
