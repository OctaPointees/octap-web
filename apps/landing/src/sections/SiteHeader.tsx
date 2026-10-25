import { useState } from 'react';
import { BUSINESS_URL } from '../config';

const links = [
  ['Features', '#features'],
  ['Who it’s for', '#who'],
  ['How it works', '#how'],
  ['Partners', '#partners'],
  ['Developers', '#developers'],
  ['Compare', '#compare'],
  ['FAQ', '#faq'],
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-18 max-w-320 items-center justify-between gap-4 px-4 sm:px-8">
        <a href="#main-content" aria-label="OctaP home" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-field bg-brand p-1.75">
            <img
              src="/icons/logo_light.png"
              alt=""
              className="size-full object-contain brightness-0 invert"
            />
          </span>
          <span className="font-head text-xl font-bold tracking-tight">OctaP</span>
        </a>
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-5 text-sm font-medium text-muted xl:flex"
        >
          {links.map(([label, href]) => (
            <a key={href} href={href} className="transition-colors hover:text-brand">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <a
            href={BUSINESS_URL}
            className="hidden text-sm font-semibold text-muted hover:text-brand sm:block"
          >
            Sign in
          </a>
          <a href={BUSINESS_URL} className="btn-pill btn-primary px-4 py-2.5 text-sm">
            Get started
          </a>
          <button
            type="button"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(!open)}
            className="flex size-10 items-center justify-center rounded-field border border-line xl:hidden"
          >
            <i className={open ? 'ri-close-line' : 'ri-menu-line'} aria-hidden="true" />
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="grid gap-1 border-t border-line bg-surface p-4 xl:hidden"
        >
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="rounded-field px-4 py-3 text-sm font-medium hover:bg-tint hover:text-brand"
            >
              {label}
            </a>
          ))}
          <a href={BUSINESS_URL} className="px-4 py-3 text-sm font-semibold text-brand">
            Sign in
          </a>
        </nav>
      )}
    </header>
  );
}
