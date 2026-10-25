export default function Developers() {
  return (
    <section id="developers" className="scroll-mt-20 py-20">
      <div className="max-w-320 mx-auto px-8">
        <h2 className="font-head text-4xl font-extrabold tracking-tight mb-10">
          Built for developers
        </h2>
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-3 rounded-field p-6 overflow-x-auto bg-[#1d1330] shadow-float-sm">
            <div className="text-xs font-mono text-bloom mb-3 uppercase tracking-wide">
              Illustrative — not a live endpoint
            </div>
            <pre className="font-mono text-sm leading-relaxed text-[#e7defb]">
              <code>{String.raw`import { OctaPClient } from '@octap/sdk';

const octap = new OctaPClient({
apiKey: process.env.OCTAP_API_KEY,
});

const result = await octap.points.earn({
merchantId: 'lotus-mart',
customerRef: 'phone:+84901234567',
code: 'RCPT-48213',
});

console.log(result.pointsIssued, result.ledgerRecordId);`}</code>
            </pre>
          </div>
          <div className="lg:col-span-2 card-tint rounded-field p-7">
            <h3 className="font-head text-sm font-bold mb-4 flex items-center gap-2">
              <i className="ri-cpu-line text-purple"></i>AI-ready MCP server
            </h3>
            <ul className="space-y-3 text-sm text-muted">
              <li className="flex gap-2">
                <i className="ri-checkbox-circle-fill text-pink mt-0.5"></i>Agents can query point
                balances and campaign status
              </li>
              <li className="flex gap-2">
                <i className="ri-checkbox-circle-fill text-pink mt-0.5"></i>Campaign changes stay
                inside each partner's RBAC scope
              </li>
              <li className="flex gap-2">
                <i className="ri-checkbox-circle-fill text-pink mt-0.5"></i>Any mutation an agent
                proposes needs explicit human approval
              </li>
            </ul>
            <p className="mt-5 text-xs font-mono text-muted">
              API/SDK balance queries target under 500ms.
            </p>
          </div>
        </div>

        {/* Relocated from hero: the architecture diagram fits the technical section better than the top-of-page hero photo. */}
        <div className="mt-10">
          <span className="text-xs font-mono font-bold text-pink uppercase tracking-wide">
            Platform architecture at a glance
          </span>
          <div
            className="relative rounded-box border border-purple/12 p-6 md:p-7 mt-3"
            style={{ background: '#ffffff' }}
          >
            <div className="grid md:grid-cols-[1fr_1.3fr_1fr] gap-2.5 items-stretch">
              {/* Channels */}
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-mono font-bold tracking-wider text-muted">
                  CHANNELS
                </span>
                <div className="bg-tint rounded-md p-3 flex-1">
                  <i className="ri-store-2-line text-purple text-sm"></i>
                  <div className="text-xs font-bold mt-1.5 leading-tight">POS &amp; Web Apps</div>
                  <div className="text-xs text-muted mt-1 leading-snug">
                    Earn/redeem via the TypeScript SDK
                  </div>
                </div>
                <div className="bg-tint rounded-md p-3 flex-1">
                  <i className="ri-robot-2-line text-purple text-sm"></i>
                  <div className="text-xs font-bold mt-1.5 leading-tight">AI Agents (MCP)</div>
                  <div className="text-xs text-muted mt-1 leading-snug">
                    Query balances within RBAC
                  </div>
                </div>
              </div>
              {/* OctaP Platform */}
              <div className="bg-purple rounded-md p-3.5 flex flex-col text-white">
                <span className="text-xs font-mono font-bold tracking-wider text-white/70">
                  OCTAP PLATFORM
                </span>
                <div className="text-sm font-extrabold mt-1.5 font-head">Credit Engine</div>
                <div className="text-xs text-white/70 mb-2.5">
                  Tenant-isolated points &amp; vouchers
                </div>
                <div className="space-y-1.5">
                  <div
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                    style={{ background: 'rgba(255,255,255,0.16)' }}
                  >
                    Earn · Redeem · Expire
                  </div>
                  <div
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                    style={{ background: 'rgba(255,255,255,0.16)' }}
                  >
                    Partner Dashboard
                  </div>
                  <div
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                    style={{ background: 'rgba(255,255,255,0.16)' }}
                  >
                    MCP Adapter
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2.5">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-sm text-white"
                    style={{ background: 'rgba(255,255,255,0.22)' }}
                  >
                    Lotus Mart
                  </span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-sm text-white"
                    style={{ background: 'rgba(255,255,255,0.22)' }}
                  >
                    Phố Cà Phê
                  </span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-sm text-white"
                    style={{ background: 'rgba(255,255,255,0.22)' }}
                  >
                    Sài Gòn Books
                  </span>
                </div>
              </div>
              {/* Sui Ledger */}
              <div className="bg-tint rounded-md p-3 flex flex-col gap-1.5">
                <span className="text-xs font-mono font-bold tracking-wider text-muted">
                  SUI LEDGER
                </span>
                <div className="rounded-lg px-2 py-1.5" style={{ background: '#ffffff' }}>
                  <div className="text-xs font-bold">Issue credit</div>
                  <div className="text-xs font-mono text-muted">0x9f3a…c21e · final</div>
                </div>
                <div className="rounded-lg px-2 py-1.5" style={{ background: '#ffffff' }}>
                  <div className="text-xs font-bold">Redeem voucher</div>
                  <div className="text-xs font-mono text-muted">0x4b7d…a08f · final</div>
                </div>
                <div className="mt-0.5 space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted">
                    <i className="ri-checkbox-circle-fill text-xs text-pink"></i>Immutable audit
                    trail
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted">
                    <i className="ri-checkbox-circle-fill text-xs text-pink"></i>Walletless zkLogin
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-3 text-xs font-mono text-muted">
              <i className="ri-arrow-right-line"></i>write<span className="mx-1">·</span>
              <i className="ri-arrow-left-line"></i>verify
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
