'use client';

import { useEffect, useRef, useState } from 'react';
import {
  claimCustomerReward,
  rewardsRequest,
  redeemCustomerVoucher,
} from '../services/customer-rewards';

interface Rewards {
  vouchers: { id: string; title: string; pointsCost: number; status: string }[];
  owned: { id: string; voucherId: string; serialCode: string; status: string }[];
}

export default function CustomerRewards({
  onClaim,
  memberId,
  signClaim,
}: {
  onClaim: () => void;
  memberId: string;
  signClaim: (bytes: string, digest: string) => Promise<string>;
}) {
  const [data, setData] = useState<Rewards | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  useEffect(() => {
    let active = true;
    void rewardsRequest<Rewards>({ action: 'read' })
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

  async function run(voucherId?: string, pointsCost?: number, useOwnershipId?: string) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      if (useOwnershipId) {
        await redeemCustomerVoucher(useOwnershipId, signClaim);
      } else if (voucherId) {
        await claimCustomerReward(voucherId, memberId, pointsCost ?? 0, signClaim);
      }
      onClaim();
      setData(await rewardsRequest<Rewards>({ action: 'read' }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not complete the request.');
      // A network error can follow a committed reserve or chain submission. Read; never re-claim automatically.
      try {
        setData(await rewardsRequest<Rewards>({ action: 'read' }));
      } catch {
        /* Keep the last known state. */
      }
      onClaim();
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
        Confirming a claim authorizes spending your store points. Your voucher is ready to use after
        confirmation.
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
            const owned = data.owned.find(
              (item) => item.voucherId === voucher.id && item.status !== 'CANCELLED',
            );
            return (
              <div key={voucher.id} className="border-t border-line pt-4 space-y-2">
                <p className="font-semibold text-sm">{voucher.title}</p>
                <p className="text-muted text-xs">{voucher.pointsCost} points</p>
                {owned ? (
                  <>
                    <p className="text-sm">
                      {owned.status === 'RESERVED' ? 'Awaiting confirmation' : owned.status}
                    </p>
                    {owned.status === 'AVAILABLE' && (
                      <>
                        <p className="font-mono break-all text-sm select-all">{owned.serialCode}</p>
                        <button
                          disabled={busy}
                          className="rounded-full bg-partner text-white px-4 py-2 text-sm font-semibold"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Use ${voucher.title} on this order? It can't be used again.`,
                              )
                            )
                              void run(undefined, undefined, owned.id);
                          }}
                        >
                          Use at checkout
                        </button>
                      </>
                    )}
                    {owned.status === 'RESERVED' && voucher.pointsCost === 0 && (
                      <p className="text-muted text-xs">
                        Your free voucher is being recorded. Refresh in a moment.
                      </p>
                    )}
                    {owned.status === 'RESERVED' && voucher.pointsCost > 0 && (
                      <>
                        <p className="text-muted text-xs">
                          These points are reserved. Refresh to check confirmation, or continue to
                          authorize this same claim.
                        </p>
                        <button
                          disabled={busy}
                          className="text-partner text-sm font-semibold"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Authorize the pending ${voucher.pointsCost}-point claim for ${voucher.title}?`,
                              )
                            )
                              void run(voucher.id, voucher.pointsCost);
                          }}
                        >
                          Continue claim
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <button
                    disabled={busy}
                    className="rounded-full bg-partner text-white px-4 py-2 text-sm font-semibold"
                    onClick={() => {
                      if (
                        window.confirm(
                          voucher.pointsCost > 0
                            ? `Spend ${voucher.pointsCost} points to claim ${voucher.title}?`
                            : `Claim ${voucher.title} for free?`,
                        )
                      )
                        void run(voucher.id, voucher.pointsCost);
                    }}
                  >
                    {voucher.pointsCost > 0
                      ? `Claim for ${voucher.pointsCost} points`
                      : 'Claim for free'}
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
