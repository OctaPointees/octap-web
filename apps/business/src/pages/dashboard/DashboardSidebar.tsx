type Props = {
  collapsed: boolean;
  onToggle: () => void;
  onDev: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onLogout: (e: React.MouseEvent<HTMLAnchorElement>) => void;
};

export default function DashboardSidebar({ collapsed, onToggle, onDev, onLogout }: Props) {
  return (
    <>
  <aside id="sidebar" className={`shrink-0 flex flex-col grad-brand rounded-[28px] p-4 ${collapsed ? 'collapsed' : ''}`}>
    <button id="collapseBtn" onClick={onToggle} className="size-7 rounded-full bg-white flex items-center justify-center shadow-lg" style={{"boxShadow": "0 4px 12px -2px rgba(42,10,28,0.35)"}}><i className="ri-arrow-left-s-line text-sm" style={{"color": "var(--purple)"}}></i></button>
    <div className="side-logo-row flex items-center gap-2.5 px-1">
      <div className="size-9 rounded-xl bg-white flex items-center justify-center p-[7px] shrink-0"><div className="logo-mark w-full h-full" style={{"background": "var(--purple)"}}></div></div>
      <span className="side-wordmark font-head text-lg font-extrabold tracking-tight text-white">OctaP</span>
    </div>

    <nav className="side-nav flex flex-col mt-5">
      <div className="side-group-label nav-group-label px-3">OVERVIEW</div>
      <div className="nav-divider" aria-hidden="true"></div>
      <a href="#" className="nav-item active flex items-center gap-2.5 px-3.5 py-2.5" data-tooltip="Dashboard" aria-label="Dashboard"><i className="ri-dashboard-3-fill shrink-0"></i><span className="side-label">Dashboard</span></a>

      <div className="side-group-label nav-group-label px-3">LOYALTY</div>
      <div className="nav-divider" aria-hidden="true"></div>
      <a href="#" className="nav-item flex items-center gap-2.5 px-3.5 py-2.5" data-tooltip="Issue points" aria-label="Issue points"><i className="ri-store-2-line shrink-0"></i><span className="side-label">Issue points</span></a>
      <a href="#" className="nav-item flex items-center gap-2.5 px-3.5 py-2.5" data-tooltip="Campaigns" aria-label="Campaigns"><i className="ri-megaphone-line shrink-0"></i><span className="side-label">Campaigns</span></a>
      <a href="#" className="nav-item flex items-center gap-2.5 px-3.5 py-2.5" data-tooltip="Rewards" aria-label="Rewards"><i className="ri-gift-line shrink-0"></i><span className="side-label">Rewards</span></a>
      <a href="#" className="nav-item flex items-center gap-2.5 px-3.5 py-2.5" data-tooltip="Members" aria-label="Members"><i className="ri-group-line shrink-0"></i><span className="side-label">Members</span></a>
      <a href="#" className="nav-item flex items-center gap-2.5 px-3.5 py-2.5" data-tooltip="Transactions" aria-label="Transactions"><i className="ri-exchange-line shrink-0"></i><span className="side-label">Transactions</span></a>

      <div className="side-group-label nav-group-label px-3">DEVELOPERS</div>
      <div className="nav-divider" aria-hidden="true"></div>
      <a href="#" onClick={onDev} className="nav-item flex items-center gap-2.5 px-3.5 py-2.5" data-tooltip="Developers" aria-label="Developers — opens a separate console">
        <i className="ri-terminal-box-line shrink-0"></i>
        <span className="side-label flex-1 text-left">Developers</span>
        <span className="dev-badge" aria-hidden="true"><i className="ri-arrow-right-up-line"></i></span>
      </a>

      <div className="side-group-label nav-group-label px-3">ACCOUNT</div>
      <div className="nav-divider" aria-hidden="true"></div>
      <a href="#" className="nav-item flex items-center gap-2.5 px-3.5 py-2.5" data-tooltip="Settings" aria-label="Settings"><i className="ri-settings-3-line shrink-0"></i><span className="side-label">Settings</span></a>
    </nav>

    <div className="side-footer-card rounded-2xl p-3.5 mt-3 shrink-0" style={{"background": "rgba(255,255,255,0.1)"}}>
      <div className="flex items-center gap-2"><span className="size-2 rounded-full shrink-0" style={{"background": "#5EEAB5"}}></span><span className="font-head text-xs font-extrabold text-white">Lotus Mart</span></div>
      <div className="tenant-detail text-xs mt-1" style={{"color": "rgba(255,255,255,0.75)"}}>Petals · LTM token · Enterprise plan</div>
    </div>

    <div id="userRow" className="flex items-center gap-2.5 rounded-2xl p-2.5 mt-3">
      <div className="size-9 rounded-full bg-white flex items-center justify-center font-head font-bold text-xs shrink-0" style={{"color": "var(--purple)"}}>MT</div>
      <div className="side-label min-w-0 flex-1"><div className="text-xs font-bold truncate text-white">Minh Trần</div><div className="text-xs truncate" style={{"color": "rgba(255,255,255,0.75)"}}>Owner · owner@lotusmart.vn</div></div>
    </div>
    <a href="#" id="logoutBtn" onClick={onLogout} className="btn-pill flex items-center justify-center gap-1.5 text-xs py-2.5 mt-2" style={{"background": "rgba(255,255,255,0.12)", "color": "#fff"}} aria-label="Log out"><i className="ri-logout-box-r-line shrink-0"></i><span className="side-label">Log out</span></a>
  </aside>
    </>
  );
}
