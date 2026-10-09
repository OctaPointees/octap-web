import type { Theme } from '../types';

const PRODUCT_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#who', label: "Who it's for" },
  { href: '#how', label: 'How it works' },
  { href: '#compare', label: 'Compare' },
];

const DEVELOPER_LINKS = [
  { href: '#developers', label: 'SDK docs' },
  { href: '#developers', label: 'MCP server' },
  { href: '#developers', label: 'Sandbox' },
];

export default function Footer({ theme }: { theme: Theme }) {
  const logoSrc = theme === 'light' ? '/images/octap_logo_plum.png' : '/images/octap_logo_white.png';

  return (
    <footer className="pt-16 pb-16 border-t border-white/10">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="relative py-10 md:py-14 overflow-hidden select-none" data-reveal data-name="footer brand wordmark">
          <div
            className="absolute size-40 md:size-60 rounded-full blur-3xl opacity-80 drift-slow pointer-events-none"
            data-parallax="10"
            style={{ left: '54%', top: '12%', background: 'radial-gradient(circle at 35% 35%,#38dbe0,#ff5fc4 55%,#8b5cf6 100%)' }}
          />
          <h2
            className="relative text-center font-extrabold tracking-tight leading-[0.9]"
            style={{ fontSize: 'clamp(4.5rem,15vw,12.5rem)', color: 'var(--ink)' }}
          >
            Octa
            <span
              style={{
                background: 'linear-gradient(120deg,#ff5fc4,#8b5cf6 50%,#38dbe0)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              P
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-10 pb-10 pt-10 border-t border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <img src={logoSrc} alt="OctaP octopus mark" className="size-6 object-contain" decoding="async" loading="lazy" />
              OctaP
            </div>
            <p className="text-sm leading-relaxed text-[#8a7fa3]">Credit-as-a-Service loyalty infrastructure on Sui.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-[#8a7fa3]">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Developers</h4>
            <ul className="space-y-2 text-sm text-[#8a7fa3]">
              {DEVELOPER_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Contact</h4>
            <ul className="space-y-2 text-sm text-[#8a7fa3]">
              <li>
                <a href="mailto:hello@octap.example" className="hover:text-white">
                  hello@octap.example
                </a>
              </li>
              <li className="flex items-center gap-1.5 pt-1">
                <i className="ti ti-world text-sm" />
                EN / VI
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-[#8a7fa3]">
          <span>© 2026 OctaP</span>
          <span>Capstone project · all data on this page is illustrative</span>
        </div>
      </div>
    </footer>
  );
}
