import Modal from '../../components/Modal';

import type { Tx } from './transactions';

const TONE = {
  Earn: { bg: 'rgba(43,175,102,0.12)', fg: 'var(--green)' },
  Redeem: { bg: 'rgba(255,92,122,0.12)', fg: 'var(--coral)' },
  Adjust: { bg: 'rgba(236,170,11,0.14)', fg: '#8A5A00' },
} as const;

export default function TransactionDrawer({ tx, onClose }: { tx: Tx; onClose: () => void }) {
  const tone = TONE[tx.type];

  return (
    <Modal label="Transaction detail" onClose={onClose} drawer>
      <aside
        className="h-full flex flex-col bg-surface drawer-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-5"
          style={{ borderBottom: '1px solid var(--line)' }}
        >
          <span className="text-ink font-head text-lg font-bold">Transaction detail</span>
          <button
            onClick={onClose}
            className="bg-tint size-8 rounded-full flex items-center justify-center"
            aria-label="Close"
          >
            <i className="text-ink-2 ri-close-line"></i>
          </button>
        </div>
        <div className="p-5 flex-1 overflow-y-auto">
          <div className="flex items-center gap-3">
            <span className="status-pill" style={{ background: tone.bg, color: tone.fg }}>
              {tx.type}
            </span>
            <span
              className="font-mono text-2xl font-extrabold tabular-nums"
              style={{ color: tone.fg }}
            >
              {tx.amount} Petals
            </span>
          </div>
          <div className="mt-5">
            <div className="drawer-row">
              <span className="text-ink-2 text-sm font-semibold">Member</span>
              <span className="text-ink text-sm font-bold">{tx.member}</span>
            </div>
            <div className="drawer-row">
              <span className="text-ink-2 text-sm font-semibold">Channel</span>
              <span className="text-ink text-sm font-bold font-mono">{tx.channel}</span>
            </div>
            <div className="drawer-row">
              <span className="text-ink-2 text-sm font-semibold">Time</span>
              <span className="text-ink text-sm font-bold">{tx.time}</span>
            </div>
            <div className="drawer-row">
              <span className="text-ink-2 text-sm font-semibold">Status</span>
              <span
                className="status-pill"
                style={{ background: 'rgba(43,175,102,0.12)', color: 'var(--green)' }}
              >
                Confirmed
              </span>
            </div>
          </div>
          <div className="bg-tint mt-5 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-ink-2 text-xs font-bold uppercase tracking-wide">
                Sui ledger record
              </span>
              <a href="#" className="text-purple text-xs font-bold flex items-center gap-1">
                Verify on-chain<i className="ri-external-link-line"></i>
              </a>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-ink font-mono text-xs truncate flex-1">{tx.digest}</span>
              <button
                className="copy-btn"
                aria-label="Copy transaction digest"
                title="Copy digest"
                onClick={() => navigator.clipboard?.writeText(tx.digest)}
              >
                <i className="ri-file-copy-line text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </Modal>
  );
}
