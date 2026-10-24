export default function Webhooks() {
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
          <h1 className="font-sans text-2xl font-extrabold tracking-tight flex items-center gap-2.5" style={{"color": "var(--ink)"}}>Developer<span className="font-mono text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg" style={{"background": "rgba(255,95,196,0.14)", "color": "#FF6FA5", "border": "1px solid rgba(255,95,196,0.3)"}}>webhooks</span></h1>
        </div>
        <p className="text-sm mt-1.5 max-w-lg" style={{"color": "var(--text-muted)"}}>Deliver real-time events to your own endpoints.</p>
      </div>
    </div>

    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold" style={{"color": "var(--ink)"}}>Endpoints</span>
        <button className="btn-primary-dark text-xs"><i className="ti ti-plus"></i>Add endpoint</button>
      </div>
      <div className="flex flex-col mt-3">
        
        <div className="py-3" style={{"borderBottom": "1px solid var(--card-border)"}}>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1"><div className="text-sm font-mono font-semibold truncate" style={{"color": "var(--ink)"}}>https://api.lotusmart.vn/hooks/octap</div><div className="flex gap-1.5 mt-1.5 flex-wrap"><span className="scope-chip font-mono">points.earned</span><span className="scope-chip font-mono">points.redeemed</span></div></div>
            <span className="text-xs font-mono" style={{"color": "var(--text-faint)"}}>2m ago</span>
            <span><span className="status-pill success"><span className="dot" style={{"background": "currentColor"}}></span>Healthy</span></span>
            <button aria-label="More actions for https://api.lotusmart.vn/hooks/octap" title="More actions" className="size-7 rounded-full flex items-center justify-center shrink-0" style={{"background": "rgba(255,255,255,0.05)"}}><i className="ti ti-dots-vertical text-sm" style={{"color": "var(--text-faint)"}}></i></button>
          </div>
          
        </div>
        <div className="py-3" style={{"borderBottom": "1px solid var(--card-border)"}}>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1"><div className="text-sm font-mono font-semibold truncate" style={{"color": "var(--ink)"}}>https://staging.lotusmart.vn/hooks/octap</div><div className="flex gap-1.5 mt-1.5 flex-wrap"><span className="scope-chip font-mono">points.earned</span></div></div>
            <span className="text-xs font-mono" style={{"color": "var(--text-faint)"}}>1h ago</span>
            <span><span className="status-pill danger"><span className="dot" style={{"background": "currentColor"}}></span>Failing</span></span>
            <button aria-label="More actions for https://staging.lotusmart.vn/hooks/octap" title="More actions" className="size-7 rounded-full flex items-center justify-center shrink-0" style={{"background": "rgba(255,255,255,0.05)"}}><i className="ti ti-dots-vertical text-sm" style={{"color": "var(--text-faint)"}}></i></button>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold mt-2 ml-0" style={{"color": "var(--danger)"}}><i className="ti ti-alert-circle"></i>HTTP 500 · 3 attempts · Next retry in 4m</div>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs" style={{"color": "var(--text-faint)"}}>Actions: <span style={{"color": "var(--text-muted)"}}>Send test event</span> · <span style={{"color": "var(--text-muted)"}}>Edit</span> · <span style={{"color": "var(--text-muted)"}}>Disable</span> · <span style={{"color": "var(--danger)"}}>Delete</span></div>
    </div>

    <div className="card p-5">
      <span className="text-sm font-bold" style={{"color": "var(--ink)"}}>Delivery history</span>
      <div className="grid grid-cols-[1.4fr_1.3fr_0.7fr_0.8fr_0.7fr_0.7fr] gap-2 text-[11px] font-bold uppercase tracking-wide px-1 mt-3" style={{"color": "var(--text-faint)"}}><span>Event</span><span>Endpoint</span><span>Status</span><span>Response time</span><span>Attempts</span><span></span></div>
      <div className="flex flex-col mt-1">
        
        <div className="grid grid-cols-[1.4fr_1.3fr_0.7fr_0.8fr_0.7fr_0.7fr] gap-2 items-center py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
          <span className="text-xs font-mono font-semibold" style={{"color": "var(--ink)"}}>points.earned</span>
          <span className="text-xs font-mono truncate" style={{"color": "var(--text-faint)"}}>api.lotusmart.vn</span>
          <span className="text-xs font-mono font-bold tabular-nums" style={{"color": "var(--success)"}}>200</span>
          <span className="text-xs font-mono tabular-nums" style={{"color": "var(--text-muted)"}}>118ms</span>
          <span className="text-xs font-mono tabular-nums" style={{"color": "var(--text-muted)"}}>1</span>
          <span></span>
        </div>
        <div className="grid grid-cols-[1.4fr_1.3fr_0.7fr_0.8fr_0.7fr_0.7fr] gap-2 items-center py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
          <span className="text-xs font-mono font-semibold" style={{"color": "var(--ink)"}}>points.redeemed</span>
          <span className="text-xs font-mono truncate" style={{"color": "var(--text-faint)"}}>api.lotusmart.vn</span>
          <span className="text-xs font-mono font-bold tabular-nums" style={{"color": "var(--success)"}}>200</span>
          <span className="text-xs font-mono tabular-nums" style={{"color": "var(--text-muted)"}}>96ms</span>
          <span className="text-xs font-mono tabular-nums" style={{"color": "var(--text-muted)"}}>1</span>
          <span></span>
        </div>
        <div className="grid grid-cols-[1.4fr_1.3fr_0.7fr_0.8fr_0.7fr_0.7fr] gap-2 items-center py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
          <span className="text-xs font-mono font-semibold" style={{"color": "var(--ink)"}}>points.earned</span>
          <span className="text-xs font-mono truncate" style={{"color": "var(--text-faint)"}}>staging.lotusmart.vn</span>
          <span className="text-xs font-mono font-bold tabular-nums" style={{"color": "var(--danger)"}}>500</span>
          <span className="text-xs font-mono tabular-nums" style={{"color": "var(--text-muted)"}}>—</span>
          <span className="text-xs font-mono tabular-nums" style={{"color": "var(--text-muted)"}}>3</span>
          <button className="btn-secondary-dark" style={{"padding": "4px 10px", "fontSize": "11px"}} aria-label="Retry delivery" title="Retry delivery"><i className="ti ti-refresh"></i>Retry</button>
        </div>
      </div>
    </div>

    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold" style={{"color": "var(--ink)"}}>Verify webhook signatures</span>
        <a href="#" className="text-xs font-bold flex items-center gap-1" style={{"color": "var(--pink)"}}>Full docs<i className="ti ti-external-link text-xs"></i></a>
      </div>
      <p className="text-xs mt-1" style={{"color": "var(--text-muted)"}}>The signing secret is shown once, right after you create or rotate it — check the confirmation drawer at that moment. Use it to verify the <span className="font-mono">X-OctaP-Signature</span> header on every delivery:</p>
      <div className="code-block p-3.5 mt-3"><pre className="font-mono"><span className="tok-kw">import</span> <span className="tok-pl">{'{'} verifySignature {'}'}</span> <span className="tok-kw">from</span> <span className="tok-str">'@octap/sdk'</span>;{"\n"}{"\n"}<span className="tok-kw">const</span> <span className="tok-fn">valid</span> = <span className="tok-fn">verifySignature</span>({'{'}{"\n"}  payload: req.rawBody,{"\n"}  signature: req.headers[<span className="tok-str">'x-octap-signature'</span>],{"\n"}  secret: process.env.<span className="tok-pl">WEBHOOK_SECRET</span>,{"\n"}{'}'});</pre></div>
    </div>

    </>
  );
}
