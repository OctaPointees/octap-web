import { notFound } from 'next/navigation';
import MerchantDemo from '../../components/MerchantDemo';

/** Local merchant demo only: it plays the store's own system, which holds the API key server-side. */
export default function MerchantPage() {
  if (process.env.NODE_ENV !== 'development' || process.env.ENABLE_MERCHANT_DEMO !== 'true')
    notFound();
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 space-y-8">
      <header>
        <p className="text-sm text-partner uppercase tracking-widest">Merchant demo</p>
        <h1 className="font-head text-4xl mt-3">Issue points and check vouchers</h1>
        <p className="text-muted mt-4">
          This page plays the store&apos;s own system. Points are issued here, and the customer uses
          a voucher from their own device, because only their signature can mark it used.
        </p>
      </header>
      <MerchantDemo />
    </main>
  );
}
