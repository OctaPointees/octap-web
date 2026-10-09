const PARTNERS = [
  { icon: 'ti-building-store', color: '#ff5fc4', name: 'Lotus Mart', category: 'Supermarket', pointName: 'Petal' },
  { icon: 'ti-coffee', color: '#8b5cf6', name: 'Phố Cà Phê', category: 'Coffee chain', pointName: 'Coffee Bean' },
  { icon: 'ti-book', color: '#38dbe0', name: 'Sài Gòn Books', category: 'Bookstore', pointName: 'Bookmark' },
];

export default function Partners() {
  return (
    <section className="py-24">
      <div className="max-w-[1280px] mx-auto px-8">
        <h2 className="text-4xl font-extrabold mb-1 tracking-tight text-white" data-reveal>
          Example partners
        </h2>
        <p className="text-sm text-[#8a7fa3] mb-10 font-mono">Fictional examples for illustration</p>
        <div className="grid md:grid-cols-3 gap-6 [perspective:1200px]">
          {PARTNERS.map((partner) => (
            <div key={partner.name} className="relative glass rounded-2xl p-6" data-reveal-flip data-tilt>
              <div className="flex items-center gap-3 pb-3 border-b border-dashed border-white/15">
                <i className={`ti ${partner.icon} text-xl`} style={{ color: partner.color }} />
                <div>
                  <div className="font-bold text-sm text-white">{partner.name}</div>
                  <div className="text-[11px] text-[#8a7fa3]">{partner.category}</div>
                </div>
              </div>
              <div className="pt-3 flex items-center justify-between text-sm">
                <span className="text-[#8a7fa3]">Point name</span>
                <span className="font-semibold" style={{ color: partner.color }}>
                  {partner.pointName}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
