'use client';

import { useEffect, useRef, useState } from 'react';

interface Rewards {
  vouchers: { id: string; title: string; pointsCost: number; status: string }[];
  owned: { id: string; voucherId: string; serialCode: string; status: string }[];
}

async function rewardsRequest(body: object) {
  const response = await fetch('/api/customer/rewards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(35_000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Could not load rewards.');
  return data;
}

export default function CustomerRewards({ onClaim }: { onClaim: () => void }) {
  const [data, setData] = useState<Rewards | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  useEffect(() => {
    let active = true;
    void rewardsRequest({ action: 'read' })
      .then((result) => {
        if (active) setData(result);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load rewards.');
      });
    return () => {
      active = false;
    };
  }, []);

  async function run(voucherId?: string) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      if (voucherId) {
        await rewardsRequest({ action: 'claim', voucherId });
        onClaim();
      }
      setData(await rewardsRequest({ action: 'read' }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not complete the request.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-line p-5 space-y-4" aria-label="Your rewards">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Store rewards</h3>
        <button
          disabled={busy}
          className="text-partner text-sm font-semibold"
          onClick={() => void run()}
        >
          Refresh
        </button>
      </div>
      <p className="text-muted text-xs">
        Claiming spends your store points. Show the voucher serial at checkout to use your reward.
      </p>
      <div aria-live="polite">
        {error && (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        )}
        {busy && <p className="text-muted text-sm">Updating rewards…</p>}
      </div>
      {!data && !error && <p className="text-muted text-sm">Loading rewards…</p>}
      {data &&
        data.vouchers
          .filter(
            (voucher) =>
              voucher.status === 'ACTIVE' ||
              data.owned.some((item) => item.voucherId === voucher.id),
          )
          .map((voucher) => {
            const owned = data.owned.find((item) => item.voucherId === voucher.id);
            return (
              <div key={voucher.id} className="border-t border-line pt-4 space-y-2">
                <p className="font-semibold text-sm">{voucher.title}</p>
                <p className="text-muted text-xs">{voucher.pointsCost} points</p>
                {owned ? (
                  <>
                    <p className="text-sm">{owned.status}</p>
                    <p className="font-mono break-all text-sm select-all">{owned.serialCode}</p>
                  </>
                ) : (
                  <button
                    disabled={busy}
                    className="rounded-full bg-partner text-white px-4 py-2 text-sm font-semibold"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Spend ${voucher.pointsCost} points to claim ${voucher.title}?`,
                        )
                      )
                        void run(voucher.id);
                    }}
                  >
                    Claim for {voucher.pointsCost} points
                  </button>
                )}
              </div>
            );
          })}
      {data?.vouchers.length === 0 && (
        <p className="text-muted text-sm">No store rewards are available yet.</p>
      )}
    </section>
  );
}
