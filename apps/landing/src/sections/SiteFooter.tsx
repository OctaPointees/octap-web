export default function SiteFooter() {
  return (
    <footer
      className="pt-16 pb-10"
      style={{ background: 'linear-gradient(180deg,#fff,var(--tint) 100%)' }}
    >
      <div className="max-w-320 mx-auto px-8">
        <div className="grid md:grid-cols-5 gap-10 pb-10 border-b border-purple/10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 font-head font-extrabold text-lg mb-3">
              <div className="size-8 rounded-xl grad-brand flex items-center justify-center p-1.5">
                <img
                  src="/icons/logo_light.png"
                  alt="OctaP logo"
                  className="w-full h-full object-contain brightness-0 invert"
                  decoding="async"
                  loading="lazy"
                />
              </div>
              OctaP
            </div>
            <p className="text-sm leading-relaxed text-muted max-w-xs">
              Credit-as-a-Service loyalty infrastructure on Sui.
            </p>
            <div className="flex items-center gap-2 mt-4 text-sm text-muted">
              <i className="ri-mail-line text-purple"></i>hello@octap.example
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-sm text-muted">
              <i className="ri-phone-line text-purple"></i>1900 000 000
            </div>
          </div>
          <div>
            <h4 className="font-head font-bold text-sm mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <a href="#features" className="hover:text-purple">
                  Features
                </a>
              </li>
              <li>
                <a href="#who" className="hover:text-purple">
                  Who it's for
                </a>
              </li>
              <li>
                <a href="#how" className="hover:text-purple">
                  How it works
                </a>
              </li>
              <li>
                <a href="#compare" className="hover:text-purple">
                  Compare
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-head font-bold text-sm mb-3">Developers</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <a href="#developers" className="hover:text-purple">
                  SDK docs
                </a>
              </li>
              <li>
                <a href="#developers" className="hover:text-purple">
                  MCP server
                </a>
              </li>
              <li>
                <a href="#developers" className="hover:text-purple">
                  Sandbox
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-head font-bold text-sm mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <a href="#partners" className="hover:text-purple">
                  Partners
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-purple">
                  FAQ
                </a>
              </li>
              <li className="flex items-center gap-1.5">
                <i className="ri-global-line"></i>EN / VI
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <span>© 2026 OctaP</span>
          <span>Capstone project · all data on this page is illustrative</span>
        </div>
      </div>
    </footer>
  );
}
