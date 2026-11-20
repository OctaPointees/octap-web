import { useContext } from 'react';
import { AuthContext, type AuthSession } from '../context/AuthContext';

/** The current sign-in. Must be used below `AuthProvider`. */
export function useAuth(): AuthSession {
  const session = useContext(AuthContext);
  if (!session) throw new Error('useAuth() must be used inside <AuthProvider>.');
  return session;
}
