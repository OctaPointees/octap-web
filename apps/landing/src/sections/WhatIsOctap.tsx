export default function WhatIsOctap() {
  return (
    <>
  <section className="max-w-[1280px] mx-auto px-8 py-24">
    <div className="grid md:grid-cols-3 gap-6">
      <div className="card-tint rounded-[8px] p-8">
        <div className="size-12 rounded-md grad-brand flex items-center justify-center text-white mb-5"><i className="ri-store-2-line text-xl"></i></div>
        <h3 className="font-head text-lg font-bold mb-2">Isolated per merchant</h3>
        <p className="text-sm text-[#6b5a7d] leading-relaxed">Every business runs its own points and vouchers. Lotus Mart's Petals never mix with another merchant's program.</p>
      </div>
      <div className="card-tint rounded-[8px] p-8">
        <div className="size-12 rounded-md grad-brand flex items-center justify-center text-white mb-5"><i className="ri-shield-check-line text-xl"></i></div>
        <h3 className="font-head text-lg font-bold mb-2">Verifiable on Sui</h3>
        <p className="text-sm text-[#6b5a7d] leading-relaxed">Each point earned or redeemed is recorded on Sui's ledger, so customers and partners can check the record itself.</p>
      </div>
      <div className="card-tint rounded-[8px] p-8">
        <div className="size-12 rounded-md grad-brand flex items-center justify-center text-white mb-5"><i className="ri-wallet-3-line text-xl"></i></div>
        <h3 className="font-head text-lg font-bold mb-2">No wallet needed</h3>
        <p className="text-sm text-[#6b5a7d] leading-relaxed">Customers sign in with Google, email, or phone. Enoki zkLogin and sponsored transactions keep the blockchain out of sight.</p>
      </div>
    </div>
  </section>

    </>
  );
}
