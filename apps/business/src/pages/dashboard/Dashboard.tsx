import MobileNavigation from '../../components/MobileNavigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import DashboardSidebar from './DashboardSidebar';
import DashboardMain from './DashboardMain';
import TransactionDrawer from './TransactionDrawer';
import { TRANSACTIONS } from './transactions';
import { useTransition } from '../../components/transitionContext';
import { clearSession } from '../../auth';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { enterDeveloper } = useTransition();
  const root = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [env, setEnv] = useState<'live' | 'test'>('live');
  const [scrolled, setScrolled] = useState(false);
  const [txIndex, setTxIndex] = useState<number | null>(null);
  const fromDev = (location.state as { from?: string } | null)?.from === 'dev';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useLayoutEffect(() => {
    if (!fromDev || !root.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      return;
    const ctx = gsap.context(() => {
      gsap.from('#sidebar', { x: -48, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.45 });
      gsap.from('#mainLight > *', {
        y: 28,
        opacity: 0,
        duration: 0.65,
        ease: 'power3.out',
        stagger: 0.07,
        delay: 0.5,
        clearProps: 'all',
      });
    }, root);
    return () => ctx.revert();
  }, [fromDev]);

  return (
    <div ref={root} className="theme-light">
      <MobileNavigation title="Business">
        <a href="/dashboard">Dashboard</a>
        <a href="/developers/overview">Developer console</a>
        <button
          type="button"
          onClick={() => {
            clearSession();
            navigate('/login');
          }}
        >
          Log out
        </button>
      </MobileNavigation>
      <div
        className="font-body antialiased flex gap-3 p-3"
        style={{ background: 'var(--ground)', color: 'var(--ink)', minHeight: '100dvh' }}
      >
        <DashboardSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          onDev={(e) => {
            e.preventDefault();
            enterDeveloper(e);
          }}
          onLogout={(e) => {
            e.preventDefault();
            clearSession();
            navigate('/login');
          }}
        />
        <DashboardMain env={env} onEnv={setEnv} scrolled={scrolled} onTx={setTxIndex} />
      </div>
      {txIndex !== null && (
        <TransactionDrawer tx={TRANSACTIONS[txIndex]} onClose={() => setTxIndex(null)} />
      )}
    </div>
  );
}
