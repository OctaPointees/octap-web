import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * The default screen while a reload signs the returning user in again. Google can take up to the
 * full timeout to answer, so the user can give up and use the sign-in form instead.
 */
export function RestoringSession() {
  const { cancelResume } = useAuth();
  return (
    <div className="min-h-dvh flex items-center justify-center bg-base-200 p-4">
      <section className="flex w-full max-w-sm flex-col items-center gap-6 rounded-box border border-base-300 bg-base-100 p-8 text-center">
        <div role="status" className="flex flex-col items-center gap-6">
          <span className="loading loading-spinner loading-lg text-primary" aria-hidden />
          <div>
            <h1 className="text-lg font-semibold">Signing you back in!</h1>
            <p className="mt-1 text-sm opacity-70">
              Please hold while we authorize your access request.
            </p>
          </div>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={cancelResume}>
          Sign in with Google instead
        </button>
      </section>
    </div>
  );
}

/**
 * Holds its children while a reload restores the sign-in, so route guards don't send the
 * reloaded URL to the login page. Pass `fallback` to replace the default screen.
 */
export function ResumeGate({
  children,
  fallback = <RestoringSession />,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return useAuth().resuming ? fallback : children;
}
