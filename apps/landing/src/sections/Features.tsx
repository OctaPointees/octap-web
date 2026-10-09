const ROW_1 = [
  {
    icon: 'ti-coin',
    color: '#ff5fc4',
    title: 'Reward points & vouchers',
    description:
      "Earn and redeem across a merchant's shops by scanning a QR/barcode or entering a code. Balance, history, expiry warnings, and record verification.",
  },
  {
    icon: 'ti-layout-dashboard',
    color: '#8b5cf6',
    title: 'Modular Partner Dashboard',
    description: 'Organization profile and subdomain, members and customers, campaigns and vouchers, reports, billing plan and payment methods.',
  },
  {
    icon: 'ti-shield-check',
    color: '#38dbe0',
    title: 'System Admin Dashboard',
    description: 'Approve partners, provision accounts and subdomains, activate or ban, configure the credit engine, trace points on the Sui ledger.',
  },
];

const ROW_2 = [
  {
    icon: 'ti-cpu',
    color: '#ff5fc4',
    title: 'AI-ready MCP server',
    description: 'AI agents and chatbots query balances and manage campaigns strictly within RBAC permissions. Mutations require explicit approval.',
  },
  {
    icon: 'ti-code',
    color: '#8b5cf6',
    title: 'Developer SDK suite',
    description: 'TypeScript SDK, scoped API keys and secret tokens, webhooks, real-time API/SDK logs, isolated sandbox with mock transactions.',
  },
];

export default function Features() {
  return (
    <section id="features" className="scroll-mt-16 py-24">
      <div className="max-w-[1280px] mx-auto px-8">
        <h2 className="text-4xl font-extrabold mb-10 tracking-tight text-white" data-reveal>
          Features
        </h2>
        <div className="grid md:grid-cols-3 gap-6 mb-6 [perspective:1200px]">
          {ROW_1.map((feature) => (
            <div key={feature.title} className="glass rounded-3xl p-7" data-reveal data-tilt>
              <i className={`ti ${feature.icon} text-2xl block`} style={{ color: feature.color }} />
              <h3 className="text-base font-bold mt-4 mb-2 text-white">{feature.title}</h3>
              <p className="text-sm text-[#c8bcdb] leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6 [perspective:1200px]">
          {ROW_2.map((feature) => (
            <div key={feature.title} className="glass rounded-3xl p-8" data-reveal data-tilt>
              <i className={`ti ${feature.icon} text-2xl block`} style={{ color: feature.color }} />
              <h3 className="text-base font-bold mt-4 mb-2 text-white">{feature.title}</h3>
              <p className="text-sm text-[#c8bcdb] leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
