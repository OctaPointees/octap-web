import { useState } from 'react';
import ApiKeysModal from './ApiKeysModal';

export default function ApiKeys() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        className="sticky top-0 flex flex-col"
        style={{
          zIndex: '40',
          background: 'rgba(11,6,18,0.94)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid var(--card-border)',
          borderRadius: '20px',
        }}
      >
        <div className="flex items-center gap-3 px-4 py-2.5">
          <div
            className="flex items-center gap-2 px-3.5 py-2 flex-1 max-w-md rounded-full"
            style={{ border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.04)' }}
          >
            <i className="text-text-faint ti ti-search text-sm"></i>
            <span className="text-text-faint text-sm flex-1">
              Search keys, requests, endpoints…
            </span>
            <span
              className="font-mono text-xs font-bold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-faint)' }}
            >
              ⌘K
            </span>
          </div>
          <div className="flex-1"></div>
          <div
            className="flex items-center gap-1"
            style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '999px', padding: '3px' }}
          >
            <span className="env-seg-opt live">
              <span className="bg-cyan env-dot"></span>Live
            </span>
            <span className="env-seg-opt test active">
              <span className="bg-warning env-dot"></span>Test
            </span>
          </div>
          <button
            className="size-9 rounded-full flex items-center justify-center relative"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            aria-label="Notifications"
            title="Notifications"
          >
            <i className="text-text-faint ti ti-bell text-sm"></i>
            <span className="bg-pink absolute top-1.5 right-2 size-1.5 rounded-full"></span>
          </button>
        </div>
        <div className="bg-card-border h-px"></div>
        <div className="text-warning flex items-center gap-2 text-xs font-bold px-4 py-2.5">
          <i className="ti ti-flask"></i>Test mode — no real Petals or VND move here.
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap mt-1">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div
              className="size-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,95,196,0.12)' }}
            >
              <i className="text-pink ti ti-terminal-2 text-lg"></i>
            </div>
            <h1 className="text-ink font-sans text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
              Developer
              <span
                className="font-mono text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg"
                style={{
                  background: 'rgba(255,95,196,0.14)',
                  color: '#FF6FA5',
                  border: '1px solid rgba(255,95,196,0.3)',
                }}
              >
                keys
              </span>
            </h1>
          </div>
          <p className="text-text-muted text-sm mt-1.5 max-w-lg">
            Create and manage API keys used to authenticate your integration.
          </p>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-ink text-sm font-bold">API keys</span>
            <span className="text-text-faint text-xs ml-2">Showing Test environment</span>
          </div>
          <button className="btn-primary-dark text-xs" onClick={() => setOpen(true)}>
            <i className="ti ti-plus"></i>Create API key
          </button>
        </div>
        <div className="text-text-faint grid grid-cols-[1.4fr_1.5fr_0.8fr_1.8fr_0.9fr_0.9fr_0.8fr_0.9fr] gap-2 text-xs font-bold uppercase tracking-wide px-1 mt-4">
          <span>Name</span>
          <span>Key</span>
          <span>Environment</span>
          <span>Scopes</span>
          <span>Created</span>
          <span>Last used</span>
          <span>Status</span>
          <span></span>
        </div>
        <div className="flex flex-col mt-2" style={{ borderTop: '1px solid var(--card-border)' }}>
          <div
            className="grid grid-cols-[1.4fr_1.5fr_0.8fr_1.8fr_0.9fr_0.9fr_0.8fr_0.9fr] gap-2 items-center py-3.5"
            style={{ borderBottom: '1px solid var(--card-border)' }}
          >
            <span className="text-ink text-sm font-bold">Staging key</span>
            <span className="text-text-faint font-mono text-xs flex items-center gap-1.5">
              octap_test_sk_••••a9f2
              <button className="copy-btn" aria-label="Copy key" title="Copy key">
                <i className="ti ti-copy text-xs"></i>
              </button>
            </span>
            <span>
              <span className="status-pill warning">
                <span className="dot" style={{ background: 'currentColor' }}></span>Test
              </span>
            </span>
            <span className="flex gap-1 flex-wrap">
              <span className="scope-chip font-mono">points:earn</span>
              <span className="scope-chip font-mono">points:redeem</span>
            </span>
            <span className="text-text-faint text-xs font-mono">Oct 1, 2026</span>
            <span className="text-text-faint text-xs font-mono">2m ago</span>
            <span>
              <span className="status-pill success">
                <span className="dot" style={{ background: 'currentColor' }}></span>Active
              </span>
            </span>
            <span className="flex items-center gap-2.5 justify-end">
              <button className="shrink-0" aria-label="Rotate key" title="Rotate key">
                <i className="text-text-faint ti ti-refresh text-sm"></i>
              </button>
              <button className="shrink-0" aria-label="Edit scopes" title="Edit scopes">
                <i className="text-text-faint ti ti-pencil text-sm"></i>
              </button>
              <button
                className="text-danger text-xs font-bold shrink-0"
                data-action="open-revoke-confirm"
                aria-label="Revoke Staging key"
                title="Revoke Staging key"
              >
                Revoke
              </button>
            </span>
          </div>
        </div>
      </div>

      {open && <ApiKeysModal onClose={() => setOpen(false)} />}
    </>
  );
}
