export default function UseCases() {
  return (
    <>
  <section id="who" className="scroll-mt-20 py-20">
    <div className="max-w-[900px] mx-auto px-8 text-center">
      <h2 className="font-head text-4xl font-extrabold tracking-tight">A points platform built for <span className="grad-text">everyone</span> involved</h2>
      <p className="mt-4 text-[#6b5a7d] leading-relaxed">OctaP serves three groups of people — each with an experience built for them, all backed by the same transparent ledger.</p>
    </div>
    <div className="max-w-[1180px] mx-auto px-8 mt-12 grid md:grid-cols-3 gap-6">
      <div className="card-tint rounded-[8px] p-8">
        <i className="ri-store-2-line text-3xl text-[var(--purple)]"></i>
        <h3 className="font-head text-xl font-bold mt-4 mb-4">Merchants &amp; business partners</h3>
        <ul className="space-y-2.5 text-sm text-[#6b5a7d]">
          <li className="flex gap-2"><i className="ri-checkbox-circle-fill text-[var(--pink)] mt-0.5"></i>Set up your organization profile and subdomain</li>
          <li className="flex gap-2"><i className="ri-checkbox-circle-fill text-[var(--pink)] mt-0.5"></i>Launch and manage campaigns, vouchers, and point rules</li>
          <li className="flex gap-2"><i className="ri-checkbox-circle-fill text-[var(--pink)] mt-0.5"></i>Get sales reports and notifications; manage billing and payment methods</li>
        </ul>
      </div>
      <div className="card-tint rounded-[8px] p-8">
        <i className="ri-code-s-slash-line text-3xl text-[var(--purple)]"></i>
        <h3 className="font-head text-xl font-bold mt-4 mb-4">Developers &amp; integrators</h3>
        <ul className="space-y-2.5 text-sm text-[#6b5a7d]">
          <li className="flex gap-2"><i className="ri-checkbox-circle-fill text-[var(--pink)] mt-0.5"></i>TypeScript SDK and scoped API keys</li>
          <li className="flex gap-2"><i className="ri-checkbox-circle-fill text-[var(--pink)] mt-0.5"></i>Webhooks and real-time API/SDK logs</li>
          <li className="flex gap-2"><i className="ri-checkbox-circle-fill text-[var(--pink)] mt-0.5"></i>Isolated sandbox with mock transactions</li>
        </ul>
      </div>
      <div className="card-tint rounded-[8px] p-8">
        <i className="ri-smartphone-line text-3xl text-[var(--purple)]"></i>
        <h3 className="font-head text-xl font-bold mt-4 mb-4">End users</h3>
        <ul className="space-y-2.5 text-sm text-[#6b5a7d]">
          <li className="flex gap-2"><i className="ri-checkbox-circle-fill text-[var(--pink)] mt-0.5"></i>Earn and redeem by scanning a QR/barcode or entering a code</li>
          <li className="flex gap-2"><i className="ri-checkbox-circle-fill text-[var(--pink)] mt-0.5"></i>Balance, history, and expiry warnings in one place</li>
          <li className="flex gap-2"><i className="ri-checkbox-circle-fill text-[var(--pink)] mt-0.5"></i>Verify a point or voucher against the blockchain record</li>
        </ul>
      </div>
    </div>
  </section>

    </>
  );
}
