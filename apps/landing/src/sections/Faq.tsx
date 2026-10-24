export default function Faq() {
  return (
    <>
  <section id="faq" className="scroll-mt-20 py-20">
    <div className="max-w-[820px] mx-auto px-8">
      <h2 className="font-head text-4xl font-extrabold tracking-tight mb-10">Frequently asked questions</h2>
      <div className="space-y-3">
        <details className="group card-tint rounded-[8px] px-6 py-4" open><summary className="flex items-center justify-between cursor-pointer font-bold text-sm list-none">What exactly is OctaP?<i className="ri-arrow-down-s-line chev transition-transform"></i></summary><p className="mt-3 text-sm text-[#6b5a7d] leading-relaxed">A Credit-as-a-Service platform that lets businesses run their own loyalty points and vouchers on the Sui blockchain, without building blockchain infrastructure themselves.</p></details>
        <details className="group card-tint rounded-[8px] px-6 py-4"><summary className="flex items-center justify-between cursor-pointer font-bold text-sm list-none">Do shoppers need a crypto wallet?<i className="ri-arrow-down-s-line chev transition-transform"></i></summary><p className="mt-3 text-sm text-[#6b5a7d] leading-relaxed">No. Customers sign in with Google, email, or phone. Enoki zkLogin and sponsored transactions keep wallets and gas out of sight.</p></details>
        <details className="group card-tint rounded-[8px] px-6 py-4"><summary className="flex items-center justify-between cursor-pointer font-bold text-sm list-none">Can points be cashed out to money?<i className="ri-arrow-down-s-line chev transition-transform"></i></summary><p className="mt-3 text-sm text-[#6b5a7d] leading-relaxed">No. Points are promotional credit, never converted to fiat currency.</p></details>
        <details className="group card-tint rounded-[8px] px-6 py-4"><summary className="flex items-center justify-between cursor-pointer font-bold text-sm list-none">Can points move between different shops?<i className="ri-arrow-down-s-line chev transition-transform"></i></summary><p className="mt-3 text-sm text-[#6b5a7d] leading-relaxed">Only within the same merchant's shops. Points never cross between unrelated merchants and can't be transferred person-to-person.</p></details>
        <details className="group card-tint rounded-[8px] px-6 py-4"><summary className="flex items-center justify-between cursor-pointer font-bold text-sm list-none">How is fraud prevented?<i className="ri-arrow-down-s-line chev transition-transform"></i></summary><p className="mt-3 text-sm text-[#6b5a7d] leading-relaxed">Every point issued or redeemed is written to the merchant's ledger record on Sui, so it can be checked rather than taken on trust.</p></details>
        <details className="group card-tint rounded-[8px] px-6 py-4"><summary className="flex items-center justify-between cursor-pointer font-bold text-sm list-none">How do developers integrate?<i className="ri-arrow-down-s-line chev transition-transform"></i></summary><p className="mt-3 text-sm text-[#6b5a7d] leading-relaxed">Through the TypeScript SDK, scoped API keys, webhooks, and real-time logs, with a sandbox for testing before going live.</p></details>
        <details className="group card-tint rounded-[8px] px-6 py-4"><summary className="flex items-center justify-between cursor-pointer font-bold text-sm list-none">What is MCP?<i className="ri-arrow-down-s-line chev transition-transform"></i></summary><p className="mt-3 text-sm text-[#6b5a7d] leading-relaxed">The Model Context Protocol lets AI agents query balances and campaign data within strict RBAC permissions; any mutation they propose needs explicit human approval.</p></details>
        <details className="group card-tint rounded-[8px] px-6 py-4"><summary className="flex items-center justify-between cursor-pointer font-bold text-sm list-none">Is this a production system?<i className="ri-arrow-down-s-line chev transition-transform"></i></summary><p className="mt-3 text-sm text-[#6b5a7d] leading-relaxed">This is a capstone project. The flows and APIs are designed the way a production CaaS platform would work, but the data on this page is illustrative.</p></details>
      </div>
    </div>
  </section>

    </>
  );
}
