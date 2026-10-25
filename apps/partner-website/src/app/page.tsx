import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { resolveTenant, getTenants } from '../lib/tenant';
import CustomerJoin from '../components/CustomerJoin';
import CoffeeIllustration from '../components/CoffeeIllustration';

export default async function PartnerPage() {
  const host = (await headers()).get('host') ?? '';
  const tenant = resolveTenant(host);
  if (!tenant) {
    if (process.env.NODE_ENV !== 'production' && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) {
      return (
        <main className="max-w-xl mx-auto px-6 py-24">
          <p className="text-sm text-partner uppercase tracking-widest">OctaP partner portals</p>
          <h1 className="font-head text-5xl mt-4">One home for every community.</h1>
          <p className="text-muted mt-6">
            Choose a local store to preview the shared customer template.
          </p>
          <ul className="mt-8 space-y-3">
            {getTenants().map((store) => (
              <li key={store.slug}>
                <a
                  className="block rounded-2xl border border-line bg-surface p-5 font-semibold text-partner"
                  href={`http://${store.slug}.localhost:${host.split(':')[1] ?? '4001'}`}
                >
                  {store.name} →
                </a>
              </li>
            ))}
          </ul>
        </main>
      );
    }
    notFound();
  }
  return (
    <main data-theme={tenant.theme} className="min-h-dvh flex flex-col">
      <header className="border-b border-line bg-surface">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4 px-6 py-6 lg:px-12">
          <Link href="/" className="flex items-center gap-3">
            <span className="size-12 rounded-full bg-partner text-white grid place-items-center text-2xl font-bold border-4 border-partner-soft">
              {tenant.initials}
            </span>
            <span className="font-bold uppercase tracking-widest text-sm">
              {tenant.name}
              <span className="block text-muted text-xs font-normal tracking-normal mt-1">
                Coffee & community
              </span>
            </span>
          </Link>
          <nav
            aria-label="Rewards navigation"
            className="flex items-center gap-6 text-sm font-semibold"
          >
            <a href="#how-it-works" className="hidden sm:block">
              How it works
            </a>
            <a href="#membership" className="rounded-full border border-ink px-4 py-2">
              Your rewards
            </a>
          </nav>
        </div>
      </header>
      <div className="bg-evergreen text-white px-6 py-3">
        <p className="max-w-6xl mx-auto text-xs font-bold tracking-widest uppercase">
          Coffee rewards{' '}
          <span className="font-normal tracking-normal opacity-70 ml-3">
            An unofficial OctaP demo
          </span>
        </p>
      </div>
      <section className="max-w-7xl w-full mx-auto flex-1 grid lg:grid-cols-2 gap-8 lg:gap-14 items-start px-6 py-10 lg:px-12 lg:py-14">
        <div className="rounded-3xl bg-mint p-7 sm:p-10 overflow-hidden lg:sticky lg:top-6">
          <p className="text-partner text-xs font-bold tracking-widest uppercase">
            A little more to love, every day
          </p>
          <h1 className="font-head font-extrabold tracking-tight text-5xl sm:text-6xl leading-tight mt-5 max-w-xl whitespace-pre-line">
            {tenant.headline}
          </h1>
          <p className="text-evergreen text-base leading-relaxed mt-5 max-w-md">
            {tenant.description}
          </p>
          <div className="flex justify-center mt-3">
            <CoffeeIllustration />
          </div>
          <div className="flex items-center gap-3 text-sm border-t border-evergreen/15 pt-5">
            <span className="text-gold text-xl" aria-hidden="true">
              ★
            </span>
            <p>Earn a little joy. Sip something delicious.</p>
          </div>
        </div>
        <CustomerJoin
          storeName={tenant.name}
          showPoints={
            process.env.NODE_ENV === 'development' && process.env.ENABLE_MERCHANT_DEMO === 'true'
          }
        />
      </section>
      <section id="how-it-works" className="max-w-7xl w-full mx-auto px-6 pb-14 lg:px-12">
        <h2 className="font-bold text-2xl">Your next coffee is closer than you think.</h2>
        <div className="grid sm:grid-cols-3 gap-6 mt-7">
          {[
            ['01', 'Make it official', 'Sign in with Google and join the coffee community.'],
            ['02', 'Every visit adds up', 'Share your member ID at checkout and earn points.'],
            [
              '03',
              'Find your next favorite',
              'Trade points for a coffee reward, then show your voucher in store.',
            ],
          ].map(([number, title, text]) => (
            <div key={number} className="flex gap-4">
              <span className="size-10 shrink-0 rounded-full border border-partner text-partner grid place-items-center text-sm font-bold">
                {number}
              </span>
              <div>
                <h3 className="font-bold">{title}</h3>
                <p className="text-muted text-sm leading-relaxed mt-2">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <footer className="border-t border-line px-6 py-6 text-sm text-muted flex flex-wrap gap-3 justify-between">
        <span>Unofficial Starbucks-inspired demo. Not affiliated with Starbucks.</span>
        <span>
          Rewards powered by <span className="font-semibold text-ink">OctaP</span> · Testnet preview
        </span>
      </footer>
    </main>
  );
}
