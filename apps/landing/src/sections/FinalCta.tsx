export default function FinalCta() {
  return (
    <section className="py-20">
      <div className="max-w-[1000px] mx-auto px-8 text-center rounded-3xl py-16 px-10 relative overflow-hidden glass glow-pink" data-reveal-pop>
        <div className="absolute -right-10 -top-10 size-40 rounded-full blur-2xl opacity-50" style={{ background: '#ff5fc4' }} />
        <div className="absolute -left-14 -bottom-14 size-44 rounded-full blur-2xl opacity-40" style={{ background: '#38dbe0' }} />
        <h2 className="relative text-3xl font-extrabold text-white mb-4">Start building your own loyalty program</h2>
        <p className="relative text-[#c8bcdb] max-w-lg mx-auto mb-8">
          Run points and vouchers for your own shops, backed by a record your customers can verify.
        </p>
        <a
          href="#"
          className="relative inline-block rounded-full text-[#07040f] text-sm font-bold px-7 py-3.5"
          data-magnetic
          style={{ background: '#ff5fc4' }}
        >
          Get started
        </a>
      </div>
    </section>
  );
}
