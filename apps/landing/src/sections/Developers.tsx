const CODE_SAMPLE = `import { OctaPClient } from '@octap/sdk';

const octap = new OctaPClient({
  apiKey: process.env.OCTAP_API_KEY,
});

const result = await octap.points.earn({
  merchantId: 'lotus-mart',
  customerRef: 'phone:+84901234567',
  code: 'RCPT-48213',
});

console.log(result.pointsIssued, result.ledgerRecordId);`;

const MCP_POINTS = [
  'Agents can query point balances and campaign status',
  "Campaign changes stay inside each partner's RBAC scope",
  'Any mutation an agent proposes needs explicit human approval',
];

export default function Developers() {
  return (
    <>
      <div className="max-w-[1280px] mx-auto px-8 -mt-10 pb-10 relative" style={{ zIndex: 2 }}>
        <p className="text-xs font-mono text-[#8a7fa3]">Point earn / redeem requests target under 2 seconds under normal load.</p>
      </div>

      <section id="developers" className="scroll-mt-16 py-24 relative overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-8 relative">
          <h2 className="text-4xl font-extrabold mb-10 text-white tracking-tight" data-reveal>
            Built for developers
          </h2>
          <div className="grid lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-3 glass rounded-2xl p-6 overflow-x-auto" data-reveal-left>
              <div className="text-[10px] font-mono text-[#ff5fc4] mb-3 uppercase tracking-wide">Illustrative — not a live endpoint</div>
              <pre className="font-mono text-[12.5px] leading-relaxed text-[#e4def2]">
                <code>{CODE_SAMPLE}</code>
              </pre>
            </div>
            <div className="lg:col-span-2 glass rounded-2xl p-6" data-reveal-right>
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-white">
                <i className="ti ti-cpu text-[#38dbe0]" />
                AI-ready MCP server
              </h3>
              <ul className="space-y-3 text-sm text-[#c8bcdb]">
                {MCP_POINTS.map((point) => (
                  <li key={point} className="flex gap-2">
                    <i className="ti ti-circle-check text-[#38dbe0] mt-0.5" />
                    {point}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-[11px] font-mono text-[#8a7fa3]">API/SDK balance queries target under 500ms.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
