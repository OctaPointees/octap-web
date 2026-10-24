import { useLayoutEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { DEV_TABS } from './tabs';
import { useTransition } from '../../components/transitionContext';

export default function DevLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { exitDeveloper } = useTransition();
  const root = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const fromDashboard = (location.state as { from?: string } | null)?.from === 'dashboard';

  useLayoutEffect(() => {
    if (!fromDashboard || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.from('#devNav', { x: -36, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 0.15 });
      gsap.from('#devContent > *', { y: 22, opacity: 0, duration: 0.55, ease: 'power3.out', stagger: 0.06, delay: 0.2, clearProps: 'all' });
    }, root);
    return () => ctx.revert();
  }, [fromDashboard]);

  return (
    <div
      ref={root}
      className="theme-dev font-sans antialiased flex gap-3 p-3 relative"
      style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100dvh' }}
    >
      <div className="ambient-grid"></div>
      <div
        className="ambient-orb"
        style={{ width: 520, height: 520, top: -140, left: 260, opacity: 0.22, background: 'radial-gradient(circle,#ff5fc4,transparent 70%)' }}
      ></div>
      <div
        className="ambient-orb"
        style={{ width: 480, height: 480, bottom: -160, right: -80, opacity: 0.18, background: 'radial-gradient(circle,#38dbe0,transparent 70%)' }}
      ></div>

      <aside
        id="devNav"
        className={`shrink-0 flex flex-col card p-4 relative ${collapsed ? 'collapsed' : ''}`}
        style={{ zIndex: 1 }}
      >
        <button
          id="devCollapseBtn"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className="ti ti-chevron-left text-xs" style={{ color: 'var(--pink)' }}></i>
        </button>
        <button className="back-btn" data-tooltip="Back to Dashboard" onClick={exitDeveloper}>
          <i className="ti ti-arrow-left text-sm"></i>
          <span className="dside-label">Back to Dashboard</span>
        </button>
        <div id="devLogoRow" className="flex items-center gap-2.5 px-1 mt-6">
          <div className="size-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,95,196,0.12)' }}>
            <div
              className="logo-mark"
              style={{ width: 20, height: 20, background: 'linear-gradient(135deg,var(--pink-deep),var(--pink))', filter: 'drop-shadow(0 0 6px rgba(255,95,196,0.45))' }}
            ></div>
          </div>
          <span className="font-sans text-base font-extrabold tracking-tight flex items-center gap-2 dside-label" style={{ color: 'var(--ink)' }}>
            OctaP
            <span
              className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--text-muted)', border: '1px solid var(--card-border)' }}
            >
              Dev
            </span>
          </span>
        </div>
        <nav className="flex flex-col gap-1 mt-7" style={{ flex: 1, overflow: 'visible' }}>
          {DEV_TABS.map(([id, label, icon]) => (
            <NavLink
              key={id}
              to={`/developers/${id}`}
              data-tooltip={label}
              className={({ isActive }) => `dnav-item${isActive ? ' active' : ''} flex items-center gap-2.5 px-3.5 py-2.5`}
            >
              <i className={`ti ${icon} text-base shrink-0`}></i>
              <span className="dside-label">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="dside-footer-block flex items-center gap-3 px-1 mb-3">
          <a href="#" className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Docs</a>
          <span style={{ color: 'var(--card-border)' }}>·</span>
          <a href="#" className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Changelog</a>
          <span style={{ color: 'var(--card-border)' }}>·</span>
          <a href="#" className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Support</a>
        </div>
        <div id="devTenantCard" className="dside-footer-block card2 p-3.5">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full shrink-0" style={{ background: 'var(--success)' }}></span>
            <span className="font-sans text-xs font-extrabold" style={{ color: 'var(--ink)' }}>Lotus Mart</span>
          </div>
          <div className="text-xs mt-1 dtenant-detail" style={{ color: 'var(--text-muted)' }}>Petals · LTM token · Enterprise plan</div>
        </div>
        <div id="devUserRow" className="flex items-center gap-2.5 rounded-2xl p-2.5 mt-3">
          <div
            className="size-9 rounded-full flex items-center justify-center font-sans font-bold text-xs shrink-0"
            style={{ background: 'linear-gradient(135deg,var(--pink-deep),var(--pink))', color: '#fff' }}
          >
            MT
          </div>
          <div className="min-w-0 flex-1 dside-label">
            <div className="text-xs font-bold truncate" style={{ color: 'var(--ink)' }}>Minh Trần</div>
            <div className="text-[10.5px] truncate" style={{ color: 'var(--text-faint)' }}>Owner · owner@lotusmart.vn</div>
          </div>
        </div>
      </aside>

      <div id="devContent" className="flex-1 min-w-0 flex flex-col gap-4 relative" style={{ zIndex: 1, minHeight: '100dvh' }}>
        <Outlet />
      </div>
    </div>
  );
}
