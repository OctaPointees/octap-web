'use client';

import { useEffect, useState } from 'react';
import { transactionPointsLabel } from '../lib/transaction-points';

interface Points {
  confirmedBalance: number;
  pendingEarn: number;
  pendingRedemption: number;
  stale: boolean;
  observedAt: string;
  transactions: {
    id: string;
    type: string;
    points: number | null;
    estimatedPoints?: number | null;
    status: string;
    createdAt: string;
    digest?: string;
  }[];
}

export default function CustomerPoints() {
  const [points, setPoints] = useState<Points | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/customer/balance', { method: 'POST', signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setPoints(data);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(reason instanceof Error ? reason.message : 'Could not load your points.');
      });
    return () => controller.abort();
  }, []);

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/customer/balance', {
        method: 'POST',
        signal: AbortSignal.timeout(20_000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setPoints(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not refresh points.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-line p-5 space-y-4" aria-label="Your points">
      <div className="flex justify-between items-center gap-3">
        <h3 className="font-semibold">Your coffee points</h3>
        <button
          disabled={loading}
          className="text-partner text-sm font-semibold"
          onClick={() => void refresh()}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      <div aria-live="polite">
        {error && (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        )}
        {!points && !error && <p className="text-muted text-sm">Loading your points…</p>}
        {points && (
          <>
            <p className="text-4xl font-head">
              {points.confirmedBalance.toLocaleString()}{' '}
              <span className="text-sm text-muted font-sans">confirmed</span>
            </p>
            <p className="text-muted text-xs mt-2">
              Pending earn: {points.pendingEarn} · Reserved: {points.pendingRedemption}
            </p>
            {points.stale && (
              <p className="text-muted text-xs mt-2">
                A transaction is still pending. Refresh after confirmation.
              </p>
            )}
            <p className="text-muted text-xs mt-2">
              Updated {new Date(points.observedAt).toLocaleTimeString()}
            </p>
          </>
        )}
      </div>
      {points && (
        <details>
          <summary className="text-sm text-partner cursor-pointer">Recent activity</summary>
          <ul className="mt-3 space-y-3">
            {points.transactions.length === 0 && (
              <li className="text-muted text-sm">No transactions yet.</li>
            )}
            {points.transactions.map((tx) => (
              <li key={tx.id} className="border-t border-line pt-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span>
                    {tx.type} · {transactionPointsLabel(tx)}
                  </span>
                  <span className="text-muted">{tx.status}</span>
                </div>
                <p className="text-muted text-xs mt-1">{new Date(tx.createdAt).toLocaleString()}</p>
                {tx.digest && <p className="font-mono break-all text-xs mt-2">Sui: {tx.digest}</p>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
