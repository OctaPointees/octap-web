import { Navigate } from 'react-router';
import { Fingerprint, ShieldCheck, Stack } from 'phosphor-react';
import { GoogleSignInForm, useAuth } from '@octap/shared/authentication';

const PILLARS = [
  {
    icon: Stack,
    title: 'Tenant-isolated points',
    text: 'Every merchant runs its own point token and treasury on Sui.',
  },
  {
    icon: ShieldCheck,
    title: 'Fraud-proof ledger',
    text: 'Each mint and burn is anchored on-chain and fully auditable.',
  },
  {
    icon: Fingerprint,
    title: 'Zero Web3 friction',
    text: 'Members sign in with a phone number via zkLogin; gas is sponsored.',
  },
];

function AuthenticationBrandPanel() {
  return (
    <section className="relative hidden flex-col justify-between overflow-hidden bg-secondary p-12 text-secondary-content lg:flex">
      <div className="absolute -top-32 -right-32 size-96 rounded-full bg-primary/40 blur-3xl" />
      <div className="absolute -bottom-40 -left-20 size-96 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative flex items-center gap-3">
        <div className="size-11 rounded-box bg-primary p-2">
          <img src="/icons/logo_dark.png" className="w-full" alt="" />
        </div>
        <span className="text-xl font-bold">OctaP</span>
      </div>
      <div className="relative max-w-md">
        <h1 className="text-4xl leading-tight font-bold">
          Credit-as-a-Service for modern loyalty.
        </h1>
        <p className="mt-4 opacity-75">
          Launch secure, isolated loyalty programs backed by the Sui blockchain — with a Web2
          experience your customers already know.
        </p>
        <ul className="mt-10 flex flex-col gap-6">
          {PILLARS.map((p) => (
            <li key={p.title} className="flex gap-4">
              <div className="h-fit rounded-box bg-white/10 p-2.5">
                <p.icon size={22} />
              </div>
              <div>
                <div className="font-semibold">{p.title}</div>
                <div className="text-sm opacity-70">{p.text}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative text-xs opacity-50">© 2026 OctaPoint</div>
    </section>
  );
}
/** The admin login page: the brand panel and the shared Google sign-in form. */
export default function AuthenticationEntryPoint() {
  const { identity } = useAuth();
  if (identity) return <Navigate to="/admin" replace />;
  return (
    <div className="app-wrapper grid lg:grid-cols-5">
      <AuthenticationBrandPanel />
      <section className="flex items-center justify-center overflow-y-auto p-6 col-span-2">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              OctaP Platform administration
            </p>
            <h1 className="text-3xl font-bold mt-3">Sign in with Google</h1>
            <p className="text-sm opacity-70 mt-4">
              Use your Google account. Your organization and permissions are provided by OctaP Core.
            </p>
          </div>
          <GoogleSignInForm />
        </div>
      </section>
    </div>
  );
}
