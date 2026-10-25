import Modal from '../../components/Modal';
import { useState } from 'react';

export default function ApiKeysModal({ onClose }: { onClose: () => void }) {
  const [stored, setStored] = useState(false);
  return (
    <>
      <Modal label="Create API key" onClose={onClose}>
        <div className="card w-full relative" style={{ maxWidth: '480px' }}>
          <div
            className="flex items-center justify-between p-5"
            style={{ borderBottom: '1px solid var(--card-border)' }}
          >
            <span className="text-ink text-sm font-bold">Create API key</span>
            <button
              onClick={onClose}
              aria-label="Close"
              title="Close"
              className="size-7 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <i className="text-text-faint ti ti-x text-sm"></i>
            </button>
          </div>
          <div className="p-5">
            <label
              htmlFor="api-key-name"
              className="text-text-faint text-xs font-semibold block mb-1.5"
            >
              Key name
            </label>
            <input
              id="api-key-name"
              aria-label="Key name"
              placeholder="e.g. Checkout service"
              className="text-ink card2 w-full px-3.5 py-2.5 text-sm"
            />

            <label className="text-text-faint text-xs font-semibold block mt-4 mb-2">
              Environment
            </label>
            <div
              className="flex items-center gap-1"
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '999px',
                padding: '3px',
                width: 'fit-content',
              }}
            >
              <span className="env-seg-opt live">Live</span>
              <span className="env-seg-opt test active">
                <span className="bg-warning env-dot"></span>Test
              </span>
            </div>

            <label className="text-text-faint text-xs font-semibold block mt-4 mb-2">Scopes</label>
            <div className="flex flex-col gap-2">
              <label className="text-ink flex items-center gap-2.5 text-sm">
                <span
                  className="size-4 rounded flex items-center justify-center"
                  style={{ background: 'var(--pink)', border: '1px solid var(--card-border)' }}
                >
                  <i className="ti ti-check text-xs text-white"></i>
                </span>
                <span className="font-mono text-xs">points:earn</span>
              </label>
              <label className="text-ink flex items-center gap-2.5 text-sm">
                <span
                  className="size-4 rounded flex items-center justify-center"
                  style={{ background: 'var(--pink)', border: '1px solid var(--card-border)' }}
                >
                  <i className="ti ti-check text-xs text-white"></i>
                </span>
                <span className="font-mono text-xs">points:redeem</span>
              </label>
              <label className="text-ink flex items-center gap-2.5 text-sm">
                <span
                  className="size-4 rounded flex items-center justify-center"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--card-border)',
                  }}
                ></span>
                <span className="font-mono text-xs">balances:read</span>
              </label>
              <label className="text-ink flex items-center gap-2.5 text-sm">
                <span
                  className="size-4 rounded flex items-center justify-center"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--card-border)',
                  }}
                ></span>
                <span className="font-mono text-xs">members:read</span>
              </label>
              <label className="text-ink flex items-center gap-2.5 text-sm">
                <span
                  className="size-4 rounded flex items-center justify-center"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--card-border)',
                  }}
                ></span>
                <span className="font-mono text-xs">campaigns:read</span>
              </label>
            </div>

            <div className="secret-box p-4 mt-5">
              <div className="text-warning flex items-center gap-2 text-xs font-bold">
                <i className="ti ti-alert-triangle"></i>Save this secret now — you won't be able to
                see it again
              </div>
              <div className="card2 flex items-center gap-2 px-3.5 py-3 mt-3">
                <span className="text-ink font-mono text-xs flex-1 truncate">
                  octap_test_sk_a9f23d8e7c61b204f5a8e9d0c3b7f1e2
                </span>
                <button
                  onClick={() =>
                    navigator.clipboard?.writeText('octap_test_sk_a9f23d8e7c61b204f5a8e9d0c3b7f1e2')
                  }
                  className="copy-btn"
                  aria-label="Copy demo secret"
                  title="Copy demo secret"
                >
                  <i className="ti ti-copy text-xs"></i>
                </button>
              </div>
              <label className="text-ink flex items-center gap-2.5 text-xs font-semibold mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stored}
                  onChange={(event) => setStored(event.target.checked)}
                  className="size-4 accent-pink"
                />
                I've stored this secret
              </label>
            </div>
          </div>
          <div
            className="flex items-center justify-end gap-3 p-5"
            style={{ borderTop: '1px solid var(--card-border)' }}
          >
            <button onClick={onClose} className="btn-secondary-dark text-xs">
              Cancel
            </button>
            <button
              onClick={onClose}
              disabled={!stored}
              className="btn-secondary-dark text-xs"
              style={stored ? undefined : { opacity: 0.5, cursor: 'not-allowed' }}
              title="Check the box to close"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
