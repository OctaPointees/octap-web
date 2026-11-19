import type { ConsoleIdentity } from '../../console-api/client';
import { cn } from '../../utils';
import { useAuth } from '../hooks/useAuth';
import { useGoogleSignInButton } from '../hooks/useGoogleSignInButton';

/**
 * The Google sign-in form: the button, its progress and its errors, with no page around it.
 * Each app places it in its own login page.
 */
export function GoogleSignInForm({
  className,
  onSignedIn,
}: {
  className?: string;
  onSignedIn?: (identity: ConsoleIdentity) => void;
}) {
  const { error: sessionError } = useAuth();
  const { ref, configured, busy, error, retry } = useGoogleSignInButton({ onSignedIn });

  return (
    <div className={cn('flex w-full flex-col gap-4', className)}>
      {sessionError && (
        <p role="alert" className="alert alert-warning">
          {sessionError}
        </p>
      )}
      {configured ? (
        <div
          ref={ref}
          aria-label="Sign in with Google"
          className={cn(busy && 'pointer-events-none opacity-50')}
        />
      ) : (
        <p role="alert" className="alert alert-warning">
          Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID for this portal.
        </p>
      )}
      {busy && (
        <p role="status" className="text-sm">
          Verifying with Core…
        </p>
      )}
      {error && (
        <>
          <div role="alert" className="alert alert-error">
            {error}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm w-fit"
            disabled={busy}
            onClick={retry}
          >
            Retry Google sign-in
          </button>
        </>
      )}
    </div>
  );
}
