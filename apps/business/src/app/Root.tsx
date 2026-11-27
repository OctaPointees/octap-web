import { Outlet } from 'react-router';
import { AuthProvider, ResumeGate } from '@octap/shared/authentication';
import { queryClient } from '../queries/client';
import { clearAllConversations } from './assistant/conversation';

/** The assistant's conversations of this tab (OCT-309) go with the signed-out user. */
function clearAssistant() {
  try {
    clearAllConversations(window.sessionStorage);
  } catch {
    /* Storage unavailable: nothing was kept. */
  }
}

/** Sign-in for every route. Organization pages get their organization from the URL. */
export default function BusinessRoot() {
  return (
    <AuthProvider
      portal="business"
      clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}
      apiBaseUrl={import.meta.env.VITE_CORE_API_URL ?? ''}
      onSessionEnd={(reason) => {
        queryClient.clear();
        // An expired sign-in is usually the same person signing in again, who keeps the conversation;
        // it is keyed by user, so another account would not see it anyway.
        if (reason === 'sign-out') clearAssistant();
      }}
    >
      <ResumeGate>
        <Outlet />
      </ResumeGate>
    </AuthProvider>
  );
}
