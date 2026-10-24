export default function Mcp() {
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
          <h1 className="font-sans text-2xl font-extrabold tracking-tight flex items-center gap-2.5" style={{"color": "var(--ink)"}}>Developer<span className="font-mono text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg" style={{"background": "rgba(255,95,196,0.14)", "color": "#FF6FA5", "border": "1px solid rgba(255,95,196,0.3)"}}>MCP</span></h1>
        </div>
        <p className="text-sm mt-1.5 max-w-lg" style={{"color": "var(--text-muted)"}}>Let AI agents query loyalty data safely, within strict RBAC limits.</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="card p-5">
        <span className="text-sm font-bold" style={{"color": "var(--ink)"}}>MCP server URL</span>
        <div className="card2 flex items-center gap-2 px-3.5 py-3 mt-3">
          <span className="font-mono text-xs flex-1 truncate" style={{"color": "var(--ink)"}}>https://mcp.octap.com/lotusmart/test</span>
          <button className="copy-btn" aria-label="Copy MCP server URL" title="Copy MCP server URL"><i className="ti ti-copy text-xs"></i></button>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button className="btn-secondary-dark text-xs"><i className="ti ti-plug-connected"></i>Test connection</button>
          <span className="status-pill success"><i className="ti ti-check text-xs"></i>Connected · 41ms</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold rounded-xl px-3.5 py-2.5 mt-4" style={{"background": "rgba(56,219,224,0.08)", "border": "1px solid rgba(56,219,224,0.25)", "color": "var(--cyan)"}}><i className="ti ti-info-circle"></i>Mutating actions always require explicit human approval — agents cannot execute them unattended.</div>
      </div>

      <div className="card p-5">
        <span className="text-sm font-bold" style={{"color": "var(--ink)"}}>Allowed tools</span>
        <div className="text-xs font-semibold mt-2" style={{"color": "var(--text-muted)"}}>Read-only</div>
        
  <div className="flex items-center justify-between py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
    <div>
      <span className="font-mono text-xs font-bold" style={{"color": "var(--ink)"}}>balances:read</span>
      
    </div>
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold" style={{"color": "var(--success)"}}>On</span>
      <button role="switch" aria-checked="true" aria-label="Toggle balances:read" className="relative shrink-0" style={{"width": "36px", "height": "20px", "borderRadius": "999px", "background": "var(--success)"}}>
        <span style={{"position": "absolute", "top": "2px", "left": "18px", "width": "16px", "height": "16px", "borderRadius": "999px", "background": "#fff", "transition": "left .15s ease"}}></span>
      </button>
    </div>
  </div>
  <div className="flex items-center justify-between py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
    <div>
      <span className="font-mono text-xs font-bold" style={{"color": "var(--ink)"}}>members:read</span>
      
    </div>
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold" style={{"color": "var(--success)"}}>On</span>
      <button role="switch" aria-checked="true" aria-label="Toggle members:read" className="relative shrink-0" style={{"width": "36px", "height": "20px", "borderRadius": "999px", "background": "var(--success)"}}>
        <span style={{"position": "absolute", "top": "2px", "left": "18px", "width": "16px", "height": "16px", "borderRadius": "999px", "background": "#fff", "transition": "left .15s ease"}}></span>
      </button>
    </div>
  </div>
  <div className="flex items-center justify-between py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
    <div>
      <span className="font-mono text-xs font-bold" style={{"color": "var(--ink)"}}>campaigns:read</span>
      
    </div>
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold" style={{"color": "var(--success)"}}>On</span>
      <button role="switch" aria-checked="true" aria-label="Toggle campaigns:read" className="relative shrink-0" style={{"width": "36px", "height": "20px", "borderRadius": "999px", "background": "var(--success)"}}>
        <span style={{"position": "absolute", "top": "2px", "left": "18px", "width": "16px", "height": "16px", "borderRadius": "999px", "background": "#fff", "transition": "left .15s ease"}}></span>
      </button>
    </div>
  </div>
        <div className="text-xs font-semibold mt-3" style={{"color": "var(--text-muted)"}}>Mutating — default off</div>
        
  <div className="flex items-center justify-between py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
    <div>
      <span className="font-mono text-xs font-bold" style={{"color": "var(--ink)"}}>points:earn</span>
      
    </div>
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold" style={{"color": "var(--text-faint)"}}>Off</span>
      <button role="switch" aria-checked="false" aria-label="Toggle points:earn" className="relative shrink-0" style={{"width": "36px", "height": "20px", "borderRadius": "999px", "background": "rgba(255,255,255,0.1)"}}>
        <span style={{"position": "absolute", "top": "2px", "left": "2px", "width": "16px", "height": "16px", "borderRadius": "999px", "background": "#fff", "transition": "left .15s ease"}}></span>
      </button>
    </div>
  </div>
  <div className="flex items-center justify-between py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
    <div>
      <span className="font-mono text-xs font-bold" style={{"color": "var(--ink)"}}>points:redeem</span>
      
    </div>
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold" style={{"color": "var(--text-faint)"}}>Off</span>
      <button role="switch" aria-checked="false" aria-label="Toggle points:redeem" className="relative shrink-0" style={{"width": "36px", "height": "20px", "borderRadius": "999px", "background": "rgba(255,255,255,0.1)"}}>
        <span style={{"position": "absolute", "top": "2px", "left": "2px", "width": "16px", "height": "16px", "borderRadius": "999px", "background": "#fff", "transition": "left .15s ease"}}></span>
      </button>
    </div>
  </div>
        <span className="text-xs font-bold block mt-3" style={{"color": "var(--text-faint)"}}>3 of 5 tools enabled · RBAC scope: <span style={{"color": "var(--ink)"}}>manager+</span></span>
      </div>
    </div>

    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold" style={{"color": "var(--ink)"}}>Approval queue</span>
        <span className="status-pill warning">2 pending</span>
      </div>
      <div className="flex flex-col mt-3">
        
        <div className="flex items-center gap-3 py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
          <span className="scope-chip">points:earn</span>
          <div className="min-w-0 flex-1"><div className="text-sm font-semibold truncate" style={{"color": "var(--ink)"}}>Agent "Billing bot"</div><div className="text-xs font-mono" style={{"color": "var(--text-faint)"}}>+84901••567 · 50 Petals</div></div>
          <span className="text-xs font-mono" style={{"color": "var(--text-faint)"}}>2m ago</span>
          <button className="btn-primary-dark" style={{"padding": "5px 12px", "fontSize": "11px"}}>Approve</button>
          <button className="btn-secondary-dark" style={{"padding": "5px 12px", "fontSize": "11px"}}>Reject</button>
        </div>
        <div className="flex items-center gap-3 py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
          <span className="scope-chip">points:redeem</span>
          <div className="min-w-0 flex-1"><div className="text-sm font-semibold truncate" style={{"color": "var(--ink)"}}>Agent "Support bot"</div><div className="text-xs font-mono" style={{"color": "var(--text-faint)"}}>+8493••233 · 200 Petals</div></div>
          <span className="text-xs font-mono" style={{"color": "var(--text-faint)"}}>18m ago</span>
          <button className="btn-primary-dark" style={{"padding": "5px 12px", "fontSize": "11px"}}>Approve</button>
          <button className="btn-secondary-dark" style={{"padding": "5px 12px", "fontSize": "11px"}}>Reject</button>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold" style={{"color": "var(--ink)"}}>Client config</span>
          <div className="flex items-center gap-1" style={{"background": "rgba(255,255,255,0.05)", "borderRadius": "999px", "padding": "3px"}}>
            <span className="dtab active" style={{"padding": "4px 10px", "fontSize": "11px"}}>Claude Desktop</span>
            <span className="dtab" style={{"padding": "4px 10px", "fontSize": "11px"}}>Cursor</span>
            <span className="dtab" style={{"padding": "4px 10px", "fontSize": "11px"}}>Generic JSON</span>
          </div>
        </div>
        <div className="code-block p-4 mt-3 relative">
          <div className="absolute top-3 right-3"><button className="copy-btn" aria-label="Copy config" title="Copy config"><i className="ti ti-copy text-xs"></i></button></div>
          <pre className="font-mono">{'{'}{"\n"}  <span className="tok-pl">"mcpServers"</span>: {'{'}{"\n"}    <span className="tok-pl">"octap"</span>: {'{'}{"\n"}      <span className="tok-pl">"url"</span>: <span className="tok-str">"https://mcp.octap.com/lotusmart/test"</span>,{"\n"}      <span className="tok-pl">"apiKey"</span>: <span className="tok-str">"octap_test_sk_a9f2..."</span>,{"\n"}      <span className="tok-pl">"allowedTools"</span>: [<span className="tok-str">"balances:read"</span>, <span className="tok-str">"members:read"</span>, <span className="tok-str">"campaigns:read"</span>]{"\n"}    {'}'}{"\n"}  {'}'}{"\n"}{'}'}</pre>
        </div>
      </div>

      <div className="card p-5">
        <span className="text-sm font-bold" style={{"color": "var(--ink)"}}>Recent agent actions</span>
        <div className="flex flex-col mt-3">
          
          <div className="flex items-center gap-3 py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
            <span className="scope-chip">balances:read</span>
            <div className="min-w-0 flex-1"><div className="text-xs font-semibold truncate" style={{"color": "var(--text-2)"}}>Agent "Billing bot"</div></div>
            <span className="text-xs font-semibold" style={{"color": "var(--success)"}}>Allowed</span>
            <span className="text-xs font-mono" style={{"color": "var(--text-faint)"}}>4m ago</span>
          </div>
          <div className="flex items-center gap-3 py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
            <span className="scope-chip">campaigns:read</span>
            <div className="min-w-0 flex-1"><div className="text-xs font-semibold truncate" style={{"color": "var(--text-2)"}}>Agent "Support bot"</div></div>
            <span className="text-xs font-semibold" style={{"color": "var(--success)"}}>Allowed</span>
            <span className="text-xs font-mono" style={{"color": "var(--text-faint)"}}>22m ago</span>
          </div>
          <div className="flex items-center gap-3 py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
            <span className="scope-chip">points:earn</span>
            <div className="min-w-0 flex-1"><div className="text-xs font-semibold truncate" style={{"color": "var(--text-2)"}}>Agent "Billing bot"</div></div>
            <span className="text-xs font-semibold" style={{"color": "var(--danger)"}}>Denied — not approved</span>
            <span className="text-xs font-mono" style={{"color": "var(--text-faint)"}}>31m ago</span>
          </div>
        </div>
      </div>
    </div>

    </>
  );
}
