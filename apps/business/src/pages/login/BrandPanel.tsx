import { LANDING_URL } from '../../config';

export default function BrandPanel({ pill }: { pill: string }) {
  return (
    <section className="on-grad grad-brand text-white relative overflow-hidden h-[200px] lg:h-auto lg:min-h-[100dvh]">
      <div
        className="glow-drift absolute -top-32 -left-20 size-[420px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle,rgba(255,255,255,.18),transparent 68%)' }}
      ></div>
      <div
        className="glow-drift absolute -bottom-40 right-0 size-[560px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle,rgba(255,111,165,.45),transparent 70%)' }}
      ></div>
      <div
        className="hidden lg:block logo-mark absolute pointer-events-none"
        style={{
          width: '680px',
          height: '680px',
          right: '-210px',
          top: '50%',
          marginTop: '-300px',
          background: 'linear-gradient(160deg,rgba(255,255,255,.95),rgba(255,255,255,.35))',
          opacity: '.09',
        }}
      ></div>

      <div className="relative z-10 h-full flex flex-col justify-center lg:justify-between px-6 py-6 lg:pl-16 lg:pr-12 lg:py-12 lg:min-h-[100dvh]">
        <div className="w-full max-w-[560px]">
          <a
            href={LANDING_URL}
            className="hidden lg:inline-flex items-center gap-1.5 text-[13px] font-bold text-white/85 hover:text-white"
          >
            <i className="ri-arrow-left-line"></i>Back to octap.com
          </a>
          <div className="flex items-center gap-2.5 lg:mt-10">
            <div className="size-9 rounded-xl bg-white flex items-center justify-center p-[7px]">
              <div
                className="logo-mark w-full h-full"
                style={{ background: 'var(--purple)' }}
              ></div>
            </div>
            <span className="font-head text-xl font-extrabold tracking-tight">OctaP</span>
            <span className="font-head text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full bg-white/20">
              {pill}
            </span>
          </div>
        </div>

        <div className="w-full max-w-[560px] mt-3 lg:mt-0">
          <h1
            className="font-head font-extrabold tracking-tight leading-[1.1] text-[26px] lg:text-[48px]"
            style={{ textWrap: 'balance' }}
          >
            <span className="block lg:whitespace-nowrap">Run your loyalty program</span>
            <span className="block lg:whitespace-nowrap">
              with{' '}
              <span
                className="font-accent italic font-bold text-[38px] lg:text-[64px] leading-none align-baseline"
                style={{ color: 'var(--amber)' }}
              >
                confidence
              </span>
            </span>
          </h1>
          <p className="hidden lg:block mt-5 text-[15px] leading-relaxed text-white/90 max-w-[480px]">
            Everything your team needs to run points, campaigns and developer access for your
            organization — in one place.
          </p>

          <div className="hidden lg:flex flex-col gap-3.5 mt-10 w-full max-w-[560px]">
            <div
              className="flex items-start gap-3.5 rounded-2xl bg-white/12 border border-white/20 p-4"
              style={{ background: 'rgba(255,255,255,.12)' }}
            >
              <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 text-lg">
                <i className="ri-shield-keyhole-line"></i>
              </div>
              <div>
                <div className="font-head font-bold text-[15px]">Tenant-isolated points</div>
                <div className="text-[13px] text-white/85 mt-0.5">
                  Your program never mixes with another merchant's.
                </div>
              </div>
            </div>
            <div
              className="flex items-start gap-3.5 rounded-2xl border border-white/20 p-4"
              style={{ background: 'rgba(255,255,255,.12)' }}
            >
              <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 text-lg">
                <i className="ri-shield-check-line"></i>
              </div>
              <div>
                <div className="font-head font-bold text-[15px]">Tamper-evident ledger</div>
                <div className="text-[13px] text-white/85 mt-0.5">
                  Every point issued or redeemed leaves a verifiable on-chain record.
                </div>
              </div>
            </div>
            <div
              className="flex items-start gap-3.5 rounded-2xl border border-white/20 p-4"
              style={{ background: 'rgba(255,255,255,.12)' }}
            >
              <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 text-lg">
                <i className="ri-wallet-3-line"></i>
              </div>
              <div>
                <div className="font-head font-bold text-[15px]">Walletless for your customers</div>
                <div className="text-[13px] text-white/85 mt-0.5">
                  No wallet or gas fees to manage.
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="hidden lg:block text-[13px] text-white/80 max-w-[560px]">
          Capstone project demo · all data on this page is illustrative
        </p>
      </div>
    </section>
  );
}
