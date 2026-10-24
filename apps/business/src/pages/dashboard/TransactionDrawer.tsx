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
    <Modal title="Transaction detail" onClose={onClose}>
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
            <span className="text-sm font-semibold" style={{ color: 'var(--ink-2)' }}>
              Member
            </span>
            <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
              {tx.member}
            </span>
          </div>
          <div className="drawer-row">
            <span className="text-sm font-semibold" style={{ color: 'var(--ink-2)' }}>
              Channel
            </span>
            <span className="text-sm font-bold font-mono" style={{ color: 'var(--ink)' }}>
              {tx.channel}
            </span>
          </div>
          <div className="drawer-row">
            <span className="text-sm font-semibold" style={{ color: 'var(--ink-2)' }}>
              Time
            </span>
            <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
              {tx.time}
            </span>
          </div>
          <div className="drawer-row">
            <span className="text-sm font-semibold" style={{ color: 'var(--ink-2)' }}>
              Status
            </span>
            <span
              className="status-pill"
              style={{ background: 'rgba(43,175,102,0.12)', color: 'var(--green)' }}
            >
              Confirmed
            </span>
          </div>
        </div>
        <div className="mt-5 rounded-2xl p-4" style={{ background: 'var(--tint)' }}>
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: 'var(--ink-2)' }}
            >
              Sui ledger record
            </span>
            <a
              href="#"
              className="text-xs font-bold flex items-center gap-1"
              style={{ color: 'var(--purple)' }}
              aria-disabled="true"
              onClick={(event) => event.preventDefault()}
              title="Not available in this demo"
            >
              Verify on-chain<i className="ri-external-link-line"></i>
            </a>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-mono text-xs truncate flex-1" style={{ color: 'var(--ink)' }}>
              {tx.digest}
            </span>
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
    </Modal>
  );
}
