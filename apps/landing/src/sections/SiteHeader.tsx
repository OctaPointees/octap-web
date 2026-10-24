export default function SiteHeader() {
  return (
    <>
  <header className="sticky top-0 z-40 glass-nav">
    <div className="max-w-[1280px] mx-auto px-8 h-18 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="size-9 rounded-md bg-white flex items-center justify-center p-[7px]"><div className="logo-mark w-full h-full" style={{"background": "var(--purple)"}}></div></div>
        <span className="font-head text-xl font-extrabold tracking-tight text-white">OctaP</span>
      </div>
      <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-white/85">
        <a href="#features" className="hover:text-white transition-colors">Features</a>
        <a href="#who" className="hover:text-white transition-colors">Who it's for</a>
        <a href="#how" className="hover:text-white transition-colors">How it works</a>
        <a href="#partners" className="hover:text-white transition-colors">Partners</a>
        <a href="#developers" className="hover:text-white transition-colors">Developers</a>
        <a href="#compare" className="hover:text-white transition-colors">Compare</a>
        <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
      </nav>
      <div className="flex items-center gap-3">
        <button className="hidden sm:flex items-center gap-1 text-xs font-mono font-semibold text-white border border-white/30 rounded-md px-3 py-1.5"><i className="ri-global-line text-sm"></i> EN / VI</button>
        <a href="#" className="text-sm font-bold hidden sm:block text-white">Sign in</a>
        <a href="#" className="btn-pill text-sm px-5 py-2.5 bg-white" style={{"color": "var(--purple)"}}>Get started</a>
      </div>
    </div>
  </header>

    </>
  );
}
