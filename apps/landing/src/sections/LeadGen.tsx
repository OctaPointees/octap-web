export default function LeadGen() {
  return (
    <>
  <section id="lead-gen" className="scroll-mt-20 py-10">
    <div className="max-w-[1280px] mx-auto px-8">
      <div className="grid lg:grid-cols-2 rounded-[10px] overflow-hidden shadow-float">
        <div className="grad-brand text-white p-12 relative overflow-hidden flex flex-col justify-center">
          <svg className="absolute -left-6 -top-10 opacity-20" width="220" height="220" viewBox="0 0 220 220" fill="none"><path d="M70 40C40 55 25 85 25 115c0 25 18 40 38 40 18 0 32-13 32-31 0-17-12-29-27-29-3 0-6 .4-8 1 2-20 16-35 33-43L70 40zm90 0c-30 15-45 45-45 75 0 25 18 40 38 40 18 0 32-13 32-31 0-17-12-29-27-29-3 0-6 .4-8 1 2-20 16-35 33-43L160 40z" fill="currentColor"/></svg>
          <div className="relative">
            <h2 className="font-head text-3xl font-extrabold mb-4">Talk to us about loyalty points for your business</h2>
            <p className="text-white/85 leading-relaxed">Customer loyalty, employee recognition, or sales incentives — OctaP's points infrastructure adapts to what your business needs. Leave your details and our team will reach out.</p>
          </div>
        </div>
        <div className="bg-white p-10 md:p-12">
          <div className="grid sm:grid-cols-2 gap-4">
            <input type="text" placeholder="Full name *" className="rounded-md border border-[var(--purple)]/15 px-4 py-3 text-sm outline-none focus:border-[var(--purple)] sm:col-span-1"/>
            <input type="text" placeholder="Phone number *" className="rounded-md border border-[var(--purple)]/15 px-4 py-3 text-sm outline-none focus:border-[var(--purple)] sm:col-span-1"/>
            <input type="email" placeholder="Company email *" className="rounded-md border border-[var(--purple)]/15 px-4 py-3 text-sm outline-none focus:border-[var(--purple)] sm:col-span-2"/>
            <select className="rounded-md border border-[var(--purple)]/15 px-4 py-3 text-sm outline-none focus:border-[var(--purple)] sm:col-span-2 text-[#8a7a9c]">
              <option>What would you like to use points for?</option>
            </select>
            <textarea placeholder="Briefly describe what you need" rows={3} className="rounded-md border border-[var(--purple)]/15 px-4 py-3 text-sm outline-none focus:border-[var(--purple)] sm:col-span-2"></textarea>
          </div>
          <label className="flex items-start gap-2 mt-4 text-[11px] text-[#8a7a9c] leading-relaxed">
            <input type="checkbox" className="mt-0.5"/>
            I agree to be contacted by OctaP. This is a demo form for a capstone project — no data is actually submitted.
          </label>
          <button className="btn-pill btn-primary text-sm w-full mt-5 py-3.5">Submit</button>
        </div>
      </div>
    </div>
  </section>

    </>
  );
}
