export default function Hero() {
  return (
    <section
      className="relative pt-16 pb-16 flex items-center"
      style={{
        background: 'linear-gradient(90deg, #FAF8FC 0%, #FDEFF7 100%)',
        minHeight: 'calc(100vh - 194px)',
      }}
    >
      <div className="hidden lg:block absolute inset-y-0 right-0 hero-bleed-layer">
        <img
          src="/hero-octap-app.png"
          alt="OctaP app showing points balance and available vouchers, with end users, partners and developers connecting through the Sui blockchain to partner brands"
          className="hero-bleed-img absolute inset-0 w-full h-full"
          decoding="async"
          fetchPriority="high"
        />
      </div>
      <div className="max-w-320 mx-auto px-8 w-full">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 relative z-10">
            <h1 className="font-head text-4xl sm:text-5xl lg:text-6xl leading-[1.05] font-extrabold tracking-tight">
              Loyalty points your customers can <span className="grad-text">trust</span>
            </h1>
            <ul className="mt-7 space-y-2.5 text-base text-muted max-w-md">
              <li className="flex gap-2.5">
                <i className="ri-checkbox-circle-fill text-pink mt-0.5"></i>Points &amp; vouchers
                recorded on an immutable Sui ledger
              </li>
              <li className="flex gap-2.5">
                <i className="ri-checkbox-circle-fill text-pink mt-0.5"></i>No crypto wallet for
                customers — sign in with Google, email or phone
              </li>
              <li className="flex gap-2.5">
                <i className="ri-checkbox-circle-fill text-pink mt-0.5"></i>Each merchant's program
                fully isolated, from day one
              </li>
              <li className="flex gap-2.5">
                <i className="ri-checkbox-circle-fill text-pink mt-0.5"></i>TypeScript SDK and an
                MCP server built for AI agents
              </li>
            </ul>
            <p className="mt-6 text-base text-muted max-w-md leading-relaxed">
              OctaP lets businesses run their own loyalty points and vouchers on the Sui blockchain
              — recorded on an immutable ledger your customers can verify, without anyone managing a
              crypto wallet.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#how" className="btn-pill btn-primary text-sm px-7 py-3.5">
                See how points work
              </a>
              <a
                href="#developers"
                className="btn-pill btn-outline text-sm px-6 py-3.5 inline-flex items-center gap-1.5 group"
              >
                Explore the developer SDK{' '}
                <i className="ri-arrow-right-line group-hover:translate-x-0.5 transition-transform"></i>
              </a>
            </div>
          </div>
          <div className="lg:col-span-6 lg:hidden relative">
            <img
              src="/hero-octap-app.png"
              alt="OctaP app showing points balance and available vouchers, with end users, partners and developers connecting through the Sui blockchain to partner brands"
              className="w-full h-auto block"
              decoding="async"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
