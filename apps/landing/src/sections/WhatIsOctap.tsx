const CARDS = [
  {
    icon: 'ti-building-store',
    color: '#ff5fc4',
    title: 'Isolated per merchant',
    description: "Every business runs its own points and vouchers. Lotus Mart's Petals never mix with another merchant's program.",
  },
  {
    icon: 'ti-ticket',
    color: '#38dbe0',
    title: 'Verifiable on Sui',
    description: "Each point earned or redeemed is recorded on Sui's ledger, so customers and partners can check the record itself.",
  },
  {
    icon: 'ti-circle-check',
    color: '#8b5cf6',
    title: 'No wallet needed',
    description: 'Customers sign in with Google, email, or phone. Enoki zkLogin and sponsored transactions keep the blockchain out of sight.',
  },
];

export default function WhatIsOctap() {
  return (
    <section className="py-20">
      <div className="max-w-[1280px] mx-auto px-8 grid md:grid-cols-3 gap-6 [perspective:1200px]">
        {CARDS.map((card) => (
          <div key={card.title} className="glass rounded-3xl p-7" data-reveal data-tilt>
            <div className="size-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
              <i className={`ti ${card.icon} text-2xl`} style={{ color: card.color }} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-white">{card.title}</h3>
            <p className="text-sm text-[#c8bcdb] leading-relaxed">{card.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
