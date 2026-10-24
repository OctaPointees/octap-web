export default function LaunchOffer() {
  return (
    <>
  <section className="max-w-[1280px] mx-auto px-8 py-10">
    <div className="rounded-[10px] grad-brand text-white p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 shadow-float relative overflow-hidden">
      <div className="relative max-w-xl">
        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold mb-4" style={{"background": "rgba(255,255,255,0.18)"}}>Launch offer</span>
        <h3 className="font-head text-3xl font-extrabold mb-3">Points your customers actually want to come back for</h3>
        <p className="text-white/85 leading-relaxed">Launch a pilot loyalty program on OctaP in days, not quarters. Onboarding specialists help you map your first campaign and import your point rules.</p>
      </div>
      <a href="#lead-gen" className="relative btn-pill text-sm px-7 py-3.5 flex-shrink-0" style={{"background": "#fff", "color": "var(--purple)"}}>SEE THE OFFER</a>
    </div>
  </section>

    </>
  );
}
