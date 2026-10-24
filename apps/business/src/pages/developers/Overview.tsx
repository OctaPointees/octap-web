export default function Overview() {
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
                console
              </span>
            </h1>
          </div>
          <p className="text-sm mt-1.5 max-w-lg" style={{ color: 'var(--text-muted)' }}>
            Welcome back, Minh — connect Lotus Mart's loyalty program to your POS, app or AI agent.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="glass p-5 flex flex-col" style={{ gridColumn: 'span 8' }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
              Get integrated in 4 steps
            </span>
            <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-muted)' }}>
              2 of 4 done
            </span>
          </div>
          <div
            className="rounded-full overflow-hidden mt-3"
            style={{ height: '6px', background: 'rgba(255,255,255,0.06)' }}
            role="progressbar"
            aria-valuenow={50}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Integration progress"
          >
            <div
              style={{
                width: '50%',
                height: '100%',
                borderRadius: '999px',
                background: 'linear-gradient(90deg,var(--pink-deep),var(--pink))',
              }}
            ></div>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <span className="step-dot done" style={{ width: '24px', height: '24px' }}>
                <i className="ti ti-check text-sm"></i>
              </span>
              <span className="text-sm font-semibold flex-1" style={{ color: 'var(--ink)' }}>
                Create your first API key
              </span>
              <span className="status-pill success">Done</span>
            </div>
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <span className="step-dot done" style={{ width: '24px', height: '24px' }}>
                <i className="ti ti-check text-sm"></i>
              </span>
              <span className="text-sm font-semibold flex-1" style={{ color: 'var(--ink)' }}>
                Run a sandbox call
              </span>
              <span className="status-pill success">Done</span>
            </div>

            <div
              className="p-4 rounded-2xl mt-1"
              style={{
                border: '1.5px solid rgba(255,95,196,0.4)',
                background: 'rgba(255,95,196,0.05)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="step-dot active" style={{ width: '24px', height: '24px' }}>
                    3
                  </span>
                  <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
                    Register a webhook endpoint
                  </span>
                </div>
                <span
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--pink)' }}
                >
                  Next
                </span>
              </div>
              <p
                className="text-sm mt-2"
                style={{ color: 'var(--text-muted)', marginLeft: '36px' }}
              >
                We'll send points.earned and points.redeemed events to your endpoint in real time.
              </p>
              <button
                className="btn-primary-dark text-xs mt-3"
                style={{ marginLeft: '36px' }}
                disabled
                title="Not available in this demo"
              >
                <i className="ti ti-webhook"></i>Register webhook
                <i className="ti ti-arrow-right text-xs"></i>
              </button>
            </div>

            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl mt-1"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <span className="step-dot pending" style={{ width: '24px', height: '24px' }}>
                <i className="ti ti-lock text-xs"></i>
              </span>
              <div className="flex-1">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                  Go live
                </span>
                <div className="text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Complete steps 1–3, then Admin approval
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass p-5 flex flex-col gap-4" style={{ gridColumn: 'span 4' }}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
                Requests (7d)
              </span>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                vs prior week
              </span>
            </div>
            <div className="flex items-end gap-2 mt-1">
              <span
                className="text-2xl font-extrabold tabular-nums"
                style={{ color: 'var(--ink)' }}
              >
                4,218
              </span>
              <span
                className="text-sm font-bold mb-1 tabular-nums"
                style={{ color: 'var(--text-muted)' }}
              >
                +18%
              </span>
            </div>
            <div className="text-xs mt-0.5 tabular-nums" style={{ color: 'var(--text-faint)' }}>
              612 today · 2 active keys
            </div>
            <svg viewBox="0 0 220 60" className="w-full h-14 mt-2" preserveAspectRatio="none">
              <defs>
                <linearGradient id="sg1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff5fc4" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#ff5fc4" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,42 L30,36 L60,39 L90,26 L120,29 L150,15 L180,20 L220,8 L220,60 L0,60 Z"
                fill="url(#sg1)"
              />
              <path
                d="M0,42 L30,36 L60,39 L90,26 L120,29 L150,15 L180,20 L220,8"
                fill="none"
                stroke="var(--pink)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div
              className="flex items-center justify-between text-xs mt-1 font-mono tabular-nums"
              style={{ color: 'var(--text-faint)' }}
            >
              <span>Oct 14</span>
              <span>Oct 20</span>
            </div>
          </div>
          <div className="h-px" style={{ background: 'var(--card-border)' }}></div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                Error rate
              </div>
              <div
                className="text-sm font-bold mt-1 tabular-nums"
                style={{ color: 'var(--warning)' }}
              >
                3.0%
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                p95 latency
              </div>
              <div className="text-sm font-bold mt-1 tabular-nums" style={{ color: 'var(--ink)' }}>
                186ms
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                2xx/4xx/5xx
              </div>
              <div className="text-xs font-bold mt-1.5 tabular-nums">
                <span style={{ color: 'var(--success)' }}>97.0%</span>/
                <span style={{ color: 'var(--warning)' }}>2.4%</span>/
                <span style={{ color: 'var(--danger)' }}>0.6%</span>
              </div>
            </div>
          </div>
          <div className="h-px" style={{ background: 'var(--card-border)' }}></div>
          <div>
            <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
              Service health
            </span>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                  API
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-mono tabular-nums"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    38ms
                  </span>
                  <span className="status-pill success">
                    <span className="dot" style={{ background: 'currentColor' }}></span>Operational
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                  Webhooks
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-mono tabular-nums"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    61ms
                  </span>
                  <span className="status-pill success">
                    <span className="dot" style={{ background: 'currentColor' }}></span>Operational
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                  MCP server
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-mono tabular-nums"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    54ms
                  </span>
                  <span className="status-pill success">
                    <span className="dot" style={{ background: 'currentColor' }}></span>Operational
                  </span>
                </div>
              </div>
            </div>
            <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              Uptime (30d):{' '}
              <span style={{ color: 'var(--ink)', fontWeight: '700' }} className="tabular-nums">
                99.97%
              </span>{' '}
              · SLA target 99.5%
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
            Quickstart
          </span>
          <div
            className="flex items-center gap-1"
            style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '999px', padding: '3px' }}
          >
            <span className="dtab active" style={{ padding: '5px 12px', fontSize: '12px' }}>
              TypeScript
            </span>
            <span className="dtab" style={{ padding: '5px 12px', fontSize: '12px' }}>
              REST
            </span>
            <span className="dtab" style={{ padding: '5px 12px', fontSize: '12px' }}>
              cURL
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap mt-3.5">
          <div className="card2 flex items-center gap-2 px-3 py-2">
            <span className="font-mono text-xs" style={{ color: 'var(--text-faint)' }}>
              $
            </span>
            <span className="font-mono text-xs" style={{ color: 'var(--ink)' }}>
              npm i @octap/sdk
            </span>
            <button
              disabled
              data-placeholder="true"
              className="copy-btn"
              aria-label="Copy install command"
              title="Copy install command"
            >
              <i className="ti ti-copy text-xs"></i>
            </button>
          </div>
          <div
            className="flex items-center gap-2 text-xs font-semibold"
            style={{ color: 'var(--text-muted)' }}
          >
            Using key:
            <span
              className="card2 px-3 py-2 font-mono text-xs flex items-center gap-1.5"
              style={{ color: 'var(--ink)' }}
            >
              octap_test_sk_••••a9f2
              <i className="ti ti-chevron-down text-xs" style={{ color: 'var(--text-faint)' }}></i>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 mt-3.5">
          <div style={{ gridColumn: 'span 7' }}>
            <div className="code-block p-4 relative h-full">
              <div className="absolute top-3 right-3">
                <button
                  disabled
                  data-placeholder="true"
                  className="copy-btn"
                  aria-label="Copy code sample"
                  title="Copy code sample"
                >
                  <i className="ti ti-copy text-xs"></i>
                </button>
              </div>
              <pre className="font-mono">
                <span className="tok-kw">import</span>{' '}
                <span className="tok-pl">
                  {'{'} OctaPClient {'}'}
                </span>{' '}
                <span className="tok-kw">from</span> <span className="tok-str">'@octap/sdk'</span>;
                {'\n'}
                {'\n'}
                <span className="tok-kw">const</span> <span className="tok-fn">octap</span> ={' '}
                <span className="tok-kw">new</span> <span className="tok-fn">OctaPClient</span>(
                {'{'}
                {'\n'} apiKey: <span className="tok-str">'octap_test_sk_a9f2...'</span>,{'\n'}
                {'}'});{'\n'}
                {'\n'}
                <span className="tok-cm">
                  // Credit 52 Petals to a member after a 520,000 VND bill
                </span>
                {'\n'}
                <span className="tok-kw">await</span> <span className="tok-fn">octap</span>.points.
                <span className="tok-fn">earn</span>({'{'}
                {'\n'} memberPhone: <span className="tok-str">'+84901234567'</span>,{'\n'}{' '}
                billAmount: <span className="tok-num">520000</span>,{'\n'}
                {'}'});
              </pre>
            </div>
          </div>
          <div style={{ gridColumn: 'span 5' }}>
            <span
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: 'var(--text-muted)' }}
            >
              Sample response
            </span>
            <div className="code-block p-4 mt-2">
              <pre className="font-mono">
                {'{'}
                {'\n'} <span className="tok-pl">"status"</span>:{' '}
                <span className="tok-num">200</span>,{'\n'}{' '}
                <span className="tok-pl">"transactionId"</span>:{' '}
                <span className="tok-str">"tx_8f21a9"</span>,{'\n'}{' '}
                <span className="tok-pl">"petalsEarned"</span>: <span className="tok-num">52</span>,
                {'\n'} <span className="tok-pl">"balance"</span>:{' '}
                <span className="tok-num">2480</span>
                {'\n'}
                {'}'}
              </pre>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3.5">
          <button disabled data-placeholder="true" className="btn-primary-dark text-xs">
            <i className="ti ti-player-play"></i>Run in sandbox
          </button>
          <a
            href="#"
            className="text-xs font-bold flex items-center gap-1"
            style={{ color: 'var(--pink)' }}
            aria-disabled="true"
            onClick={(event) => event.preventDefault()}
            title="Not available in this demo"
          >
            Read the docs<i className="ti ti-external-link text-xs"></i>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="card p-5" style={{ gridColumn: 'span 8' }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
              Recent activity
            </span>
            <a
              href="#"
              className="text-xs font-bold flex items-center gap-1"
              style={{ color: 'var(--pink)' }}
              aria-disabled="true"
              onClick={(event) => event.preventDefault()}
              title="Not available in this demo"
            >
              View all logs<i className="ti ti-arrow-right text-xs"></i>
            </a>
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
            Showing Test environment only
          </div>
          <div
            className="grid gap-2 text-xs font-bold uppercase tracking-wide px-1 mt-3"
            style={{
              gridTemplateColumns: '0.8fr 2.2fr 0.7fr 0.8fr 0.9fr 0.9fr',
              color: 'var(--text-faint)',
            }}
          >
            <span>Method</span>
            <span>Path</span>
            <span>Status</span>
            <span>Latency</span>
            <span>Key</span>
            <span className="text-right">Time</span>
          </div>
          <div className="flex flex-col mt-1">
            <div
              className="activity-row grid gap-2 items-center py-2.5 px-1 newest"
              style={{
                gridTemplateColumns: '0.8fr 2.2fr 0.7fr 0.8fr 0.9fr 0.9fr',
                borderBottom: '1px solid var(--card-border)',
              }}
              data-action="open-log-detail"
            >
              <span className="method-badge post font-mono">POST</span>
              <span className="text-xs font-mono truncate" style={{ color: 'var(--text-2)' }}>
                /v1/points/earn
              </span>
              <span
                className="text-xs font-mono font-bold tabular-nums"
                style={{ color: 'var(--success)' }}
              >
                200
              </span>
              <span
                className="text-xs font-mono tabular-nums"
                style={{ color: 'var(--text-muted)' }}
              >
                118ms
              </span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>
                …a9f2
              </span>
              <span
                className="text-xs font-mono tabular-nums text-right"
                style={{ color: 'var(--text-faint)' }}
              >
                2m ago
              </span>
            </div>
            <div
              className="activity-row grid gap-2 items-center py-2.5 px-1"
              style={{
                gridTemplateColumns: '0.8fr 2.2fr 0.7fr 0.8fr 0.9fr 0.9fr',
                borderBottom: '1px solid var(--card-border)',
              }}
              data-action="open-log-detail"
            >
              <span className="method-badge get font-mono">GET</span>
              <span className="text-xs font-mono truncate" style={{ color: 'var(--text-2)' }}>
                /v1/members/+8490••456
              </span>
              <span
                className="text-xs font-mono font-bold tabular-nums"
                style={{ color: 'var(--success)' }}
              >
                200
              </span>
              <span
                className="text-xs font-mono tabular-nums"
                style={{ color: 'var(--text-muted)' }}
              >
                42ms
              </span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>
                …a9f2
              </span>
              <span
                className="text-xs font-mono tabular-nums text-right"
                style={{ color: 'var(--text-faint)' }}
              >
                3m ago
              </span>
            </div>
            <div
              className="activity-row grid gap-2 items-center py-2.5 px-1"
              style={{
                gridTemplateColumns: '0.8fr 2.2fr 0.7fr 0.8fr 0.9fr 0.9fr',
                borderBottom: '1px solid var(--card-border)',
              }}
              data-action="open-log-detail"
            >
              <span className="method-badge post font-mono">POST</span>
              <span className="text-xs font-mono truncate" style={{ color: 'var(--text-2)' }}>
                /v1/points/redeem
              </span>
              <span
                className="text-xs font-mono font-bold tabular-nums"
                style={{ color: 'var(--success)' }}
              >
                200
              </span>
              <span
                className="text-xs font-mono tabular-nums"
                style={{ color: 'var(--text-muted)' }}
              >
                96ms
              </span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>
                …a9f2
              </span>
              <span
                className="text-xs font-mono tabular-nums text-right"
                style={{ color: 'var(--text-faint)' }}
              >
                19m ago
              </span>
            </div>
            <div
              className="activity-row grid gap-2 items-center py-2.5 px-1"
              style={{
                gridTemplateColumns: '0.8fr 2.2fr 0.7fr 0.8fr 0.9fr 0.9fr',
                borderBottom: '1px solid var(--card-border)',
              }}
              data-action="open-log-detail"
            >
              <span className="method-badge post font-mono">POST</span>
              <span className="text-xs font-mono truncate" style={{ color: 'var(--text-2)' }}>
                /v1/points/earn
              </span>
              <span
                className="text-xs font-mono font-bold tabular-nums"
                style={{ color: 'var(--warning)' }}
                title="invalid_amount"
              >
                422
              </span>
              <span
                className="text-xs font-mono tabular-nums"
                style={{ color: 'var(--text-muted)' }}
              >
                31ms
              </span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>
                …a9f2
              </span>
              <span
                className="text-xs font-mono tabular-nums text-right"
                style={{ color: 'var(--text-faint)' }}
              >
                1h ago
              </span>
            </div>
          </div>
        </div>

        <div className="card p-5 flex flex-col" style={{ gridColumn: 'span 4' }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
              This month's usage
            </span>
            <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>
              11.4K / 50K calls
            </span>
          </div>
          <div
            className="rounded-full overflow-hidden mt-3"
            style={{ height: '8px', background: 'rgba(255,255,255,0.06)' }}
            role="progressbar"
            aria-valuenow={23}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Monthly usage"
          >
            <div
              style={{
                width: '23%',
                height: '100%',
                borderRadius: '999px',
                background: 'linear-gradient(90deg,var(--pink-deep),var(--pink))',
              }}
            ></div>
          </div>
          <div className="text-xs mt-2 tabular-nums" style={{ color: 'var(--text-muted)' }}>
            23% used · Resets in 11 days
          </div>
          <div className="text-xs mt-1 tabular-nums" style={{ color: 'var(--text-faint)' }}>
            Projected by cycle end: ~18K calls (36%)
          </div>

          <div className="h-px my-3.5" style={{ background: 'var(--card-border)' }}></div>

          <span
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: 'var(--text-muted)' }}
          >
            Top endpoints
          </span>
          <div className="flex flex-col gap-2.5 mt-2">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono" style={{ color: 'var(--ink)' }}>
                  /v1/points/earn
                </span>
                <span className="tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  61%
                </span>
              </div>
              <div
                className="rounded-full overflow-hidden mt-1"
                style={{ height: '4px', background: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  style={{
                    width: '61%',
                    height: '100%',
                    borderRadius: '999px',
                    background: 'var(--pink)',
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono" style={{ color: 'var(--ink)' }}>
                  /v1/members
                </span>
                <span className="tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  24%
                </span>
              </div>
              <div
                className="rounded-full overflow-hidden mt-1"
                style={{ height: '4px', background: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  style={{
                    width: '24%',
                    height: '100%',
                    borderRadius: '999px',
                    background: 'var(--pink)',
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono" style={{ color: 'var(--ink)' }}>
                  /v1/points/redeem
                </span>
                <span className="tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  15%
                </span>
              </div>
              <div
                className="rounded-full overflow-hidden mt-1"
                style={{ height: '4px', background: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  style={{
                    width: '15%',
                    height: '100%',
                    borderRadius: '999px',
                    background: 'var(--pink)',
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
