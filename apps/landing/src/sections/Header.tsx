import type { Theme } from '../types';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#who', label: "Who it's for" },
  { href: '#how', label: 'How it works' },
  { href: '#developers', label: 'Developers' },
  { href: '#compare', label: 'Compare' },
  { href: '#faq', label: 'FAQ' },
];

export default function Header({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const logoSrc = theme === 'light' ? '/images/octap_logo_plum.png' : '/images/octap_logo_white.png';

  return (
    <header className="sticky top-0 z-40 glass" data-name="site header">
      <div className="max-w-[1280px] mx-auto px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src={logoSrc}
            alt="OctaP octopus mark"
            className="size-8 object-contain"
            decoding="async"
            loading="lazy"
            style={{ filter: 'drop-shadow(0 0 10px rgba(255,95,196,0.6))' }}
          />
          <span className="text-lg font-extrabold tracking-tight">OctaP</span>
        </div>
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#c8bcdb]">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-[#ff5fc4] transition-colors">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center justify-center size-8 border border-white/15 rounded-full text-[#c8bcdb] hover:text-[#ff5fc4] hover:border-[#ff5fc4]/40 transition-colors"
            onClick={onToggleTheme}
            aria-label="Switch between dark and light mode"
          >
            <i className={theme === 'light' ? 'ti ti-sun text-sm' : 'ti ti-moon text-sm'} />
          </button>
          <button className="hidden sm:flex items-center gap-1 text-xs font-mono font-medium text-[#c8bcdb] border border-white/15 rounded-full px-3 py-1.5">
            <i className="ti ti-world text-sm" /> EN / VI
          </button>
          <a href="#" className="text-sm font-semibold text-white hidden sm:block">
            Sign in
          </a>
          <a
            href="#"
            className="relative inline-block text-sm font-semibold text-[#07040f] rounded-full px-5 py-2.5 shadow-lg glow-pink hover:opacity-90 transition-opacity"
            data-magnetic
            style={{ background: '#ff5fc4' }}
          >
            Get started
          </a>
        </div>
      </div>
    </header>
  );
}
