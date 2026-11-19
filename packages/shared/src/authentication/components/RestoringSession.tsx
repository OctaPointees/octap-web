import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

/** The default screen while a reload signs the returning user in again. */
export function RestoringSession() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-base-200 p-4">
      <section
        role="status"
        className="flex w-full max-w-sm flex-col items-center gap-6 rounded-box border border-base-300 bg-base-100 p-8 text-center"
      >
        <span className="loading loading-spinner loading-lg text-primary" />
        <div>
          <h1 className="text-lg font-semibold">Signing you back in!</h1>
          <p className="mt-1 text-sm opacity-70">
            Please hold while we authorize your access request.
          </p>
        </div>
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
