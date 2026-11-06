'use client';

import { useRef, useState } from 'react';
import { transactionPointsLabel } from '../lib/transaction-points';

interface Balance {
  confirmedBalance: number;
  pendingEarn: number;
  stale: boolean;
}
interface Transaction {
  id: string;
  transactionType: string;
  pointsAmount: number | null;
  estimatedPoints?: number | null;
  status: string;
  createdAt: string;
}
interface Voucher {
  id: string;
  serialCode: string;
  status: string;
  voucher?: { title: string };
}

async function demo<T>(body: object): Promise<T> {
  const response = await fetch('/api/demo/credits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25_000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Core rejected this request.');
  return data as T;
}

export default function MerchantDemo() {
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('100000');
  const [balance, setBalance] = useState<Balance | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  // Kept until Core accepts the purchase, so a retry after an unknown outcome never earns twice.
  const pendingKey = useRef<{ key: string; memberId: string; amount: number } | null>(null);

  async function refresh(member = memberId) {
    const [read, owned] = await Promise.all([
      demo<{ balance: Balance; transactions: Transaction[] }>({
        action: 'read',
        organizationEndUserId: member,
      }),
      demo<Voucher[]>({ action: 'vouchers', organizationEndUserId: member }),
    ]);
    setBalance(read.balance);
    setHistory(read.transactions);
    setVouchers(owned);
    return read.balance;
  }

  async function run(work: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      await work();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function issue() {
    const purchaseAmount = Number(amount);
    const current = pendingKey.current;
    const key =
      current && current.memberId === memberId && current.amount === purchaseAmount
        ? current.key
        : `merchant-demo-${crypto.randomUUID()}`;
    pendingKey.current = { key, memberId, amount: purchaseAmount };
    await demo({
      action: 'earn',
      organizationEndUserId: memberId,
      purchaseAmount,
      idempotencyKey: key,
    });
    pendingKey.current = null;
    setMessage('Purchase accepted. Waiting for the chain to confirm the points…');
    for (let attempt = 0; attempt < 20; attempt++) {
      const latest = await refresh();
      if (latest.pendingEarn === 0) {
        setMessage('Points confirmed on-chain.');
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    setMessage('Still waiting for the chain. Refresh later; do not issue the purchase again.');
  }

  const validMember = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(memberId);
  return (
    <section className="rounded-3xl border border-line bg-surface p-7 space-y-6">
      <label className="block space-y-2">
        <span className="text-sm font-semibold">Member ID</span>
        <input
          id="member-id"
          className="w-full rounded-xl border border-line px-4 py-3 font-mono text-sm"
          value={memberId}
          onChange={(event) => setMemberId(event.target.value.trim())}
          placeholder="Copied from the customer's rewards page"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-semibold">Purchase amount</span>
        <input
          id="purchase-amount"
          className="w-full rounded-xl border border-line px-4 py-3"
          inputMode="numeric"
          value={amount}
          onChange={(event) => setAmount(event.target.value.replace(/\D/g, ''))}
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-full bg-partner text-white px-5 py-3 font-semibold"
          disabled={busy || !validMember || !Number(amount)}
          onClick={() => void run(issue)}
        >
          Issue points
        </button>
        <button
          className="rounded-full border border-ink px-5 py-3 font-semibold"
          disabled={busy || !validMember}
          onClick={() => void run(async () => void (await refresh()))}
        >
          Refresh
        </button>
      </div>
      <p aria-live="polite" className="text-sm text-muted break-words">
        {message}
      </p>
      {balance && (
        <div className="space-y-4">
          <p className="font-semibold">
            {balance.confirmedBalance} confirmed points
            {balance.pendingEarn > 0 && (
              <span className="text-muted font-normal"> · {balance.pendingEarn} pending</span>
            )}
          </p>
          <div>
            <h2 className="font-semibold text-sm">Vouchers</h2>
            {vouchers.length === 0 && <p className="text-muted text-sm">None yet.</p>}
            <ul className="text-sm space-y-1 mt-2">
              {vouchers.map((item) => (
                <li key={item.id}>
                  {item.voucher?.title ?? 'Voucher'} ·{' '}
                  <span className="font-mono">{item.serialCode}</span> · {item.status}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-semibold text-sm">Recent activity</h2>
            <ul className="text-sm space-y-1 mt-2">
              {history.slice(0, 10).map((tx) => (
                <li key={tx.id}>
                  {tx.transactionType}{' '}
                  {transactionPointsLabel({
                    points: tx.pointsAmount,
                    estimatedPoints: tx.estimatedPoints,
                  })}{' '}
                  · {tx.status}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
