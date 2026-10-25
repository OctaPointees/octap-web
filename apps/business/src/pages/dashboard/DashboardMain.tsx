type Props = {
  env: 'live' | 'test';
  onEnv: (env: 'live' | 'test') => void;
  scrolled: boolean;
  onTx: (index: number) => void;
};

export default function DashboardMain({ env, onEnv, scrolled, onTx }: Props) {
  return (
    <>
      <div
        id="mainLight"
        className="flex-1 min-w-0 flex flex-col gap-3"
        style={{ maxWidth: '1440px', margin: '0 auto', width: '100%' }}
      >
        <div id="stickyTop" className={`flex flex-col ${scrolled ? 'scrolled' : ''}`}>
          <div className="flex items-center gap-3 px-4 py-2.5">
            <div
              id="searchField"
              className="flex items-center gap-2 px-3.5 py-2 flex-1 max-w-md rounded-field border border-line bg-ground"
            >
              <i className="text-muted ri-search-line text-sm"></i>
              <span className="text-muted text-sm flex-1">Search members, transactions…</span>
              <span
                className="font-mono text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
                style={{ background: 'rgba(42,10,28,0.06)', color: 'var(--muted)' }}
              >
                ⌘K
              </span>
            </div>
            <div className="flex-1"></div>
            <div className="seg flex items-center gap-1">
              <button
                type="button"
                aria-pressed={env === 'live'}
                id="liveOpt"
                onClick={() => onEnv('live')}
                className={`seg-opt ${env === 'live' ? 'active' : ''}`}
              >
                Live
              </button>
              <button
                type="button"
                aria-pressed={env === 'test'}
                id="testOpt"
                onClick={() => onEnv('test')}
                className={`seg-opt ${env === 'test' ? 'active' : ''}`}
              >
                Test
              </button>
            </div>
            <button
              aria-label="Notifications"
              className="bg-tint size-9 rounded-full flex items-center justify-center relative"
            >
              <i className="text-ink-2 ri-notification-3-line text-sm"></i>
              <span className="bg-purple absolute top-1.5 right-2 size-1.5 rounded-full"></span>
            </button>
          </div>
          <div
            id="testStrip"
            className="items-center gap-2 text-xs font-bold px-4 py-2.5"
            style={{
              display: env === 'test' ? 'flex' : 'none',
              background: 'rgba(236,170,11,0.1)',
              color: '#b07d08',
              borderTop: '1px solid rgba(236,170,11,0.2)',
              borderRadius: '0 0 22px 22px',
            }}
          >
            <i className="ri-flask-line"></i>Test mode — no real Petals or VND move here.
          </div>
        </div>

        <div className="grad-brand rounded-box p-6 flex items-center justify-between gap-6 flex-wrap relative overflow-hidden text-white">
          <div
            className="absolute -right-16 -top-20 size-64 rounded-full"
            style={{ background: 'radial-gradient(circle,rgba(255,255,255,0.14),transparent 70%)' }}
          ></div>
          <div className="relative">
            <div className="flex items-center gap-2.5">
              <div className="size-10 rounded-xl bg-white/15 flex items-center justify-center">
                <i className="ri-store-2-fill text-lg"></i>
              </div>
              <h1 className="font-head text-2xl font-extrabold tracking-tight">
                Lotus Mart{' '}
                <span
                  className="font-accent italic font-normal text-3xl"
                  style={{ color: '#FFE27A' }}
                >
                  loyalty
                </span>
              </h1>
            </div>
            <p
              className="text-sm mt-1.5 text-white/80"
              style={{ maxWidth: '640px', textWrap: 'balance' }}
            >
              Real-time performance of your loyalty program. Every point is verifiable on-chain.
            </p>
          </div>
          <div className="relative flex items-center gap-3">
            <div className="seg seg-light flex items-center gap-1">
              <span className="seg-opt">7d</span>
              <span className="seg-opt active">30d</span>
              <span className="seg-opt">90d</span>
            </div>
            <a
              href="#"
              className="btn-pill text-sm px-5 py-2.5 flex items-center gap-1.5 font-bold"
              style={{ background: '#fff', color: 'var(--purple)' }}
            >
              <i className="ri-store-2-line"></i>Issue points
            </a>
          </div>
        </div>

        <div
          className="relative w-full overflow-hidden leading-none -my-5"
          style={{ height: '36px' }}
        >
          <svg viewBox="0 0 1440 60" className="w-full h-9" preserveAspectRatio="none">
            <path
              d="M0,10 C240,45 480,0 720,18 C960,36 1200,5 1440,22 L1440,60 L0,60 Z"
              fill="var(--ground)"
            ></path>
          </svg>
        </div>

        <div className="card grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          <a
            href="#"
            className="kpi-link ticket-seg flex-1 p-5 block"
            aria-label="Revenue from members, opens Transactions filtered to this period"
          >
            <i className="text-ink-2 ri-arrow-right-s-line kpi-chevron absolute top-3 right-3 text-sm"></i>
            <div className="text-ink-2 flex items-center gap-1.5 text-xs font-bold">
              <i className="text-purple ri-wallet-3-line"></i>Revenue from members
            </div>
            <div className="font-head text-2xl font-extrabold mt-1.5 tabular-nums">428.5M ₫</div>
            <div className="text-green flex items-center gap-1 mt-1 text-xs font-bold tabular-nums">
              <i className="ri-arrow-up-line"></i>+12.4% vs previous 30d
            </div>
          </a>
          <a
            href="#"
            className="kpi-link ticket-seg flex-1 p-5 block"
            aria-label="Petals issued, opens Transactions filtered to this period"
          >
            <i className="text-ink-2 ri-arrow-right-s-line kpi-chevron absolute top-3 right-3 text-sm"></i>
            <div className="text-ink-2 flex items-center gap-1.5 text-xs font-bold">
              <i className="text-pink ri-coins-line"></i>Petals issued
            </div>
            <div className="font-head text-2xl font-extrabold mt-1.5 tabular-nums">86.4K</div>
            <div className="text-green flex items-center gap-1 mt-1 text-xs font-bold tabular-nums">
              <i className="ri-arrow-up-line"></i>+8.1% vs previous 30d
            </div>
          </a>
          <a
            href="#"
            className="kpi-link ticket-seg flex-1 p-5 block"
            aria-label="Petals redeemed, opens Transactions filtered to this period"
          >
            <i className="text-ink-2 ri-arrow-right-s-line kpi-chevron absolute top-3 right-3 text-sm"></i>
            <div className="text-ink-2 flex items-center gap-1.5 text-xs font-bold">
              <i className="ri-coupon-3-line" style={{ color: '#b07d08' }}></i>Petals redeemed
            </div>
            <div className="font-head text-2xl font-extrabold mt-1.5 tabular-nums">52.1K</div>
            <div className="text-green flex items-center gap-1 mt-1 text-xs font-bold tabular-nums">
              <i className="ri-arrow-up-line"></i>+5.6% vs previous 30d
            </div>
          </a>
          <a
            href="#"
            className="kpi-link ticket-seg flex-1 p-5 block"
            aria-label="New members, opens Members filtered to this period"
          >
            <i className="text-ink-2 ri-arrow-right-s-line kpi-chevron absolute top-3 right-3 text-sm"></i>
            <div className="text-ink-2 flex items-center gap-1.5 text-xs font-bold">
              <i className="text-cyan ri-user-add-line"></i>New members
            </div>
            <div className="font-head text-2xl font-extrabold mt-1.5 tabular-nums">312</div>
            <div className="text-green flex items-center gap-1 mt-1 text-xs font-bold tabular-nums">
              <i className="ri-arrow-up-line"></i>+14.2% vs previous 30d
            </div>
          </a>
        </div>

        <div className="grid grid-cols-12 gap-3">
          <div className="card p-5 flex flex-col col-span-12 xl:col-span-8">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="card-heading">Points flow</span>
                <span className="text-ink-2 text-xs font-semibold flex items-center gap-1">
                  <i className="ri-refresh-line text-xs"></i>Updated 2m ago
                </span>
              </div>
              <button
                className="btn-pill flex items-center gap-1.5 text-xs font-bold px-3 py-1.5"
                style={{
                  border: '1px solid var(--line)',
                  color: 'var(--purple)',
                  background: '#fff',
                }}
                aria-label="Export chart data as CSV"
              >
                <i className="ri-download-2-line"></i>Export CSV
              </button>
            </div>

            <svg
              viewBox="0 -34 672 268"
              className="w-full flex-1 mt-2"
              style={{ minHeight: '248px' }}
              role="img"
              aria-label="Points flow, daily, last 30 days. Issued totals 86,400 Petals, averaging 2.9K per day, ranging from 2.0K to 4.5K. Redeemed totals 52,100 Petals, averaging 1.7K per day, ranging from 1.1K to 2.6K."
            >
              <defs>
                <linearGradient id="gs1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D6177E" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#D6177E" stopOpacity="0" />
                </linearGradient>
              </defs>
              <text x="36" y="6" fontSize="9" fontWeight="700" fill="var(--ink-2)">
                Petals / day
              </text>
              <g>
                <line x1="36" y1="190" x2="610" y2="190" stroke="var(--line)" strokeWidth="1" />
                <line x1="36" y1="154" x2="610" y2="154" stroke="var(--line)" strokeWidth="1" />
                <line x1="36" y1="118" x2="610" y2="118" stroke="var(--line)" strokeWidth="1" />
                <line x1="36" y1="82" x2="610" y2="82" stroke="var(--line)" strokeWidth="1" />
                <line x1="36" y1="46" x2="610" y2="46" stroke="var(--line)" strokeWidth="1" />
                <line x1="36" y1="10" x2="610" y2="10" stroke="var(--line)" strokeWidth="1" />
                <text x="30" y="193" textAnchor="end" fontSize="9" fill="var(--ink-2)">
                  0
                </text>
                <text x="30" y="157" textAnchor="end" fontSize="9" fill="var(--ink-2)">
                  1K
                </text>
                <text x="30" y="121" textAnchor="end" fontSize="9" fill="var(--ink-2)">
                  2K
                </text>
                <text x="30" y="85" textAnchor="end" fontSize="9" fill="var(--ink-2)">
                  3K
                </text>
                <text x="30" y="49" textAnchor="end" fontSize="9" fill="var(--ink-2)">
                  4K
                </text>
                <text x="30" y="13" textAnchor="end" fontSize="9" fill="var(--ink-2)">
                  5K
                </text>
              </g>
              <path
                d="M36.0,119.7 L55.8,119.7 L75.6,119.4 L95.4,119.7 L115.2,111.2 L135.0,108.6 L154.8,117.2 L174.6,111.5 L194.3,105.8 L214.1,93.6 L233.9,113.2 L253.7,88.9 L273.5,78.5 L293.3,104.2 L313.1,92.5 L332.9,96.3 L352.7,76.5 L372.5,77.2 L392.3,88.0 L412.1,59.3 L431.9,92.2 L451.7,60.2 L471.4,81.7 L491.2,28.0 L511.0,68.1 L530.8,74.4 L550.6,28.0 L570.4,62.9 L590.2,45.7 L610.0,47.2 L610.0,190 L36.0,190 Z"
                fill="url(#gs1)"
              />
              <path
                d="M36.0,119.7 L55.8,119.7 L75.6,119.4 L95.4,119.7 L115.2,111.2 L135.0,108.6 L154.8,117.2 L174.6,111.5 L194.3,105.8 L214.1,93.6 L233.9,113.2 L253.7,88.9 L273.5,78.5 L293.3,104.2 L313.1,92.5 L332.9,96.3 L352.7,76.5 L372.5,77.2 L392.3,88.0 L412.1,59.3 L431.9,92.2 L451.7,60.2 L471.4,81.7 L491.2,28.0 L511.0,68.1 L530.8,74.4 L550.6,28.0 L570.4,62.9 L590.2,45.7 L610.0,47.2"
                fill="none"
                stroke="#D6177E"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M36.0,150.2 L55.8,150.2 L75.6,136.6 L95.4,147.7 L115.2,148.5 L135.0,133.6 L154.8,144.9 L174.6,150.3 L194.3,140.1 L214.1,124.1 L233.9,136.6 L253.7,141.0 L273.5,118.4 L293.3,127.6 L313.1,125.1 L332.9,125.0 L352.7,122.5 L372.5,135.4 L392.3,124.2 L412.1,101.4 L431.9,130.6 L451.7,123.6 L471.4,124.7 L491.2,101.7 L511.0,113.9 L530.8,126.2 L550.6,96.4 L570.4,106.9 L590.2,112.9 L610.0,104.1"
                fill="none"
                stroke="#1FADC0"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <text x="614" y="51" fontSize="12" fontWeight="700" fill="#D6177E">
                Issued
              </text>
              <text x="614" y="108" fontSize="12" fontWeight="700" fill="#1FADC0">
                Redeemed
              </text>

              <g fontSize="9" fill="var(--ink-2)">
                <line x1="36.0" y1="190" x2="36.0" y2="194" stroke="var(--ink-2)" />
                <line x1="174.6" y1="190" x2="174.6" y2="194" stroke="var(--ink-2)" />
                <line x1="313.1" y1="190" x2="313.1" y2="194" stroke="var(--ink-2)" />
                <line x1="451.7" y1="190" x2="451.7" y2="194" stroke="var(--ink-2)" />
                <line x1="590.2" y1="190" x2="590.2" y2="194" stroke="var(--ink-2)" />
                <text x="36.0" y="207">
                  Sep 21
                </text>
                <text x="174.6" y="207" textAnchor="middle">
                  Sep 28
                </text>
                <text x="313.1" y="207" textAnchor="middle">
                  Oct 5
                </text>
                <text x="451.7" y="207" textAnchor="middle">
                  Oct 12
                </text>
                <text x="590.2" y="207" textAnchor="end">
                  Oct 19
                </text>
              </g>

              <g>
                <line
                  x1="293.3"
                  y1="10"
                  x2="293.3"
                  y2="190"
                  stroke="var(--ink-2)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.5"
                />
                <circle
                  cx="293.3"
                  cy="104.2"
                  r="4"
                  fill="#D6177E"
                  stroke="#fff"
                  strokeWidth="1.5"
                />
                <circle
                  cx="293.3"
                  cy="127.6"
                  r="4"
                  fill="#1FADC0"
                  stroke="#fff"
                  strokeWidth="1.5"
                />
                <path d="M288.3,8 L293.3,14 L298.3,8 Z" fill="#2A0A1C" />
                <g transform="translate(228.3,-32)">
                  <rect width="130" height="40" rx="8" fill="#2A0A1C" />
                  <text x="10" y="14" fontSize="9" fontWeight="700" fill="#fff">
                    Sun, Oct 4
                  </text>
                  <text x="10" y="26" fontSize="9" fill="#FF8FC9">
                    Issued · 2.4K
                  </text>
                  <text x="10" y="36" fontSize="9" fill="#8FE0EC">
                    Redeemed · 1.7K
                  </text>
                </g>
              </g>
            </svg>
            <table className="sr-only">
              <caption>Points flow, daily, last 30 days</caption>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Issued</th>
                  <th>Redeemed</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Mon, Sep 21</td>
                  <td>1,953</td>
                  <td>1,105</td>
                </tr>
                <tr>
                  <td>Tue, Sep 22</td>
                  <td>1,953</td>
                  <td>1,105</td>
                </tr>
                <tr>
                  <td>Wed, Sep 23</td>
                  <td>1,961</td>
                  <td>1,484</td>
                </tr>
                <tr>
                  <td>Thu, Sep 24</td>
                  <td>1,953</td>
                  <td>1,175</td>
                </tr>
                <tr>
                  <td>Fri, Sep 25</td>
                  <td>2,190</td>
                  <td>1,152</td>
                </tr>
                <tr>
                  <td>Sat, Sep 26</td>
                  <td>2,260</td>
                  <td>1,567</td>
                </tr>
                <tr>
                  <td>Sun, Sep 27</td>
                  <td>2,021</td>
                  <td>1,254</td>
                </tr>
                <tr>
                  <td>Mon, Sep 28</td>
                  <td>2,180</td>
                  <td>1,104</td>
                </tr>
                <tr>
                  <td>Tue, Sep 29</td>
                  <td>2,338</td>
                  <td>1,387</td>
                </tr>
                <tr>
                  <td>Wed, Sep 30</td>
                  <td>2,678</td>
                  <td>1,831</td>
                </tr>
                <tr>
                  <td>Thu, Oct 1</td>
                  <td>2,133</td>
                  <td>1,483</td>
                </tr>
                <tr>
                  <td>Fri, Oct 2</td>
                  <td>2,807</td>
                  <td>1,362</td>
                </tr>
                <tr>
                  <td>Sat, Oct 3</td>
                  <td>3,098</td>
                  <td>1,988</td>
                </tr>
                <tr>
                  <td>Sun, Oct 4</td>
                  <td>2,383</td>
                  <td>1,732</td>
                </tr>
                <tr>
                  <td>Mon, Oct 5</td>
                  <td>2,708</td>
                  <td>1,803</td>
                </tr>
                <tr>
                  <td>Tue, Oct 6</td>
                  <td>2,602</td>
                  <td>1,805</td>
                </tr>
                <tr>
                  <td>Wed, Oct 7</td>
                  <td>3,152</td>
                  <td>1,876</td>
                </tr>
                <tr>
                  <td>Thu, Oct 8</td>
                  <td>3,134</td>
                  <td>1,516</td>
                </tr>
                <tr>
                  <td>Fri, Oct 9</td>
                  <td>2,834</td>
                  <td>1,828</td>
                </tr>
                <tr>
                  <td>Sat, Oct 10</td>
                  <td>3,630</td>
                  <td>2,461</td>
                </tr>
                <tr>
                  <td>Sun, Oct 11</td>
                  <td>2,718</td>
                  <td>1,649</td>
                </tr>
                <tr>
                  <td>Mon, Oct 12</td>
                  <td>3,606</td>
                  <td>1,845</td>
                </tr>
                <tr>
                  <td>Tue, Oct 13</td>
                  <td>3,007</td>
                  <td>1,814</td>
                </tr>
                <tr>
                  <td>Wed, Oct 14</td>
                  <td>4,500</td>
                  <td>2,454</td>
                </tr>
                <tr>
                  <td>Thu, Oct 15</td>
                  <td>3,386</td>
                  <td>2,113</td>
                </tr>
                <tr>
                  <td>Fri, Oct 16</td>
                  <td>3,210</td>
                  <td>1,771</td>
                </tr>
                <tr>
                  <td>Sat, Oct 17</td>
                  <td>4,500</td>
                  <td>2,600</td>
                </tr>
                <tr>
                  <td>Sun, Oct 18</td>
                  <td>3,531</td>
                  <td>2,308</td>
                </tr>
                <tr>
                  <td>Mon, Oct 19</td>
                  <td>4,008</td>
                  <td>2,142</td>
                </tr>
                <tr>
                  <td>Tue, Oct 20</td>
                  <td>3,966</td>
                  <td>2,386</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="card p-0 overflow-visible flex flex-col col-span-12 xl:col-span-4">
            <div className="p-5">
              <div className="card-heading">Treasury</div>
              <div className="flex items-center gap-3 mt-3">
                <div className="size-10 rounded-xl grad-brand flex items-center justify-center shrink-0">
                  <i className="ri-safe-2-fill text-white"></i>
                </div>
                <div>
                  <div className="text-muted text-xs font-semibold">Outstanding points</div>
                  <div className="font-head text-base font-extrabold tabular-nums">
                    1,284,600 Petals
                  </div>
                </div>
              </div>
            </div>
            <div className="mx-5" style={{ borderTop: '2px dashed rgba(42,10,28,0.14)' }}></div>
            <div className="p-5 pt-4 flex-1 flex flex-col">
              <div>
                <div className="text-ink-2 flex justify-between text-xs font-semibold">
                  <span>Minted this month</span>
                  <span className="font-mono tabular-nums">86.4K / 400K</span>
                </div>
                <div className="usage-track mt-1.5">
                  <div className="usage-fill" style={{ width: '21.6%' }}></div>
                </div>
              </div>
              <div className="bg-line h-px my-4"></div>
              <div className="text-xs font-bold mb-2">Member tier mix</div>
              <div className="flex items-center gap-4 flex-1">
                <svg
                  viewBox="0 0 100 100"
                  style={{ width: '112px', height: '112px' }}
                  className="shrink-0"
                >
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#EDE5FE" strokeWidth="12.5" />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#b0793f"
                    strokeWidth="12.5"
                    strokeDasharray="107 239"
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#9aa4b1"
                    strokeWidth="12.5"
                    strokeDasharray="71 239"
                    strokeDashoffset="-107"
                    transform="rotate(-90 50 50)"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#e0b53f"
                    strokeWidth="12.5"
                    strokeDasharray="43 239"
                    strokeDashoffset="-178"
                    transform="rotate(-90 50 50)"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="var(--violet-grey)"
                    strokeWidth="12.5"
                    strokeDasharray="17 239"
                    strokeDashoffset="-221"
                    transform="rotate(-90 50 50)"
                  />
                  <text
                    x="50"
                    y="48"
                    textAnchor="middle"
                    fontSize="18"
                    fontWeight="800"
                    fill="var(--ink)"
                  >
                    4,312
                  </text>
                  <text
                    x="50"
                    y="61"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="var(--ink-2)"
                  >
                    members
                  </text>
                </svg>
                <div className="text-ink-2 flex flex-col gap-1.5 flex-1">
                  <span className="flex items-center justify-between text-sm font-semibold tabular-nums">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ background: '#b0793f' }}
                      ></span>
                      Bronze · 45%
                    </span>
                    <span>1,940</span>
                  </span>
                  <span className="flex items-center justify-between text-sm font-semibold tabular-nums">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ background: '#9aa4b1' }}
                      ></span>
                      Silver · 30%
                    </span>
                    <span>1,294</span>
                  </span>
                  <span className="flex items-center justify-between text-sm font-semibold tabular-nums">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ background: '#e0b53f' }}
                      ></span>
                      Gold · 18%
                    </span>
                    <span>776</span>
                  </span>
                  <span className="flex items-center justify-between text-sm font-semibold tabular-nums">
                    <span className="flex items-center gap-1.5">
                      <span className="bg-violet-grey size-2 rounded-full shrink-0"></span>Platinum
                      · 7%
                    </span>
                    <span>302</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3">
          <div className="card p-5 col-span-12 xl:col-span-8">
            <div className="flex items-center gap-2">
              <span className="card-heading">Needs attention</span>
              <span
                className="status-pill"
                style={{ background: 'rgba(255,92,122,0.12)', color: 'var(--coral)' }}
              >
                3
              </span>
            </div>
            <div className="flex flex-col gap-2.5 mt-3">
              <div
                className="flex items-center gap-2 rounded-xl kpi-link"
                style={{ background: 'rgba(255,92,122,0.06)', minHeight: '44px' }}
              >
                <a
                  href="#"
                  className="flex items-center gap-3 flex-1 min-w-0 p-3"
                  aria-label="Webhook endpoint staging.lotusmart.vn is failing, 3 attempts. Go to Developers, Webhooks."
                >
                  <i className="text-coral ri-error-warning-fill text-lg shrink-0"></i>
                  <span className="text-ink text-sm flex-1">
                    Webhook endpoint <span className="font-mono text-xs">staging.lotusmart.vn</span>{' '}
                    is failing — 3 attempts
                  </span>
                  <span className="text-purple text-xs font-bold flex items-center gap-1 shrink-0">
                    Developers › Webhooks<i className="ri-arrow-right-s-line"></i>
                  </span>
                </a>
                <button
                  className="text-ink-2 size-7 rounded-full flex items-center justify-center shrink-0 mr-2"
                  aria-label="Dismiss this alert"
                  title="Dismiss"
                >
                  <i className="ri-close-line text-sm"></i>
                </button>
              </div>
              <div
                className="flex items-center gap-2 rounded-xl kpi-link"
                style={{ background: 'rgba(236,170,11,0.08)', minHeight: '44px' }}
              >
                <a
                  href="#"
                  className="flex items-center gap-3 flex-1 min-w-0 p-3"
                  aria-label="API usage at 82% of monthly quota. Go to Developers, Overview."
                >
                  <i className="ri-pulse-fill text-lg shrink-0" style={{ color: '#b07d08' }}></i>
                  <span className="text-ink text-sm flex-1">API usage at 82% of monthly quota</span>
                  <span className="text-purple text-xs font-bold flex items-center gap-1 shrink-0">
                    Developers › Overview<i className="ri-arrow-right-s-line"></i>
                  </span>
                </a>
                <button
                  className="text-ink-2 size-7 rounded-full flex items-center justify-center shrink-0 mr-2"
                  aria-label="Snooze this alert"
                  title="Snooze"
                >
                  <i className="ri-close-line text-sm"></i>
                </button>
              </div>
              <div
                className="flex items-center gap-2 rounded-xl kpi-link"
                style={{ background: '#FDEFF6', minHeight: '44px' }}
              >
                <a
                  href="#"
                  className="flex items-center gap-3 flex-1 min-w-0 p-3"
                  aria-label="Tết Golden Hour has used 67% of its budget. Go to Campaigns."
                >
                  <i className="text-purple ri-information-fill text-lg shrink-0"></i>
                  <span className="text-ink text-sm flex-1">
                    Tết Golden Hour has used 67% of its budget
                  </span>
                  <span className="text-purple text-xs font-bold flex items-center gap-1 shrink-0">
                    Campaigns<i className="ri-arrow-right-s-line"></i>
                  </span>
                </a>
                <button
                  className="text-ink-2 size-7 rounded-full flex items-center justify-center shrink-0 mr-2"
                  aria-label="Dismiss this alert"
                  title="Dismiss"
                >
                  <i className="ri-close-line text-sm"></i>
                </button>
              </div>
            </div>
          </div>

          <div className="card p-5 flex flex-col col-span-12 xl:col-span-4">
            <span className="card-heading">Expiring soon</span>
            <div className="flex items-end justify-between gap-2 mt-2">
              <div>
                <div className="text-ink font-head text-2xl font-extrabold tabular-nums">
                  12.4K Petals
                </div>
                <div className="text-ink-2 text-xs mt-0.5">expire in 30 days</div>
              </div>
              <svg
                viewBox="0 0 120 56"
                style={{ width: '120px', height: '56px' }}
                className="shrink-0"
                role="img"
                aria-label="Petals expiring by week: week 1, 3.1K; week 2, 4.2K; week 3, 2.6K; week 4, 2.5K; total 12.4K"
              >
                <text
                  x="10"
                  y="8"
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="700"
                  fill="var(--ink-2)"
                >
                  3.1K
                </text>
                <rect x="2" y="12" width="16" height="30" rx="3" fill="var(--purple)" />
                <text
                  x="34"
                  y="2"
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="700"
                  fill="var(--ink-2)"
                >
                  4.2K
                </text>
                <rect x="26" y="6" width="16" height="36" rx="3" fill="#ECAA0B" />
                <text
                  x="58"
                  y="18"
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="700"
                  fill="var(--ink-2)"
                >
                  2.6K
                </text>
                <rect x="50" y="22" width="16" height="20" rx="3" fill="var(--purple)" />
                <text
                  x="82"
                  y="19"
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="700"
                  fill="var(--ink-2)"
                >
                  2.5K
                </text>
                <rect x="74" y="23" width="16" height="19" rx="3" fill="#ECAA0B" />
                <text x="10" y="52" textAnchor="middle" fontSize="7.5" fill="var(--ink-2)">
                  Wk1
                </text>
                <text x="34" y="52" textAnchor="middle" fontSize="7.5" fill="var(--ink-2)">
                  Wk2
                </text>
                <text x="58" y="52" textAnchor="middle" fontSize="7.5" fill="var(--ink-2)">
                  Wk3
                </text>
                <text x="82" y="52" textAnchor="middle" fontSize="7.5" fill="var(--ink-2)">
                  Wk4
                </text>
              </svg>
            </div>
            <a href="#" className="text-purple text-xs font-bold flex items-center gap-1 mt-2">
              Review expiry rules<i className="ri-arrow-right-s-line"></i>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3">
          <div className="card p-5 flex flex-col col-span-12 xl:col-span-8">
            <div className="flex items-center justify-between">
              <span className="card-heading">Live campaigns</span>
              <a href="#" className="text-purple text-xs font-bold flex items-center gap-1">
                Manage<i className="ri-arrow-right-line"></i>
              </a>
            </div>
            <div className="flex flex-col gap-3 mt-4 flex-1">
              <div
                className="stub flex items-center gap-4 rounded-xl p-3.5"
                style={{ background: 'var(--campaign-bg)', border: '1px solid rgba(159,2,97,.14)' }}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold">Tết Golden Hour</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: '#0F7B4A' }}>
                      ROI +186%
                    </span>
                  </div>
                  <div className="bg-campaign-track usage-track mt-1.5">
                    <div className="usage-fill" style={{ width: '66%' }}></div>
                  </div>
                  <div className="text-ink-2 flex justify-between text-xs mt-1 tabular-nums">
                    <span>Multiplier · 1,204 participants</span>
                    <span>40.0K / 60.0K Petals</span>
                  </div>
                  <div className="text-ink-2 text-xs mt-1">Ends Oct 31</div>
                </div>
              </div>
              <div
                className="stub flex items-center gap-4 rounded-xl p-3.5"
                style={{ background: 'var(--campaign-bg)', border: '1px solid rgba(159,2,97,.14)' }}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold">Weekday Coffee Boost</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: '#0F7B4A' }}>
                      ROI +94%
                    </span>
                  </div>
                  <div className="bg-campaign-track usage-track mt-1.5">
                    <div className="usage-fill" style={{ width: '72%' }}></div>
                  </div>
                  <div className="text-ink-2 flex justify-between text-xs mt-1 tabular-nums">
                    <span>Bonus · 612 participants</span>
                    <span>18.0K / 25.0K Petals</span>
                  </div>
                  <div className="text-ink-2 text-xs mt-1">Ends Nov 14</div>
                </div>
              </div>
              <a
                href="#"
                className="flex items-center justify-center gap-2 rounded-xl p-3.5 flex-1 text-sm font-bold"
                style={{
                  border: '2px dashed rgba(42,10,28,0.16)',
                  color: 'var(--ink-2)',
                  minHeight: '56px',
                }}
              >
                <i className="ri-add-line"></i>Create campaign
              </a>
            </div>
          </div>

          <div className="card p-5 col-span-12 xl:col-span-4">
            <div className="flex items-center justify-between">
              <span className="card-heading">Latest transactions</span>
              <a href="#" className="text-purple text-xs font-bold flex items-center gap-1">
                View all<i className="ri-arrow-right-line"></i>
              </a>
            </div>
            <div className="flex flex-col mt-3">
              <div
                className="tx-row flex items-center gap-3 py-2.5 px-2"
                style={{ borderBottom: '1px solid var(--divider)', cursor: 'pointer' }}
                tabIndex={0}
                role="button"
                aria-label="View transaction detail: Earn, Nguyễn, +52 Petals"
                onClick={() => onTx(0)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onTx(0)}
              >
                <span
                  className="type-pill"
                  style={{ background: 'rgba(43,175,102,0.12)', color: '#2BAF66' }}
                >
                  Earn
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">Nguyễn •••456</div>
                  <div className="text-muted text-xs">POS · 2m ago</div>
                </div>
                <span
                  className="font-mono text-sm font-bold tabular-nums text-right"
                  style={{ color: '#2BAF66' }}
                >
                  +52
                </span>
              </div>
              <div
                className="tx-row flex items-center gap-3 py-2.5 px-2"
                style={{ borderBottom: '1px solid var(--divider)', cursor: 'pointer' }}
                tabIndex={0}
                role="button"
                aria-label="View transaction detail: Redeem, Trần, -180 Petals"
                onClick={() => onTx(1)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onTx(1)}
              >
                <span
                  className="type-pill"
                  style={{ background: 'rgba(255,92,122,0.12)', color: 'var(--coral)' }}
                >
                  Redeem
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">Trần •••091</div>
                  <div className="text-muted text-xs">SDK · 14m ago</div>
                </div>
                <span className="text-coral font-mono text-sm font-bold tabular-nums text-right">
                  -180
                </span>
              </div>
              <div
                className="tx-row flex items-center gap-3 py-2.5 px-2"
                style={{ borderBottom: '1px solid var(--divider)', cursor: 'pointer' }}
                tabIndex={0}
                role="button"
                aria-label="View transaction detail: Earn, Lê, +118 Petals"
                onClick={() => onTx(2)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onTx(2)}
              >
                <span
                  className="type-pill"
                  style={{ background: 'rgba(43,175,102,0.12)', color: '#2BAF66' }}
                >
                  Earn
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">Lê •••233</div>
                  <div className="text-muted text-xs">Dashboard · 26m ago</div>
                </div>
                <span
                  className="font-mono text-sm font-bold tabular-nums text-right"
                  style={{ color: '#2BAF66' }}
                >
                  +118
                </span>
              </div>
              <div
                className="tx-row flex items-center gap-3 py-2.5 px-2"
                style={{ cursor: 'pointer' }}
                tabIndex={0}
                role="button"
                aria-label="View transaction detail: Adjust, Phạm, +25 Petals"
                onClick={() => onTx(3)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onTx(3)}
              >
                <span
                  className="type-pill"
                  style={{ background: 'rgba(236,170,11,0.14)', color: '#b07d08' }}
                >
                  Adjust
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">Phạm •••778</div>
                  <div className="text-muted text-xs">Dashboard · 41m ago</div>
                </div>
                <span
                  className="font-mono text-sm font-bold tabular-nums text-right"
                  style={{ color: '#b07d08' }}
                >
                  +25
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
