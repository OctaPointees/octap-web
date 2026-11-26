import { GoogleSignInForm } from '@octap/shared/authentication';

/** The sign-in side: Google only. Core checks the account for the System Admin role. */
export function SignInPanel() {
  return (
    <div className="max-w-115 flex flex-1 flex-col justify-center gap-4 rounded-box h-full">
      <div>
        <h2 className="text-2xl font-bold">Sign in with Google</h2>
        <p className="mt-2 text-sm text-base-content/67">
          Use your Google account. Your permissions come from OctaP Core.
        </p>
      </div>
      <GoogleSignInForm />
    </div>
  );
}

export function LeftPanel() {
  return (
    <div className="flex flex-1 flex-col p-4">
      <img src="/favicon.svg" className="size-24" />

      <div className="space-y-1 my-4">
        <div className="text-lg">Sign-in to</div>
        <div className="text-3xl font-bold text-primary">OctaP System Dashboard</div>
      </div>

      <div className="flex-1"></div>

      <div className="text-justify max-w-2xl mt-4 text-base-content/67">
        System dashboard login. Are you a business owner or developer?{' '}
        <a href="#" className="underline font-medium hover:text-primary">
          Log in here
        </a>
        . Looking for the customer portal?{' '}
        <a href="#" className="underline font-medium hover:text-primary">
          Log in here
        </a>
        .
      </div>
    </div>
  );
}
