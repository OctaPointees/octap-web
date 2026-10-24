export default function Logs() {
  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap mt-1">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div
              className="size-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,95,196,0.12)' }}
            >
              <i className="ti ti-terminal-2 text-lg" style={{ color: 'var(--pink)' }}></i>
            </div>
            <h1
              className="font-sans text-2xl font-extrabold tracking-tight flex items-center gap-2.5"
              style={{ color: 'var(--ink)' }}
            >
              Developer
              <span
                className="font-mono text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg"
                style={{
                  background: 'rgba(255,95,196,0.14)',
                  color: '#FF6FA5',
                  border: '1px solid rgba(255,95,196,0.3)',
                }}
              >
                logs
              </span>
            </h1>
          </div>
          <p className="text-sm mt-1.5 max-w-lg" style={{ color: 'var(--text-muted)' }}>
            Live stream of API requests hitting your keys, newest first.
          </p>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-full flex-1 max-w-xs"
            style={{ border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.04)' }}
          >
            <i className="ti ti-search text-sm" style={{ color: 'var(--text-faint)' }}></i>
            <span className="text-sm" style={{ color: 'var(--text-faint)' }}>
              Search logs…
            </span>
          </div>
          <span className="filter-chip active">
            <i className="ti ti-circle-check"></i>All status
          </span>
          <span className="filter-chip">Method</span>
          <span className="filter-chip">Endpoint</span>
          <span className="filter-chip">Key</span>
          <span className="filter-chip">
            <i className="ti ti-calendar"></i>Last 1h
          </span>
          <div className="flex-1"></div>
          <span
            className="text-xs font-bold flex items-center gap-1.5"
            style={{ color: 'var(--success)' }}
          >
            <span className="size-1.5 rounded-full" style={{ background: 'var(--success)' }}></span>
            Streaming
          </span>
          <button
            disabled
            data-placeholder="true"
            className="btn-secondary-dark text-xs"
            aria-label="Pause log stream"
            title="Pause log stream"
          >
            <i className="ti ti-player-pause"></i>Pause
          </button>
        </div>

        <div
          className="grid grid-cols-[1fr_1fr_2.4fr_0.8fr_1.6fr_0.8fr] gap-2 text-[11px] font-bold uppercase tracking-wide px-1 mt-4"
          style={{ color: 'var(--text-faint)' }}
        >
          <span>Time</span>
          <span>Method</span>
          <span>Endpoint</span>
          <span>Status</span>
          <span>Key</span>
          <span>Latency</span>
        </div>
        <div className="flex flex-col mt-1">
          <div>
            <div
              className="log-row newest grid grid-cols-[1fr_1fr_2.4fr_0.8fr_1.6fr_0.8fr] gap-2 items-center py-2.5 px-1"
              style={{ cursor: 'pointer' }}
              title="14:02:11 ICT (UTC+7)"
            >
              <span
                className="text-xs font-mono tabular-nums"
                style={{ color: 'var(--text-faint)' }}
              >
                14:02:11
              </span>
              <span className="method-badge post font-mono">POST</span>
              <span className="text-xs font-mono truncate" style={{ color: 'var(--ink)' }}>
                /v1/points/earn
              </span>
              <span
                className="text-xs font-mono font-bold tabular-nums"
                style={{ color: 'var(--success)' }}
              >
                200
              </span>
              <span className="text-xs font-mono truncate" style={{ color: 'var(--text-faint)' }}>
                …a9f2
              </span>
              <span
                className="text-xs font-mono tabular-nums"
                style={{ color: 'var(--text-faint)' }}
              >
                118ms
              </span>
            </div>

            <div className="code-block p-3.5 mt-1 mb-1">
              <div className="flex items-center justify-between mb-2.5">
                <div
                  className="flex items-center gap-1"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '999px',
                    padding: '3px',
                  }}
                >
                  <span className="dtab active" style={{ padding: '4px 10px', fontSize: '11px' }}>
                    Request
                  </span>
                  <span className="dtab" style={{ padding: '4px 10px', fontSize: '11px' }}>
                    Response
                  </span>
                  <span className="dtab" style={{ padding: '4px 10px', fontSize: '11px' }}>
                    Headers
                  </span>
                </div>
                <button
                  className="btn-secondary-dark"
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                  disabled
                  title="Not available in this demo"
                >
                  <i className="ti ti-terminal-2"></i>Copy as cURL
                </button>
              </div>
              <div className="text-[11px] font-mono mb-2" style={{ color: 'var(--text-faint)' }}>
                Request ID: <span style={{ color: 'var(--text-muted)' }}>req_9f21a8c4</span>
              </div>
              <pre className="font-mono">
                {'{'}
                {'\n'} <span className="tok-pl">"memberPhone"</span>:{' '}
                <span className="tok-str">"+84901234567"</span>,{'\n'}{' '}
                <span className="tok-pl">"billAmount"</span>:{' '}
                <span className="tok-num">520000</span>,{'\n'}{' '}
                <span className="tok-pl">"petalsEarned"</span>: <span className="tok-num">52</span>,
                {'\n'} <span className="tok-pl">"idempotencyKey"</span>:{' '}
                <span className="tok-str">"idem_7f2a9c"</span>
                {'\n'}
                {'}'}
              </pre>
            </div>
          </div>
          <div>
            <div
              className="log-row grid grid-cols-[1fr_1fr_2.4fr_0.8fr_1.6fr_0.8fr] gap-2 items-center py-2.5 px-1"
              style={{ cursor: 'pointer' }}
              title="14:01:58 ICT (UTC+7)"
            >
              <span
                className="text-xs font-mono tabular-nums"
                style={{ color: 'var(--text-faint)' }}
              >
                14:01:58
              </span>
              <span className="method-badge get font-mono">GET</span>
              <span className="text-xs font-mono truncate" style={{ color: 'var(--ink)' }}>
                /v1/members/+8490••456
              </span>
              <span
                className="text-xs font-mono font-bold tabular-nums"
                style={{ color: 'var(--success)' }}
              >
                200
              </span>
              <span className="text-xs font-mono truncate" style={{ color: 'var(--text-faint)' }}>
                …a9f2
              </span>
              <span
                className="text-xs font-mono tabular-nums"
                style={{ color: 'var(--text-faint)' }}
              >
                42ms
              </span>
            </div>
          </div>
          <div>
            <div
              className="log-row grid grid-cols-[1fr_1fr_2.4fr_0.8fr_1.6fr_0.8fr] gap-2 items-center py-2.5 px-1"
              style={{ cursor: 'pointer' }}
              title="14:01:40 ICT (UTC+7)"
            >
              <span
                className="text-xs font-mono tabular-nums"
                style={{ color: 'var(--text-faint)' }}
              >
                14:01:40
              </span>
              <span className="method-badge post font-mono">POST</span>
              <span className="text-xs font-mono truncate" style={{ color: 'var(--ink)' }}>
                /v1/points/redeem
              </span>
              <span
                className="text-xs font-mono font-bold tabular-nums"
                style={{ color: 'var(--success)' }}
              >
                200
              </span>
              <span className="text-xs font-mono truncate" style={{ color: 'var(--text-faint)' }}>
                …a9f2
              </span>
              <span
                className="text-xs font-mono tabular-nums"
                style={{ color: 'var(--text-faint)' }}
              >
                96ms
              </span>
            </div>
          </div>
          <div>
            <div
              className="log-row grid grid-cols-[1fr_1fr_2.4fr_0.8fr_1.6fr_0.8fr] gap-2 items-center py-2.5 px-1"
              style={{ cursor: 'pointer' }}
              title="14:01:22 ICT (UTC+7)"
            >
              <span
                className="text-xs font-mono tabular-nums"
                style={{ color: 'var(--text-faint)' }}
              >
                14:01:22
              </span>
              <span className="method-badge delete font-mono">DELETE</span>
              <span className="text-xs font-mono truncate" style={{ color: 'var(--ink)' }}>
                /v1/webhooks/wh_8821
              </span>
              <span
                className="text-xs font-mono font-bold tabular-nums"
                style={{ color: 'var(--success)' }}
              >
                204
              </span>
              <span className="text-xs font-mono truncate" style={{ color: 'var(--text-faint)' }}>
                …a9f2
              </span>
              <span
                className="text-xs font-mono tabular-nums"
                style={{ color: 'var(--text-faint)' }}
              >
                61ms
              </span>
            </div>
          </div>
          <div>
            <div
              className="log-row grid grid-cols-[1fr_1fr_2.4fr_0.8fr_1.6fr_0.8fr] gap-2 items-center py-2.5 px-1"
              style={{ cursor: 'pointer' }}
              title="14:00:59 ICT (UTC+7)"
            >
              <span
                className="text-xs font-mono tabular-nums"
                style={{ color: 'var(--text-faint)' }}
              >
                14:00:59
              </span>
              <span className="method-badge post font-mono">POST</span>
              <span className="text-xs font-mono truncate" style={{ color: 'var(--ink)' }}>
                /v1/points/earn
              </span>
              <span
                className="text-xs font-mono font-bold tabular-nums"
                style={{ color: 'var(--warning)' }}
              >
                422
              </span>
              <span className="text-xs font-mono truncate" style={{ color: 'var(--text-faint)' }}>
                …a9f2
              </span>
              <span
                className="text-xs font-mono tabular-nums"
                style={{ color: 'var(--text-faint)' }}
              >
                31ms
              </span>
            </div>
          </div>
          <div>
            <div
              className="log-row grid grid-cols-[1fr_1fr_2.4fr_0.8fr_1.6fr_0.8fr] gap-2 items-center py-2.5 px-1"
              style={{ cursor: 'pointer' }}
              title="14:00:40 ICT (UTC+7)"
            >
              <span
                className="text-xs font-mono tabular-nums"
                style={{ color: 'var(--text-faint)' }}
              >
                14:00:40
              </span>
              <span className="method-badge get font-mono">GET</span>
              <span className="text-xs font-mono truncate" style={{ color: 'var(--ink)' }}>
                /v1/campaigns
              </span>
              <span
                className="text-xs font-mono font-bold tabular-nums"
                style={{ color: 'var(--success)' }}
              >
                200
              </span>
              <span className="text-xs font-mono truncate" style={{ color: 'var(--text-faint)' }}>
                …a9f2
              </span>
              <span
                className="text-xs font-mono tabular-nums"
                style={{ color: 'var(--text-faint)' }}
              >
                54ms
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
