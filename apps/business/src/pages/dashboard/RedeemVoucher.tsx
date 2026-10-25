import { useRef, useState } from 'react';
import Modal from '../../components/Modal';
import { readCredits, redeemVoucher, type CreditsSnapshot } from '../../services/credits.service';

export default function RedeemVoucher({ onClose }: { onClose: () => void }) {
  const [member, setMember] = useState('');
  const [serial, setSerial] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ status: string; voucherTitle: string } | null>(null);
  const [snapshot, setSnapshot] = useState<CreditsSnapshot | null>(null);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current || result) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      setResult(await redeemVoucher(member.trim(), serial.trim()));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not redeem voucher.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function balance() {
    setError('');
    try {
      setSnapshot(await readCredits(member.trim()));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load balance.');
    }
  }
  return (
    <Modal label="Redeem demo voucher" onClose={onClose}>
      <section className="theme-light bg-surface text-ink rounded-box p-6 w-full max-w-lg">
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="text-purple text-xs font-bold uppercase tracking-widest">
              OctaP Demo · Checkout
            </p>
            <h2 className="text-2xl font-head font-bold mt-2">Redeem voucher</h2>
          </div>
          <button aria-label="Close" className="p-2 text-muted" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="text-muted text-sm mt-3">
          Ask the customer for the member ID and voucher serial shown on their rewards page. Points
          were spent when the voucher was claimed.
        </p>
        <form className="mt-6 space-y-4" onSubmit={(event) => void submit(event)}>
          <label className="block text-sm font-semibold">
            Member ID
            <input
              required
              disabled={!!result || busy}
              value={member}
              onChange={(event) => setMember(event.target.value)}
              className="mt-2 w-full rounded-field border border-line bg-ground p-3"
            />
          </label>
          <label className="block text-sm font-semibold">
            Voucher serial
            <input
              required
              disabled={!!result || busy}
              value={serial}
              onChange={(event) => setSerial(event.target.value)}
              className="mt-2 w-full rounded-field border border-line bg-ground p-3"
            />
          </label>
          {!result && (
            <button
              disabled={busy}
              className="bg-purple text-white px-5 py-3 rounded-field w-full font-semibold"
            >
              {busy ? 'Redeeming…' : 'Redeem voucher'}
            </button>
          )}
        </form>
        <div aria-live="polite" className="mt-5 space-y-3 text-sm">
          {error && (
            <p role="alert" className="text-err">
              {error}
            </p>
          )}
          {result && (
            <>
              <p className="font-semibold">
                {result.voucherTitle} · {result.status}
              </p>
              <button className="text-purple font-semibold" onClick={() => void balance()}>
                Check member balance
              </button>
            </>
          )}
          {snapshot && <p>Confirmed balance: {snapshot.balance.confirmedBalance}</p>}
        </div>
      </section>
    </Modal>
  );
}
