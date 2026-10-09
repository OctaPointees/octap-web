const AUDIENCES = [
  {
    span: 'md:col-span-3',
    icon: 'ti-building-store',
    color: '#ff5fc4',
    title: 'Merchants & business partners',
    bullets: [
      'Set up your organization profile and subdomain',
      'Launch and manage campaigns, vouchers, and point rules',
      'Get sales reports and notifications; manage billing and payment methods',
    ],
  },
  {
    span: 'md:col-span-2',
    icon: 'ti-code',
    color: '#8b5cf6',
    title: 'Developers & integrators',
    bullets: ['TypeScript SDK and scoped API keys', 'Webhooks and real-time API/SDK logs', 'Isolated sandbox with mock transactions'],
  },
  {
    span: 'md:col-span-2',
    icon: 'ti-device-mobile',
    color: '#38dbe0',
    title: 'End users',
    bullets: [
      'Earn and redeem by scanning a QR/barcode or entering a code',
      'Balance, history, and expiry warnings in one place',
      'Verify a point or voucher against the blockchain record',
    ],
  },
];

export default function WhoItsFor() {
  return (
    <section id="who" className="scroll-mt-16 py-24">
      <div className="max-w-[1280px] mx-auto px-8">
        <h2 className="text-4xl font-extrabold mb-10 tracking-tight text-white" data-reveal>
          Who it&apos;s for
        </h2>
        <div className="grid md:grid-cols-7 gap-6 [perspective:1200px]">
          {AUDIENCES.map((audience) => (
            <div key={audience.title} className={`${audience.span} glass rounded-3xl p-8`} data-reveal data-tilt>
              <i className={`ti ${audience.icon} text-3xl`} style={{ color: audience.color }} />
              <h3 className="text-xl font-bold mt-4 mb-4 text-white">{audience.title}</h3>
              <ul className="space-y-3 text-sm text-[#c8bcdb]">
                {audience.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <i className="ti ti-point-filled text-[8px] mt-1.5" style={{ color: audience.color }} />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
