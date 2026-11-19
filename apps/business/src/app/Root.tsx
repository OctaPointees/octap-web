import { Outlet } from 'react-router';
import { AuthProvider, ResumeGate } from '@octap/shared/authentication';
import { queryClient } from '../queries/client';

/** Sign-in for every route. Organization pages get their organization from the URL. */
export default function BusinessRoot() {
  return (
    <AuthProvider
      portal="business"
      clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}
      apiBaseUrl={import.meta.env.VITE_CORE_API_URL ?? ''}
      onSessionEnd={() => queryClient.clear()}
    >
      <ResumeGate>
        <Outlet />
      </ResumeGate>
    </AuthProvider>
  );
}
