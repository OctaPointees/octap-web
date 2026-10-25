import type { ReactNode } from 'react';

export default function MobileNavigation({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <header className="mobile-navigation">
      <a href="/dashboard" className="font-head text-lg font-bold">
        OctaP <span className="text-sm font-normal opacity-60">{title}</span>
      </a>
      <details>
        <summary
          aria-label="Open navigation"
          className="cursor-pointer rounded-field border border-line px-3 py-2 text-sm"
        >
          Menu
        </summary>
        <nav aria-label={`${title} navigation`} className="mobile-navigation-links">
          {children}
        </nav>
      </details>
    </header>
  );
}
