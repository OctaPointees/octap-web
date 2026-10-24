export default function Developers() {
  return (
    <>
  <section id="developers" className="scroll-mt-20 py-20">
    <div className="max-w-[1280px] mx-auto px-8">
      <h2 className="font-head text-4xl font-extrabold tracking-tight mb-10">Built for developers</h2>
      <div className="grid lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-3 rounded-[8px] p-6 overflow-x-auto bg-[#1d1330] shadow-float-sm">
          <div className="text-[10px] font-mono text-[var(--bloom)] mb-3 uppercase tracking-wide">Illustrative — not a live endpoint</div>
          <pre className="font-mono text-[12.5px] leading-relaxed text-[#e7defb]"><code>{String.raw`import { OctaPClient } from '@octap/sdk';

const octap = new OctaPClient({
  apiKey: process.env.OCTAP_API_KEY,
});

const result = await octap.points.earn({
  merchantId: 'lotus-mart',
  customerRef: 'phone:+84901234567',
  code: 'RCPT-48213',
});

console.log(result.pointsIssued, result.ledgerRecordId);`}</code></pre>
        </div>
        <div className="lg:col-span-2 card-tint rounded-[8px] p-7">
          <h3 className="font-head text-sm font-bold mb-4 flex items-center gap-2"><i className="ri-cpu-line text-[var(--purple)]"></i>AI-ready MCP server</h3>
          <ul className="space-y-3 text-sm text-[#6b5a7d]">
            <li className="flex gap-2"><i className="ri-checkbox-circle-fill text-[var(--pink)] mt-0.5"></i>Agents can query point balances and campaign status</li>
            <li className="flex gap-2"><i className="ri-checkbox-circle-fill text-[var(--pink)] mt-0.5"></i>Campaign changes stay inside each partner's RBAC scope</li>
            <li className="flex gap-2"><i className="ri-checkbox-circle-fill text-[var(--pink)] mt-0.5"></i>Any mutation an agent proposes needs explicit human approval</li>
          </ul>
          <p className="mt-5 text-[11px] font-mono text-[#8a7a9c]">API/SDK balance queries target under 500ms.</p>
        </div>
      </div>

      {/* Relocated from hero: the architecture diagram fits the technical section better than the top-of-page hero photo. */}
      <div className="mt-10">
        <span className="text-[11px] font-mono font-bold text-[var(--pink)] uppercase tracking-wide">Platform architecture at a glance</span>
        <div className="relative rounded-[10px] border border-[var(--purple)]/12 p-6 md:p-7 mt-3" style={{"background": "#ffffff"}}>
          <div className="grid md:grid-cols-[1fr_1.3fr_1fr] gap-2.5 items-stretch">
            {/* Channels */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[9px] font-mono font-bold tracking-wider text-[#8a7a9c]">CHANNELS</span>
              <div className="rounded-md p-3 flex-1" style={{"background": "var(--tint)"}}>
                <i className="ri-store-2-line text-[var(--purple)] text-sm"></i>
                <div className="text-[11px] font-bold mt-1.5 leading-tight">POS &amp; Web Apps</div>
                <div className="text-[9px] text-[#6b5a7d] mt-1 leading-snug">Earn/redeem via the TypeScript SDK</div>
              </div>
              <div className="rounded-md p-3 flex-1" style={{"background": "var(--tint)"}}>
                <i className="ri-robot-2-line text-[var(--purple)] text-sm"></i>
                <div className="text-[11px] font-bold mt-1.5 leading-tight">AI Agents (MCP)</div>
                <div className="text-[9px] text-[#6b5a7d] mt-1 leading-snug">Query balances within RBAC</div>
              </div>
            </div>
            {/* OctaP Platform */}
            <div className="rounded-md p-3.5 flex flex-col text-white" style={{"background": "var(--purple)"}}>
              <span className="text-[9px] font-mono font-bold tracking-wider text-white/70">OCTAP PLATFORM</span>
              <div className="text-[13px] font-extrabold mt-1.5 font-head">Credit Engine</div>
              <div className="text-[9px] text-white/70 mb-2.5">Tenant-isolated points &amp; vouchers</div>
              <div className="space-y-1.5">
                <div className="rounded-lg px-2.5 py-1.5 text-[10px] font-semibold" style={{"background": "rgba(255,255,255,0.16)"}}>Earn · Redeem · Expire</div>
                <div className="rounded-lg px-2.5 py-1.5 text-[10px] font-semibold" style={{"background": "rgba(255,255,255,0.16)"}}>Partner Dashboard</div>
                <div className="rounded-lg px-2.5 py-1.5 text-[10px] font-semibold" style={{"background": "rgba(255,255,255,0.16)"}}>MCP Adapter</div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2.5">
                <span className="text-[8px] font-bold px-2 py-0.5 rounded-sm text-white" style={{"background": "rgba(255,255,255,0.22)"}}>Lotus Mart</span>
                <span className="text-[8px] font-bold px-2 py-0.5 rounded-sm text-white" style={{"background": "rgba(255,255,255,0.22)"}}>Phố Cà Phê</span>
                <span className="text-[8px] font-bold px-2 py-0.5 rounded-sm text-white" style={{"background": "rgba(255,255,255,0.22)"}}>Sài Gòn Books</span>
              </div>
            </div>
            {/* Sui Ledger */}
            <div className="rounded-md p-3 flex flex-col gap-1.5" style={{"background": "var(--tint)"}}>
              <span className="text-[9px] font-mono font-bold tracking-wider text-[#8a7a9c]">SUI LEDGER</span>
              <div className="rounded-lg px-2 py-1.5" style={{"background": "#ffffff"}}>
                <div className="text-[9.5px] font-bold">Issue credit</div>
                <div className="text-[8px] font-mono text-[#8a7a9c]">0x9f3a…c21e · final</div>
              </div>
              <div className="rounded-lg px-2 py-1.5" style={{"background": "#ffffff"}}>
                <div className="text-[9.5px] font-bold">Redeem voucher</div>
                <div className="text-[8px] font-mono text-[#8a7a9c]">0x4b7d…a08f · final</div>
              </div>
              <div className="mt-0.5 space-y-1">
                <div className="flex items-center gap-1 text-[9px] text-[#6b5a7d]"><i className="ri-checkbox-circle-fill text-[7px] text-[var(--pink)]"></i>Immutable audit trail</div>
                <div className="flex items-center gap-1 text-[9px] text-[#6b5a7d]"><i className="ri-checkbox-circle-fill text-[7px] text-[var(--pink)]"></i>Walletless zkLogin</div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-3 text-[8px] font-mono text-[#8a7a9c]">
            <i className="ri-arrow-right-line"></i>write<span className="mx-1">·</span><i className="ri-arrow-left-line"></i>verify
          </div>
        </div>
      </div>
    </div>
  </section>

    </>
  );
}
