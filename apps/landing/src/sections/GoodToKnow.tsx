export default function GoodToKnow() {
  return (
    <>
  <section className="py-20">
    <div className="rounded-[12px] mx-4 md:mx-8 p-12 md:p-16" style={{"background": "linear-gradient(160deg,var(--tint),#fff 60%)"}}>
      <div className="max-w-[1180px] mx-auto">
        <h2 className="font-head text-4xl font-extrabold tracking-tight text-center mb-12">Good to know</h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="mx-auto size-16 rounded-full grad-brand text-white flex items-center justify-center mb-4 shadow-float-sm"><i className="ri-git-branch-line text-xl"></i></div>
            <span className="pill-chip inline-block px-4 py-1.5 text-xs mb-3">Merchant-isolated</span>
            <p className="text-sm text-[#6b5a7d] leading-relaxed">Points stay inside one merchant. There's no cross-merchant exchange and no transferring points to another person.</p>
          </div>
          <div className="text-center">
            <div className="mx-auto size-16 rounded-full grad-brand text-white flex items-center justify-center mb-4 shadow-float-sm"><i className="ri-exchange-dollar-line text-xl"></i></div>
            <span className="pill-chip inline-block px-4 py-1.5 text-xs mb-3">Not cash</span>
            <p className="text-sm text-[#6b5a7d] leading-relaxed">Points are promotional credit, not money — they can't be cashed out to fiat currency.</p>
          </div>
          <div className="text-center">
            <div className="mx-auto size-16 rounded-full grad-brand text-white flex items-center justify-center mb-4 shadow-float-sm"><i className="ri-apps-2-line text-xl"></i></div>
            <span className="pill-chip inline-block px-4 py-1.5 text-xs mb-3">Reference apps</span>
            <p className="text-sm text-[#6b5a7d] leading-relaxed">The end-user apps shown here are reference apps that demonstrate the SDK, not a live consumer marketplace.</p>
          </div>
          <div className="text-center">
            <div className="mx-auto size-16 rounded-full grad-brand text-white flex items-center justify-center mb-4 shadow-float-sm"><i className="ri-gas-station-line text-xl"></i></div>
            <span className="pill-chip inline-block px-4 py-1.5 text-xs mb-3">Gas sponsored</span>
            <p className="text-sm text-[#6b5a7d] leading-relaxed">Confirming a transaction on the blockchain and sponsoring its gas fee adds a little more time than a purely centralized system.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

    </>
  );
}
