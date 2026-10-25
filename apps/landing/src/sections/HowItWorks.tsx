export default function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 py-20">
      <div className="max-w-320 mx-auto px-8">
        <h2 className="font-head text-4xl font-extrabold tracking-tight text-center">
          How it works
        </h2>
        <p className="mt-3 text-center text-muted max-w-xl mx-auto">
          Five steps carry every transaction from checkout to a record your customers can audit
          themselves.
        </p>
      </div>
      <div className="mt-12 overflow-x-auto">
        <div className="flex gap-6 px-8 w-max mx-auto">
          <div className="step-card shadow-float-sm w-57.5 p-6 flex-shrink-0">
            <div className="relative mb-5">
              <div className="bg-purple absolute -inset-2.5 rounded-full opacity-[0.14]"></div>
              <div className="relative size-16 rounded-full grad-brand text-white flex items-center justify-center shadow-float-sm">
                <i className="ri-bank-card-fill text-3xl"></i>
              </div>
            </div>
            <div className="text-xs font-mono font-bold text-pink mb-1">01 · PAY</div>
            <h4 className="font-head font-bold mb-2">Customer pays</h4>
            <p className="text-sm text-muted leading-relaxed">
              Shopper checks out at a partner's shop, in person or online — no account needed yet.
            </p>
          </div>
          <div className="step-card shadow-float-sm w-57.5 p-6 flex-shrink-0">
            <div className="relative mb-5">
              <div className="bg-purple absolute -inset-2.5 rounded-full opacity-[0.14]"></div>
              <div className="relative size-16 rounded-full grad-brand text-white flex items-center justify-center shadow-float-sm">
                <i className="ri-fingerprint-fill text-3xl"></i>
              </div>
            </div>
            <div className="text-xs font-mono font-bold text-pink mb-1">02 · SIGN IN</div>
            <h4 className="font-head font-bold mb-2">Signs in</h4>
            <p className="text-sm text-muted leading-relaxed">
              Enoki zkLogin verifies identity with a phone number or Google account — no seed
              phrase, no wallet popup.
            </p>
          </div>
          <div className="step-card shadow-float-sm w-57.5 p-6 flex-shrink-0">
            <div className="relative mb-5">
              <div className="bg-purple absolute -inset-2.5 rounded-full opacity-[0.14]"></div>
              <div className="relative size-16 rounded-full grad-brand text-white flex items-center justify-center shadow-float-sm">
                <i className="ri-settings-3-fill text-3xl"></i>
              </div>
            </div>
            <div className="text-xs font-mono font-bold text-pink mb-1">03 · GATEWAY</div>
            <h4 className="font-head font-bold mb-2">Gateway applies rules</h4>
            <p className="text-sm text-muted leading-relaxed">
              OctaP's gateway checks the merchant's active campaign and tier rules to calculate the
              right number of points.
            </p>
          </div>
          <div className="step-card shadow-float-sm w-57.5 p-6 flex-shrink-0">
            <div className="relative mb-5">
              <div className="bg-purple absolute -inset-2.5 rounded-full opacity-[0.14]"></div>
              <div className="relative size-16 rounded-full grad-brand text-white flex items-center justify-center shadow-float-sm">
                <i className="ri-box-3-fill text-3xl"></i>
              </div>
            </div>
            <div className="text-xs font-mono font-bold text-pink mb-1">04 · SUI LEDGER</div>
            <h4 className="font-head font-bold mb-2">Recorded on Sui</h4>
            <p className="text-sm text-muted leading-relaxed">
              Written to the merchant's isolated Move record — the transaction is sponsored, so the
              customer pays no gas.
            </p>
          </div>
          <div className="step-card shadow-float-sm w-57.5 p-6 flex-shrink-0">
            <div className="relative mb-5">
              <div className="bg-purple absolute -inset-2.5 rounded-full opacity-[0.14]"></div>
              <div className="relative size-16 rounded-full grad-brand text-white flex items-center justify-center shadow-float-sm">
                <i className="ri-award-fill text-3xl"></i>
              </div>
            </div>
            <div className="text-xs font-mono font-bold text-pink mb-1">05 · PROOF</div>
            <h4 className="font-head font-bold mb-2">Verifiable proof</h4>
            <p className="text-sm text-muted leading-relaxed">
              Customer and merchant can both check the same record afterwards — nothing hides in an
              internal database.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
