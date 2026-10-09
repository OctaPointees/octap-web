const NOTES = [
  "Points stay inside one merchant. There's no cross-merchant exchange and no transferring points to another person.",
  "Points are promotional credit, not money — they can't be cashed out to fiat currency.",
  'The end-user apps shown here are reference apps that demonstrate the SDK, not a live consumer marketplace.',
  'Confirming a transaction on the blockchain and sponsoring its gas fee adds a little more time than a purely centralized system.',
];

export default function GoodToKnow() {
  return (
    <section className="py-24">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="rounded-3xl p-10 glass" style={{ borderColor: 'rgba(56,219,224,0.3)' }} data-reveal-pop>
          <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-2 text-[#38dbe0]" data-reveal>
            <i className="ti ti-info-circle" />
            Good to know
          </h2>
          <div className="grid md:grid-cols-2 gap-x-10 gap-y-5 text-sm text-[#c8bcdb] leading-relaxed">
            {NOTES.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
