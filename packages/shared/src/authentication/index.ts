// Components
export { GoogleSignInForm } from './components/GoogleSignInForm';
export { RestoringSession, ResumeGate } from './components/RestoringSession';
export { RequireSignIn } from './components/RequireSignIn';
export { AccountControls } from './components/AccountControls';

// Context
export { AuthProvider, type AuthProviderProps } from './context/AuthProvider';
export type { AuthSession, Portal } from './context/AuthContext';

// Core: the SDK client from `useAuth().api` answers `{ data, error }`; `unwrap` turns that into
// the data or a thrown `OctapError`.
export { unwrap, type ConsoleIdentity } from './lib/core';

// Hooks
export { useAuth } from './hooks/useAuth';
export { useGoogleSignInButton } from './hooks/useGoogleSignInButton';
