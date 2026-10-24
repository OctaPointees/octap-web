export default function Sandbox() {
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
          <h1 className="font-sans text-2xl font-extrabold tracking-tight flex items-center gap-2.5" style={{"color": "var(--ink)"}}>Developer<span className="font-mono text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg" style={{"background": "rgba(255,95,196,0.14)", "color": "#FF6FA5", "border": "1px solid rgba(255,95,196,0.3)"}}>sandbox</span></h1>
        </div>
        <p className="text-sm mt-1.5 max-w-lg" style={{"color": "var(--text-muted)"}}>An isolated copy of Lotus Mart's data — safe to break, reset anytime.</p>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-3">
      <div className="glass p-5">
        <div className="text-xs font-semibold" style={{"color": "var(--text-muted)"}}>Test members</div>
        <div className="flex items-end gap-2 mt-1.5"><span className="text-2xl font-extrabold tabular-nums" style={{"color": "var(--ink)"}}>3</span><span className="text-xs tabular-nums mb-1" style={{"color": "var(--text-faint)"}}>of 128</span></div>
        <a href="#" className="text-xs font-bold flex items-center gap-1 mt-1" style={{"color": "var(--pink)"}}>View all members<i className="ti ti-arrow-right text-xs"></i></a>
      </div>
      <div className="glass p-5"><div className="text-xs font-semibold" style={{"color": "var(--text-muted)"}}>Test campaigns</div><div className="text-2xl font-extrabold mt-1.5 tabular-nums" style={{"color": "var(--ink)"}}>6</div></div>
      <div className="glass p-5"><div className="text-xs font-semibold" style={{"color": "var(--text-muted)"}}>Test transactions</div><div className="text-2xl font-extrabold mt-1.5 tabular-nums" style={{"color": "var(--ink)"}}>482</div></div>
    </div>

    <div className="card p-5 flex items-center justify-between flex-wrap gap-3">
      <div>
        <span className="text-sm font-bold" style={{"color": "var(--ink)"}}>Reset sandbox data</span>
        <p className="text-xs mt-1" style={{"color": "var(--text-muted)"}}>Wipes test members, campaigns and transactions back to the seed dataset. Requires typing RESET to confirm.</p>
        <p className="text-[11px] mt-1 font-mono" style={{"color": "var(--text-faint)"}}>Last reset: Oct 18, 2026 · Seed dataset v1.4</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button className="btn-secondary-dark text-xs"><i className="ti ti-user-plus"></i>Add test member</button>
        <button className="btn-danger-dark text-xs" data-action="open-reset-confirm"><i className="ti ti-rotate-clockwise"></i>Reset sandbox</button>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="card p-5">
        <span className="text-sm font-bold" style={{"color": "var(--ink)"}}>Test members</span>
        <div className="flex flex-col mt-3">
          
          <div className="flex items-center gap-3 py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
            <div className="size-8 rounded-full flex items-center justify-center font-bold text-[10px]" style={{"background": "rgba(255,255,255,0.05)", "color": "var(--pink)"}}>VA</div>
            <div className="min-w-0 flex-1"><div className="text-sm font-semibold truncate" style={{"color": "var(--ink)"}}>Nguyễn Văn An</div><div className="text-xs font-mono" style={{"color": "var(--text-faint)"}}>+8490•••456</div></div>
            <span className="scope-chip">Gold</span>
            <span className="text-xs font-mono font-bold tabular-nums" style={{"color": "var(--ink)"}}>2,480 Petals</span>
          </div>
          <div className="flex items-center gap-3 py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
            <div className="size-8 rounded-full flex items-center justify-center font-bold text-[10px]" style={{"background": "rgba(255,255,255,0.05)", "color": "var(--pink)"}}>TB</div>
            <div className="min-w-0 flex-1"><div className="text-sm font-semibold truncate" style={{"color": "var(--ink)"}}>Trần Thị Bình</div><div className="text-xs font-mono" style={{"color": "var(--text-faint)"}}>+8491•••091</div></div>
            <span className="scope-chip">Silver</span>
            <span className="text-xs font-mono font-bold tabular-nums" style={{"color": "var(--ink)"}}>940 Petals</span>
          </div>
          <div className="flex items-center gap-3 py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
            <div className="size-8 rounded-full flex items-center justify-center font-bold text-[10px]" style={{"background": "rgba(255,255,255,0.05)", "color": "var(--pink)"}}>MC</div>
            <div className="min-w-0 flex-1"><div className="text-sm font-semibold truncate" style={{"color": "var(--ink)"}}>Lê Minh Châu</div><div className="text-xs font-mono" style={{"color": "var(--text-faint)"}}>+8493•••233</div></div>
            <span className="scope-chip">Platinum</span>
            <span className="text-xs font-mono font-bold tabular-nums" style={{"color": "var(--ink)"}}>8,120 Petals</span>
          </div>
        </div>
      </div>
      <div className="card p-5">
        <span className="text-sm font-bold" style={{"color": "var(--ink)"}}>Test campaigns</span>
        <div className="flex flex-col mt-3">
          
          <div className="flex items-center gap-3 py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
            <div className="min-w-0 flex-1"><div className="text-sm font-semibold truncate" style={{"color": "var(--ink)"}}>Tết Golden Hour (test)</div><div className="text-xs" style={{"color": "var(--text-muted)"}}>Multiplier</div></div>
            <span><span className="status-pill success"><span className="dot" style={{"background": "currentColor"}}></span>Active</span></span>
          </div>
          <div className="flex items-center gap-3 py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
            <div className="min-w-0 flex-1"><div className="text-sm font-semibold truncate" style={{"color": "var(--ink)"}}>Weekday Coffee Boost (test)</div><div className="text-xs" style={{"color": "var(--text-muted)"}}>Bonus</div></div>
            <span><span className="status-pill success"><span className="dot" style={{"background": "currentColor"}}></span>Active</span></span>
          </div>
          <div className="flex items-center gap-3 py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
            <div className="min-w-0 flex-1"><div className="text-sm font-semibold truncate" style={{"color": "var(--ink)"}}>Expired promo (test)</div><div className="text-xs" style={{"color": "var(--text-muted)"}}>Fixed reward</div></div>
            <span><span className="status-pill muted"><span className="dot" style={{"background": "currentColor"}}></span>Ended</span></span>
          </div>
        </div>
      </div>
    </div>

    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold" style={{"color": "var(--ink)"}}>Recent sandbox activity</span>
        <a href="#" className="text-xs font-bold flex items-center gap-1" style={{"color": "var(--pink)"}}>Go to Mock transactions<i className="ti ti-arrow-right text-xs"></i></a>
      </div>
      <div className="flex flex-col mt-3">
        
        <div className="flex items-center gap-3 py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
          <i className="ti ti-history text-sm" style={{"color": "var(--text-faint)"}}></i>
          <span className="text-sm flex-1" style={{"color": "var(--text-2)"}}>Reset sandbox</span>
          <span className="text-xs" style={{"color": "var(--text-faint)"}}>Minh Trần</span>
          <span className="text-xs font-mono" style={{"color": "var(--text-faint)"}}>3d ago</span>
        </div>
        <div className="flex items-center gap-3 py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
          <i className="ti ti-history text-sm" style={{"color": "var(--text-faint)"}}></i>
          <span className="text-sm flex-1" style={{"color": "var(--text-2)"}}>Added test member Lê Minh Châu</span>
          <span className="text-xs" style={{"color": "var(--text-faint)"}}>Minh Trần</span>
          <span className="text-xs font-mono" style={{"color": "var(--text-faint)"}}>5d ago</span>
        </div>
        <div className="flex items-center gap-3 py-2.5" style={{"borderBottom": "1px solid var(--card-border)"}}>
          <i className="ti ti-history text-sm" style={{"color": "var(--text-faint)"}}></i>
          <span className="text-sm flex-1" style={{"color": "var(--text-2)"}}>Ran mock scenario: earn</span>
          <span className="text-xs" style={{"color": "var(--text-faint)"}}>Minh Trần</span>
          <span className="text-xs font-mono" style={{"color": "var(--text-faint)"}}>6d ago</span>
        </div>
      </div>
    </div>

    </>
  );
}
