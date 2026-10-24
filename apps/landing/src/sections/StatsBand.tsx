export default function StatsBand() {
  return (
    <>
  <section className="py-6">
    <div className="mx-4 md:mx-8 rounded-[12px] grad-brand text-white py-16 px-8">
      <h3 className="font-head text-center text-2xl md:text-3xl font-extrabold mb-10">Illustrative milestones <span style={{"color": "var(--amber)"}}>(demo data)</span></h3>
      <div className="max-w-[900px] mx-auto grid grid-cols-3 gap-6 text-center">
        <div>
          <div className="font-head text-4xl md:text-5xl font-extrabold" style={{"color": "var(--amber)"}}>128,400+</div>
          <div className="text-xs md:text-sm text-white/80 mt-2">Points issued (demo)</div>
        </div>
        <div>
          <div className="font-head text-4xl md:text-5xl font-extrabold text-white">340+</div>
          <div className="text-xs md:text-sm text-white/80 mt-2">Merchants onboarded (demo)</div>
        </div>
        <div>
          <div className="font-head text-4xl md:text-5xl font-extrabold" style={{"color": "var(--amber)"}}>99.9%</div>
          <div className="text-xs md:text-sm text-white/80 mt-2">Ledger uptime target</div>
        </div>
      </div>
    </div>
  </section>

    </>
  );
}
