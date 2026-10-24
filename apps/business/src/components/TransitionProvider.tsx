import { useCallback, useMemo, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';

import { TransitionContext } from './transitionContext';

// Dashboard -> Developer: the supplied clip plays full-screen (starts magenta like the sidebar, ends
// on the console's near-black), the route swaps underneath it, then it fades away.
// Developer -> Dashboard: a magenta circle wipe grows from the button, the OctaP mark pulses, the
// route swaps, and the circle closes toward the centre to reveal the dashboard.
export default function TransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const videoWrap = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const wipe = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const enterDeveloper = useCallback(() => {
    const wrap = videoWrap.current;
    const v = video.current;
    if (!wrap || !v || busy.current) return;
    busy.current = true;

    const go = () => navigate('/developers/overview', { state: { from: 'dashboard' } });
    v.currentTime = 0;
    gsap.set(wrap, { display: 'block', opacity: 0 });
    v.play().catch(() => {
      busy.current = false;
      gsap.set(wrap, { display: 'none' });
      go();
    });

    const duration = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 0.95;
    gsap
      .timeline({
        onComplete: () => {
          v.pause();
          busy.current = false;
        },
      })
      .to(wrap, { opacity: 1, duration: 0.18, ease: 'power1.out' })
      .call(go, undefined, Math.max(duration - 0.2, 0.4))
      .to(wrap, { opacity: 0, duration: 0.45, ease: 'power1.inOut' }, duration)
      .set(wrap, { display: 'none' });
  }, [navigate]);

  const exitDeveloper = useCallback(
    (e?: React.MouseEvent) => {
      const w = wipe.current;
      const m = mark.current;
      if (!w || !m || busy.current) return;
      busy.current = true;

      const rect = e?.currentTarget instanceof HTMLElement ? e.currentTarget.getBoundingClientRect() : null;
      const x = rect ? rect.left + rect.width / 2 : 80;
      const y = rect ? rect.top + rect.height / 2 : 60;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const R = Math.hypot(window.innerWidth, window.innerHeight);

      gsap
        .timeline({
          onComplete: () => {
            busy.current = false;
          },
        })
        .set(w, { display: 'flex', clipPath: `circle(0px at ${x}px ${y}px)` })
        .set(m, { scale: 0.5, opacity: 0, rotate: -12 })
        .to(w, { clipPath: `circle(${R}px at ${x}px ${y}px)`, duration: 0.7, ease: 'power3.in' })
        .to(m, { scale: 1, opacity: 1, rotate: 0, duration: 0.45, ease: 'back.out(1.8)' }, '-=0.3')
        .call(() => navigate('/dashboard', { state: { from: 'dev' } }))
        .to(m, { scale: 1.12, duration: 0.22, ease: 'sine.inOut', yoyo: true, repeat: 1 })
        .to(m, { scale: 0.6, opacity: 0, duration: 0.25, ease: 'power2.in' }, '>-0.05')
        .fromTo(
          w,
          { clipPath: `circle(${R}px at ${cx}px ${cy}px)` },
          { clipPath: `circle(0px at ${cx}px ${cy}px)`, duration: 0.8, ease: 'power3.inOut', immediateRender: false },
          '<0.05',
        )
        .set(w, { display: 'none' });
    },
    [navigate],
  );

  const value = useMemo(() => ({ enterDeveloper, exitDeveloper }), [enterDeveloper, exitDeveloper]);

  return (
    <TransitionContext.Provider value={value}>
      {children}
      <div ref={videoWrap} className="fixed inset-0 pointer-events-none" style={{ display: 'none', zIndex: 1000, background: '#04030c' }} aria-hidden="true">
        <video ref={video} src="/videos/octap_to_dev_short.mp4" muted playsInline preload="auto" className="w-full h-full object-cover" />
      </div>
      <div
        ref={wipe}
        className="fixed inset-0 items-center justify-center pointer-events-none"
        style={{ display: 'none', zIndex: 1001, background: 'linear-gradient(155deg,#D6177E 0%,#C200AB 62%,#B4106A 100%)' }}
        aria-hidden="true"
      >
        <div ref={mark} style={{ width: 120, height: 120, background: '#fff', WebkitMask: "url('/icons/logo_light.png') center/contain no-repeat", mask: "url('/icons/logo_light.png') center/contain no-repeat", filter: 'drop-shadow(0 0 24px rgba(255,255,255,.55))' }} />
      </div>
    </TransitionContext.Provider>
  );
}
