import { useEffect, useRef, useState } from 'react';
import Modal from '../../components/Modal';
import {
  earnPoints,
  readCredits,
  type CreditsSnapshot,
  type EarnResult,
} from '../../services/credits.service';

export default function IssuePoints({ onClose }: { onClose: () => void }) {
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('100');
  const [receipt, setReceipt] = useState('');
  const [attempt, setAttempt] = useState<{
    member: string;
    amount: number;
    receipt: string;
    key: string;
  } | null>(null);
  const [result, setResult] = useState<EarnResult | null>(null);
  const [snapshot, setSnapshot] = useState<CreditsSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [watch, setWatch] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    if (!watch || !result || !attempt) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let remaining = 20;
    async function poll() {
      try {
        const data = await readCredits(attempt!.member);
        if (!active) return;
        setSnapshot(data);
        const transaction = data.transactions.find((tx) => tx.id === result!.transactionId);
        if (transaction && transaction.status !== 'PENDING') {
          setWatch(false);
          return;
        }
        if (--remaining > 0) timer = setTimeout(() => void poll(), 3000);
        else setWatch(false);
      } catch (reason) {
        if (active) {
          setError(reason instanceof Error ? reason.message : 'Could not refresh status.');
          setWatch(false);
        }
      }
    }
    void poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [watch, result, attempt]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current || result) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    const command = attempt ?? {
      member: memberId.trim(),
      amount: Number(amount),
      receipt: receipt.trim(),
      key: `web-demo-${crypto.randomUUID()}`,
    };
    setAttempt(command);
    try {
      setResult(await earnPoints(command.member, command.amount, command.key, command.receipt));
      setWatch(true);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not submit earn. Retry this request.',
      );
    } finally {
      setBusy(false);
      submitting.current = false;
    }
  }

  const transaction = snapshot?.transactions.find((tx) => tx.id === result?.transactionId);
  const status = transaction?.status ?? result?.status;
  return (
    <Modal label="Issue demo points" onClose={onClose}>
      <section className="theme-light bg-surface text-ink rounded-box p-6 w-full max-w-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-purple text-xs font-bold uppercase tracking-widest">
              OctaP Demo · Sui testnet
            </p>
            <h2 className="font-head text-2xl font-bold mt-2">Issue points</h2>
          </div>
          <button type="button" aria-label="Close" className="text-muted p-2" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="text-muted text-sm mt-3">
          Use the member ID from the customer rewards website. This sends a real testnet earn for
          the demo store.
        </p>
        <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold">
            Member ID
            <input
              required
              disabled={!!attempt}
              value={memberId}
              onChange={(event) => setMemberId(event.target.value)}
              className="mt-2 w-full rounded-field border border-line p-3 bg-ground"
              placeholder="Paste the member UUID"
              pattern="[0-9a-fA-F-]{36}"
            />
          </label>
          <label className="block text-sm font-semibold">
            Points requested
            <input
              required
              disabled={!!attempt}
              type="number"
              min="1"
              max="1000000"
              step="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-2 w-full rounded-field border border-line p-3 bg-ground"
            />
          </label>
          <label className="block text-sm font-semibold">
            Receipt reference (optional)
            <input
              disabled={!!attempt}
              maxLength={100}
              value={receipt}
              onChange={(event) => setReceipt(event.target.value)}
              className="mt-2 w-full rounded-field border border-line p-3 bg-ground"
            />
          </label>
          {!result && (
            <button
              disabled={busy}
              className="bg-purple text-white rounded-field px-5 py-3 font-semibold w-full"
            >
              {busy ? 'Submitting…' : attempt ? 'Retry same request' : 'Issue points'}
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
                Status: {status}
                {watch ? ' · Checking chain confirmation…' : ''}
              </p>
              <p className="text-muted break-all">Transaction: {result.transactionId}</p>
            </>
          )}
          {snapshot && (
            <p>
              Confirmed balance: <strong>{snapshot.balance.confirmedBalance}</strong> · Pending
              earn: {snapshot.balance.pendingEarn}
            </p>
          )}
          {transaction?.blockchainDigest && (
            <p className="font-mono break-all">Sui digest: {transaction.blockchainDigest}</p>
          )}
          {status === 'PENDING' && (
            <p className="text-muted">
              Waiting for the worker. Acceptance is not chain confirmation.
            </p>
          )}
          {status === 'FAILED' && (
            <p className="text-err">
              The earn failed. Inspect the worker logs before starting another request.
            </p>
          )}
        </div>
        {result && !watch && (
          <button
            type="button"
            className="mt-4 text-purple font-semibold text-sm"
            onClick={() => {
              setError('');
              setWatch(true);
            }}
          >
            Refresh status
          </button>
        )}
        {(result || attempt) && !busy && (
          <button
            type="button"
            className="block mt-4 text-muted text-sm"
            onClick={() => {
              setWatch(false);
              setAttempt(null);
              setResult(null);
              setSnapshot(null);
              setError('');
            }}
          >
            Start another request
          </button>
        )}
      </section>
    </Modal>
  );
}
