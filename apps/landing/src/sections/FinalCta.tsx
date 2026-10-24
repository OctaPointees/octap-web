import { BUSINESS_URL } from '../config';

export default function FinalCta() {
  return (
    <>
  <section className="py-16">
    <div className="max-w-[1000px] mx-auto px-8 text-center rounded-[10px] py-16 px-10 relative overflow-hidden grad-brand text-white shadow-float">
      <h2 className="relative font-head text-3xl font-extrabold mb-4">Start building your own loyalty program</h2>
      <p className="relative text-white/85 max-w-lg mx-auto mb-8">Run points and vouchers for your own shops, backed by a record your customers can verify.</p>
      <a href={BUSINESS_URL} className="relative btn-pill text-sm font-bold px-7 py-3.5" style={{"background": "#fff", "color": "var(--purple)"}}>Get started</a>
    </div>
  </section>

    </>
  );
}
