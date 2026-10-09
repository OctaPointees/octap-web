export default function Hero() {
  return (
    <section
      className="max-w-[1280px] mx-auto px-8 pt-20 pb-28 grid lg:grid-cols-12 gap-10 items-center"
      data-name="hero section"
    >
      <div className="lg:col-span-6">
        <h1 className="text-6xl leading-[1.04] font-extrabold tracking-tight" data-gsap="hero-headline">
          Loyalty points your customers can
          <span className="font-accent font-bold text-7xl" style={{ color: '#ff5fc4' }}>
            {' '}
            trust
          </span>
        </h1>
        <p className="mt-7 text-lg text-[#c8bcdb] max-w-md leading-relaxed" data-gsap="hero-subcopy">
          OctaP lets businesses run their own loyalty points and vouchers on the Sui blockchain — recorded on an
          immutable ledger your customers can verify, without anyone managing a crypto wallet.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-5" data-gsap="hero-ctas">
          <a
            href="#how"
            className="relative inline-block rounded-full text-[#07040f] text-sm font-semibold px-6 py-3.5 glow-pink hover:opacity-90 transition-opacity"
            data-magnetic
            style={{ background: '#ff5fc4' }}
          >
            See how points work
          </a>
          <a
            href="#developers"
            className="relative inline-flex items-center gap-1.5 rounded-full border border-white/20 text-sm font-semibold text-white px-5 py-3 hover:border-white/40 hover:bg-white/5 transition-colors group"
            data-magnetic
          >
            Explore the developer SDK{' '}
            <i className="ti ti-arrow-right text-base group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
        <div className="mt-10 flex items-center gap-5 text-xs font-mono text-[#8a7fa3]" data-gsap="hero-nfr">
          <span className="flex items-center gap-1.5">
            <i className="ti ti-bolt text-[#38dbe0]" />
            Point requests target &lt;2s
          </span>
          <span className="flex items-center gap-1.5">
            <i className="ti ti-bolt text-[#38dbe0]" />
            Balance queries target &lt;500ms
          </span>
        </div>
      </div>

      <div className="lg:col-span-6 relative h-[500px]" style={{ perspective: 1200 }}>
        <div
          className="absolute size-64 rounded-full pointer-events-none blur-3xl opacity-60"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #38dbe0, #ff5fc4 60%, #8b5cf6 100%)',
            left: 0,
            top: 0,
          }}
          data-gsap="cursor-blob"
        />

        <div className="absolute left-8 top-2 w-[230px] h-[460px] rounded-[2.4rem] glass glow-pink" data-gsap="hero-phone">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-black/60 rounded-b-xl" />
          <div className="h-full w-full rounded-[2.2rem] overflow-hidden pt-9 px-4 pb-4 flex flex-col gap-3">
            <div className="text-[11px] font-mono text-[#8a7fa3]">9:41</div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
              <div className="text-[10px] text-[#8a7fa3]">Lotus Mart · Petals</div>
              <div className="text-2xl font-bold text-white">2,480</div>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-3 flex items-center gap-2">
              <i className="ti ti-user-circle text-[#ff5fc4]" />
              <span className="text-[11px] text-[#c8bcdb]">Signed in with Google</span>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5">
              <i className="ti ti-qrcode text-2xl text-[#38dbe0]" />
              <div className="text-[10px] text-[#c8bcdb] mt-1">Scan to earn or redeem</div>
            </div>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 w-[300px] glass rounded-3xl glow-pink px-7 pt-6 pb-5" data-gsap="hero-ticket">
          <span className="absolute top-3 right-5 text-[10px] font-mono uppercase tracking-wide text-[#8a7fa3]">
            Sample
          </span>
          <div className="flex flex-col items-center text-center gap-2 pb-6">
            <div
              className="size-14 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(56,219,224,0.15)' }}
            >
              <i className="ti ti-circle-check text-3xl text-[#38dbe0]" />
            </div>
            <div className="text-sm text-[#8a7fa3]">Points earned</div>
            <div className="text-4xl font-bold text-white">+35</div>
          </div>
          <div className="absolute left-0 right-0 border-t border-dashed border-white/15" style={{ top: 170 }} />
          <div className="absolute -left-3 size-6 rounded-full" style={{ top: 158, background: '#07040f' }} />
          <div className="absolute -right-3 size-6 rounded-full" style={{ top: 158, background: '#07040f' }} />
          <div className="pt-6 flex items-center justify-between text-[11px]">
            <span className="text-[#8a7fa3]">Ledger record</span>
            <span className="font-mono text-[#c8bcdb]">0x8f2a…c41b</span>
          </div>
        </div>
      </div>
    </section>
  );
}
