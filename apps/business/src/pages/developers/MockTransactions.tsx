export default function MockTransactions({ onRun }: { onRun: () => void }) {
  return (
    <>


    
    <div className="sticky top-0 flex flex-col" style={{"zIndex": "40", "background": "rgba(11,6,18,0.94)", "backdropFilter": "blur(12px)", "WebkitBackdropFilter": "blur(12px)", "border": "1px solid var(--card-border)", "borderRadius": "20px"}}>
      <div className="flex items-center gap-3 px-4 py-2.5">
        <div className="flex items-center gap-2 px-3.5 py-2 flex-1 max-w-md rounded-full" style={{"border": "1px solid var(--card-border)", "background": "rgba(255,255,255,0.04)"}}>
          <i className="ti ti-search text-sm" style={{"color": "var(--text-faint)"}}></i>
          <span className="text-sm flex-1" style={{"color": "var(--text-faint)"}}>Search keys, requests, endpoints…</span>
          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded" style={{"background": "rgba(255,255,255,0.06)", "color": "var(--text-faint)"}}>⌘K</span>
        </div>
        <div className="flex-1"></div>
        <div className="flex items-center gap-1" style={{"background": "rgba(255,255,255,0.04)", "borderRadius": "999px", "padding": "3px"}}>
          <span className="env-seg-opt live"><span className="env-dot" style={{"background": "var(--cyan)"}}></span>Live</span>
          <span className="env-seg-opt test active"><span className="env-dot" style={{"background": "var(--warning)"}}></span>Test</span>
        </div>
        <button className="size-9 rounded-full flex items-center justify-center relative" style={{"background": "rgba(255,255,255,0.04)"}} aria-label="Notifications" title="Notifications"><i className="ti ti-bell text-sm" style={{"color": "var(--text-faint)"}}></i><span className="absolute top-1.5 right-2 size-1.5 rounded-full" style={{"background": "var(--pink)"}}></span></button>
      </div>
      <div className="h-px" style={{"background": "var(--card-border)"}}></div>
      <div className="flex items-center gap-2 text-xs font-bold px-4 py-2.5" style={{"color": "var(--warning)"}}><i className="ti ti-flask"></i>Test mode — no real Petals or VND move here.</div>
    </div>
    
    <div className="flex items-center justify-between gap-4 flex-wrap mt-1">
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="size-10 rounded-xl flex items-center justify-center" style={{"background": "rgba(255,95,196,0.12)"}}><i className="ti ti-terminal-2 text-lg" style={{"color": "var(--pink)"}}></i></div>
          <h1 className="font-sans text-2xl font-extrabold tracking-tight flex items-center gap-2.5" style={{"color": "var(--ink)"}}>Developer<span className="font-mono text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg" style={{"background": "rgba(255,95,196,0.14)", "color": "#FF6FA5", "border": "1px solid rgba(255,95,196,0.3)"}}>mock tx</span></h1>
        </div>
        <p className="text-sm mt-1.5 max-w-lg" style={{"color": "var(--text-muted)"}}>Simulate loyalty flows end-to-end without touching production rails.</p>
      </div>
    </div>

    <div className="card p-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <span className="text-sm font-bold" style={{"color": "var(--ink)"}}>Scenario</span>
        <div className="flex items-center gap-2 text-xs font-semibold" style={{"color": "var(--text-muted)"}}>Campaign:
          <span className="card2 px-3 py-1.5 font-mono text-xs flex items-center gap-1.5" style={{"color": "var(--ink)"}}>camp_test_01 — Tết Golden Hour<i className="ti ti-chevron-down text-xs" style={{"color": "var(--text-faint)"}}></i></span>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className="dtab active">Earn</span><span className="dtab">Redeem</span><span className="dtab">Expire</span><span className="dtab">Failure case</span>
        <div className="flex-1"></div>
        <button onClick={onRun} className="btn-primary-dark text-xs"><i className="ti ti-player-play"></i>Run scenario</button>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-3">
      <div className="card p-5">
        <span className="text-sm font-bold" style={{"color": "var(--ink)"}}>Run timeline</span>
        <div className="flex flex-col mt-4">
          <div className="flex gap-3"><div className="flex flex-col items-center"><span className="step-dot done"><i className="ti ti-check"></i></span><span className="step-line done"></span></div><div className="pb-5"><div className="text-sm font-semibold" style={{"color": "var(--ink)"}}>Validate request</div><div className="text-xs font-mono tabular-nums" style={{"color": "var(--text-muted)"}}>42ms</div></div></div>
          <div className="flex gap-3"><div className="flex flex-col items-center"><span className="step-dot done"><i className="ti ti-check"></i></span><span className="step-line done"></span></div><div className="pb-5"><div className="text-sm font-semibold" style={{"color": "var(--ink)"}}>Check member balance</div><div className="text-xs font-mono tabular-nums" style={{"color": "var(--text-muted)"}}>18ms</div></div></div>
          <div className="flex gap-3"><div className="flex flex-col items-center"><span className="step-dot done"><i className="ti ti-check"></i></span><span className="step-line done"></span></div><div className="pb-5"><div className="text-sm font-semibold" style={{"color": "var(--ink)"}}>Execute on sandbox ledger</div><div className="text-xs font-mono tabular-nums" style={{"color": "var(--text-muted)"}}>64ms</div></div></div>
          <div className="flex gap-3"><div className="flex flex-col items-center"><span className="step-dot done"><i className="ti ti-check"></i></span></div><div><div className="text-sm font-semibold" style={{"color": "var(--ink)"}}>Webhook fired</div><div className="text-xs font-mono tabular-nums" style={{"color": "var(--text-muted)"}}>29ms</div></div></div>
        </div>
      </div>

      <div className="card p-5 col-span-2">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold" style={{"color": "var(--text-muted)"}}>REQUEST</span>
              <span className="text-[11px] font-semibold flex items-center gap-1" style={{"color": "var(--text-faint)"}}><i className="ti ti-pencil text-xs"></i>Editable</span>
            </div>
            <div className="code-block p-3.5 mt-2"><pre className="font-mono">{'{'}{"\n"}  <span className="tok-pl">"scenario"</span>: <span className="tok-str">"earn"</span>,{"\n"}  <span className="tok-pl">"memberPhone"</span>: <span className="tok-str">"+84901234567"</span>,{"\n"}  <span className="tok-pl">"billAmount"</span>: <span className="tok-num">520000</span>,{"\n"}  <span className="tok-pl">"campaignId"</span>: <span className="tok-str">"camp_test_01"</span>{"\n"}{'}'}</pre></div>
          </div>
          <div>
            <span className="text-xs font-bold" style={{"color": "var(--text-muted)"}}>RESPONSE <span style={{"color": "var(--success)"}}>200 · completed</span></span>
            <div className="code-block p-3.5 mt-2"><pre className="font-mono">{'{'}{"\n"}  <span className="tok-pl">"status"</span>: <span className="tok-str">"completed"</span>,{"\n"}  <span className="tok-pl">"petalsEarned"</span>: <span className="tok-num">52</span>,{"\n"}  <span className="tok-pl">"txHash"</span>: <span className="tok-str">"0x4a7f...e291"</span>,{"\n"}  <span className="tok-pl">"webhookDelivered"</span>: <span className="tok-kw">true</span>{"\n"}{'}'}</pre></div>
          </div>
        </div>
      </div>
    </div>

    <div className="card p-5">
      <span className="text-sm font-bold" style={{"color": "var(--ink)"}}>Run history</span>
      <div className="flex flex-col mt-3">
        
        <div className="flex items-center gap-3 py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
          <span className="scope-chip">Earn</span>
          <span className="text-xs font-mono flex-1" style={{"color": "var(--text-faint)"}}>2m ago</span>
          <span className="text-xs font-mono font-bold tabular-nums" style={{"color": "var(--success)"}}>200</span>
          <span className="status-pill success"><span className="dot" style={{"background": "currentColor"}}></span>Completed</span>
        </div>
        <div className="flex items-center gap-3 py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
          <span className="scope-chip">Redeem</span>
          <span className="text-xs font-mono flex-1" style={{"color": "var(--text-faint)"}}>18m ago</span>
          <span className="text-xs font-mono font-bold tabular-nums" style={{"color": "var(--success)"}}>200</span>
          <span className="status-pill success"><span className="dot" style={{"background": "currentColor"}}></span>Completed</span>
        </div>
        <div className="flex items-center gap-3 py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
          <span className="scope-chip">Earn</span>
          <span className="text-xs font-mono flex-1" style={{"color": "var(--text-faint)"}}>1h ago</span>
          <span className="text-xs font-mono font-bold tabular-nums" style={{"color": "var(--danger)"}}>422</span>
          <span className="status-pill danger"><span className="dot" style={{"background": "currentColor"}}></span>Failed</span>
        </div>
        <div className="flex items-center gap-3 py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
          <span className="scope-chip">Expire</span>
          <span className="text-xs font-mono flex-1" style={{"color": "var(--text-faint)"}}>2h ago</span>
          <span className="text-xs font-mono font-bold tabular-nums" style={{"color": "var(--success)"}}>200</span>
          <span className="status-pill success"><span className="dot" style={{"background": "currentColor"}}></span>Completed</span>
        </div>
      </div>
    </div>

    </>
  );
}
