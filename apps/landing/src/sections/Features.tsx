export default function Features() {
  return (
    <>
  <section id="features" className="scroll-mt-20 py-20">
    <div className="max-w-[1280px] mx-auto px-8">
      <h2 className="font-head text-4xl font-extrabold tracking-tight mb-10">Features</h2>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="rounded-[8px] p-7 bg-white border border-[var(--purple)]/10">
          <span className="text-[10px] font-mono font-bold text-[var(--pink)] uppercase tracking-wide">FE-01</span>
          <div className="size-14 rounded-full flex items-center justify-center mb-4 text-white" style={{"background": "var(--purple)"}}><i className="ri-coins-fill text-3xl"></i></div>
          <h3 className="font-head text-base font-bold mb-1.5">Reward points &amp; vouchers</h3>
          <p className="text-[13px] text-[#6b5a7d] leading-relaxed">Earn and redeem across a merchant's shops by scanning a QR/barcode or entering a code. Balance, history, expiry warnings, and record verification.</p>
        </div>
        <div className="rounded-[8px] p-7 bg-white border border-[var(--purple)]/10">
          <span className="text-[10px] font-mono font-bold text-[var(--purple)] uppercase tracking-wide">FE-02</span>
          <div className="size-14 rounded-full flex items-center justify-center mb-4 text-white" style={{"background": "var(--purple)"}}><i className="ri-dashboard-3-fill text-3xl"></i></div>
          <h3 className="font-head text-base font-bold mb-1.5">Modular Partner Dashboard</h3>
          <p className="text-[13px] text-[#6b5a7d] leading-relaxed">Organization profile and subdomain, members and customers, campaigns and vouchers, reports, billing plan and payment methods.</p>
        </div>
        <div className="rounded-[8px] p-7 bg-white border border-[var(--purple)]/10">
          <span className="text-[10px] font-mono font-bold text-[var(--purple)] uppercase tracking-wide">FE-03</span>
          <div className="size-14 rounded-full flex items-center justify-center mb-4 text-white" style={{"background": "var(--purple)"}}><i className="ri-admin-fill text-3xl"></i></div>
          <h3 className="font-head text-base font-bold mb-1.5">System Admin Dashboard</h3>
          <p className="text-[13px] text-[#6b5a7d] leading-relaxed">Approve partners, provision accounts and subdomains, activate or ban, configure the credit engine, trace points on the Sui ledger.</p>
        </div>
        <div className="rounded-[8px] p-7 bg-white border border-[var(--purple)]/10">
          <span className="text-[10px] font-mono font-bold text-[var(--pink)] uppercase tracking-wide">FE-04</span>
          <div className="size-14 rounded-full flex items-center justify-center mb-4 text-white" style={{"background": "var(--purple)"}}><i className="ri-cpu-fill text-3xl"></i></div>
          <h3 className="font-head text-base font-bold mb-1.5">AI-ready MCP server</h3>
          <p className="text-[13px] text-[#6b5a7d] leading-relaxed">AI agents and chatbots query balances and manage campaigns strictly within RBAC permissions. Mutations require explicit approval.</p>
        </div>
        <div className="rounded-[8px] p-7 bg-white border border-[var(--purple)]/10">
          <span className="text-[10px] font-mono font-bold text-[var(--pink)] uppercase tracking-wide">FE-05</span>
          <div className="size-14 rounded-full flex items-center justify-center mb-4 text-white" style={{"background": "var(--purple)"}}><i className="ri-terminal-box-fill text-3xl"></i></div>
          <h3 className="font-head text-base font-bold mb-1.5">Developer SDK suite</h3>
          <p className="text-[13px] text-[#6b5a7d] leading-relaxed">TypeScript SDK, scoped API keys and secret tokens, webhooks, real-time API/SDK logs, isolated sandbox with mock transactions.</p>
        </div>
      </div>
    </div>
  </section>

    </>
  );
}
