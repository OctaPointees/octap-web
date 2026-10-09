import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/**
 * Wires up every scroll/pointer-driven animation on the landing page: Lenis smooth scroll, the
 * hero load-in, generic section reveals (data-reveal / -left / -right / -wipe / -flip / -pop /
 * -alt), the pinned 3D flip-card deck in "How it works", and the whole-page pointer reactivity
 * (background parallax, cursor glow, glass spotlights, magnetic buttons, card tilt).
 *
 * Everything here queries the DOM by data-attribute/class rather than React refs, mirroring the
 * original hand-authored script 1:1 — the page has no component state of its own to animate, so
 * there's nothing a ref-based approach would buy beyond indirection. Runs once on mount inside a
 * gsap.context() so every tween/ScrollTrigger it creates is torn down together on unmount
 * (notably including React 19 StrictMode's dev-only mount→cleanup→mount cycle).
 */
export function useLandingAnimations() {
  useEffect(() => {
    const cleanupFns: Array<() => void> = [];

    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);
    cleanupFns.push(() => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
    });

    const ctx = gsap.context(() => {
      // Hero load-in sequence.
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from("[data-gsap='hero-headline']", { autoAlpha: 0, y: 28, duration: 0.7 })
        .from("[data-gsap='hero-subcopy']", { autoAlpha: 0, y: 20, duration: 0.6 }, '-=0.42')
        .from("[data-gsap='hero-ctas']", { autoAlpha: 0, y: 16, duration: 0.5 }, '-=0.38')
        .from("[data-gsap='hero-nfr']", { autoAlpha: 0, y: 10, duration: 0.4 }, '-=0.32')
        .from("[data-gsap='hero-phone']", { autoAlpha: 0, y: 24, scale: 0.96, duration: 0.7 }, '-=0.5')
        .from("[data-gsap='hero-ticket']", { autoAlpha: 0, y: 24, scale: 0.94, duration: 0.6 }, '-=0.45');

      // Reversible reveal for every card/section below the hero: appears scrolling down,
      // un-reveals scrolling back up.
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 15%', toggleActions: 'play none none reverse' },
          },
        );
      });

      // Developer section: code panel slides in from the left, permissions panel from the right.
      gsap.utils.toArray<HTMLElement>('[data-reveal-left]').forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, x: -60, rotateY: 8 },
          {
            autoAlpha: 1,
            x: 0,
            rotateY: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 18%', toggleActions: 'play none none reverse' },
          },
        );
      });
      gsap.utils.toArray<HTMLElement>('[data-reveal-right]').forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, x: 60, rotateY: -8 },
          {
            autoAlpha: 1,
            x: 0,
            rotateY: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 18%', toggleActions: 'play none none reverse' },
          },
        );
      });

      // Compare table: each row wipes open left-to-right, cells counter-slide for a layered feel.
      gsap.utils.toArray<HTMLElement>('[data-reveal-wipe]').forEach((row) => {
        gsap.set(row, { clipPath: 'inset(0 100% 0 0)' });
        const cells = row.querySelectorAll('td');
        gsap.set(cells, { x: -16, autoAlpha: 0 });
        const tl = gsap.timeline({
          scrollTrigger: { trigger: row, start: 'top 88%', end: 'bottom 30%', toggleActions: 'play none none reverse' },
        });
        tl.to(row, { clipPath: 'inset(0 0% 0 0)', duration: 0.55, ease: 'power2.inOut' }, 0).to(
          cells,
          { x: 0, autoAlpha: 1, duration: 0.4, ease: 'power2.out', stagger: 0.06 },
          0.1,
        );
      });

      // Partner cards: 3D flip-in, staggered.
      gsap.utils.toArray<HTMLElement>('[data-reveal-flip]').forEach((el, i) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, rotateX: -70, y: 30, transformPerspective: 800, transformOrigin: '50% 100%' },
          {
            autoAlpha: 1,
            rotateX: 0,
            y: 0,
            duration: 0.65,
            delay: i * 0.08,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 15%', toggleActions: 'play none none reverse' },
          },
        );
      });

      // Good-to-know panel and Final CTA: scale + glow pop-in.
      gsap.utils.toArray<HTMLElement>('[data-reveal-pop]').forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, scale: 0.88, filter: 'blur(6px)' },
          {
            autoAlpha: 1,
            scale: 1,
            filter: 'blur(0px)',
            duration: 0.6,
            ease: 'back.out(1.6)',
            scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 15%', toggleActions: 'play none none reverse' },
          },
        );
      });

      // FAQ items: alternate slide-in from left/right.
      gsap.utils.toArray<HTMLElement>('[data-reveal-alt]').forEach((el, i) => {
        const fromX = i % 2 === 0 ? -40 : 40;
        gsap.fromTo(
          el,
          { autoAlpha: 0, x: fromX },
          {
            autoAlpha: 1,
            x: 0,
            duration: 0.5,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 90%', end: 'bottom 10%', toggleActions: 'play none none reverse' },
          },
        );
      });

      // Signature pinned, scroll-scrubbed 3D flip-card deck. Two clean phases so nothing ever
      // overlaps or gets hidden mid-scroll:
      //   Phase A — the whole deck fans out sideways together, still face-down.
      //   Phase B — every card flips face-up together (tiny stagger for a natural wave, not a queue).
      // Cards are opaque (no glass/translucency) and use backface-visibility:hidden, so at any
      // scroll position each card shows exactly one clean face — never two blended together.
      // The neon glow lives on the outer .flip-card (which only ever translates/rotates in 2D)
      // rather than on the rotating .flip-face — a box-shadow repaints every frame it's attached
      // to an element whose 3D transform is changing, and five large blurred shadows repainting
      // in lockstep is what made card 2 onward stutter while card 1 (first to finish) looked fine.
      const cards = gsap.utils.toArray<HTMLElement>('.flip-card');
      const inners = cards.map((c) => c.querySelector<HTMLElement>('.flip-card-inner'));
      const n = cards.length;
      const slotGap = 246; // px between docked card centers — matches the larger 230px-wide cards
      const centerOffset = ((n - 1) * slotGap) / 2;

      // Resting state: all cards fanned face-down, stacked near the stage center.
      cards.forEach((card, i) => {
        gsap.set(card, { x: (i - (n - 1) / 2) * 16, y: 0, rotation: (i - (n - 1) / 2) * 4, z: 0.01, zIndex: i, force3D: true });
      });
      gsap.set(inners, { rotateY: 0, force3D: true });
      gsap.set('.flip-face', { force3D: true });

      const SPREAD_DURATION = 1; // phase A: the fan-out, shared by all cards at once
      const FLIP_DURATION = 0.6; // phase B: all cards flip together over this window
      const FLIP_STAGGER = 0.05; // tiny wave across the 5 cards, not a one-by-one queue

      // pin:true (not CSS position:sticky, which would otherwise fight GSAP's own pin-spacer and
      // let the next section's content ride up over the deck before the sequence finishes).
      // Trigger and pin target are the SAME element on purpose: when they differ (e.g. an outer
      // wrapper with its own fixed height pinning a shorter inner child), GSAP sizes the spacer
      // from the pinned child's own height plus the scroll distance, while start/end are measured
      // from the wrapper — the two numbers drift apart and the next section rides up over the
      // deck before it releases. Pinning the stage directly keeps both measurements in lockstep.
      const processTl = gsap.timeline({
        scrollTrigger: {
          trigger: "[data-name='process pin stage']",
          start: 'top top',
          end: '+=2400',
          scrub: 0.35,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Phase A — fan the whole deck out sideways together (tiny stagger for a natural swoosh).
      cards.forEach((card, i) => {
        const finalX = i * slotGap - centerOffset;
        processTl.to(card, { x: finalX, y: 0, rotation: 0, duration: SPREAD_DURATION, ease: 'power2.inOut' }, i * 0.03);
      });

      // Phase B — flip the whole deck face-up together: same start, a 0.05s wave across cards
      // instead of each one waiting for the previous to finish.
      processTl.to(inners, { rotateY: 180, duration: FLIP_DURATION, ease: 'power2.inOut', stagger: FLIP_STAGGER }, SPREAD_DURATION);

      // Cursor-reactive gradient blob in hero.
      const blob = document.querySelector<HTMLElement>("[data-gsap='cursor-blob']");
      const heroVisual = blob?.parentElement ?? null;
      if (blob && heroVisual) {
        const blobX = gsap.quickTo(blob, 'x', { duration: 0.6, ease: 'power3' });
        const blobY = gsap.quickTo(blob, 'y', { duration: 0.6, ease: 'power3' });
        const onHeroMove = (e: PointerEvent) => {
          const rect = heroVisual.getBoundingClientRect();
          blobX(e.clientX - rect.left - 128);
          blobY(e.clientY - rect.top - 128);
        };
        heroVisual.addEventListener('pointermove', onHeroMove);
        cleanupFns.push(() => heroVisual.removeEventListener('pointermove', onHeroMove));
      }

      // Whole-page mouse reactivity so motion isn't confined to the hero blob:
      //  1. Ambient background blobs drift opposite the cursor (parallax depth), page-wide.
      //  2. Every .glass panel gets a soft spotlight that follows the pointer while hovered.
      //  3. Primary pill buttons pull slightly toward the cursor (magnetic) and spring back.
      //  4. Feature/audience/partner cards tilt in 3D toward the cursor position.

      // 1. Background parallax — tracks pointer position across the whole viewport.
      const parallaxEls = gsap.utils.toArray<HTMLElement>('[data-parallax]').map((el) => ({
        depth: parseFloat(el.getAttribute('data-parallax') ?? '0') || 0,
        moveX: gsap.quickTo(el, 'x', { duration: 1.1, ease: 'power3' }),
        moveY: gsap.quickTo(el, 'y', { duration: 1.1, ease: 'power3' }),
      }));
      // A soft glow that tracks the raw cursor position (viewport-fixed), so the areas between
      // cards — not just the cards themselves — visibly react the moment the pointer enters them.
      const cursorGlow = document.querySelector<HTMLElement>("[data-gsap='page-cursor-glow']");
      const glowX = cursorGlow && gsap.quickTo(cursorGlow, 'x', { duration: 0.5, ease: 'power3' });
      const glowY = cursorGlow && gsap.quickTo(cursorGlow, 'y', { duration: 0.5, ease: 'power3' });
      let glowRevealed = false;

      if (parallaxEls.length || cursorGlow) {
        const onPointerMove = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          parallaxEls.forEach(({ depth, moveX, moveY }) => {
            moveX(nx * depth);
            moveY(ny * depth);
          });
          if (cursorGlow && glowX && glowY) {
            glowX(e.clientX);
            glowY(e.clientY);
            if (!glowRevealed) {
              glowRevealed = true;
              gsap.to(cursorGlow, { opacity: 1, duration: 0.5, ease: 'power1.out' });
            }
          }
        };
        window.addEventListener('pointermove', onPointerMove);
        cleanupFns.push(() => window.removeEventListener('pointermove', onPointerMove));
      }

      // 2. Glass-panel spotlight — a radial highlight that tracks the pointer inside each panel.
      gsap.utils.toArray<HTMLElement>('.glass').forEach((el) => {
        const onGlassMove = (e: PointerEvent) => {
          const rect = el.getBoundingClientRect();
          el.style.setProperty('--mx', e.clientX - rect.left + 'px');
          el.style.setProperty('--my', e.clientY - rect.top + 'px');
        };
        el.addEventListener('pointermove', onGlassMove);
        cleanupFns.push(() => el.removeEventListener('pointermove', onGlassMove));
      });

      // 3. Magnetic buttons — pull toward the cursor within their own box, spring back on leave.
      gsap.utils.toArray<HTMLElement>('[data-magnetic]').forEach((el) => {
        const moveX = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' });
        const moveY = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });
        const onMagneticMove = (e: PointerEvent) => {
          const rect = el.getBoundingClientRect();
          moveX((e.clientX - rect.left - rect.width / 2) * 0.35);
          moveY((e.clientY - rect.top - rect.height / 2) * 0.35);
        };
        const onMagneticLeave = () => {
          moveX(0);
          moveY(0);
        };
        el.addEventListener('pointermove', onMagneticMove);
        el.addEventListener('pointerleave', onMagneticLeave);
        cleanupFns.push(() => {
          el.removeEventListener('pointermove', onMagneticMove);
          el.removeEventListener('pointerleave', onMagneticLeave);
        });
      });

      // 4. Card tilt — subtle 3D rotation toward the cursor, for grid cards that aren't already
      // scroll-animated (the pinned flip deck manages its own transform and is deliberately
      // excluded so the two animation systems never fight over the same element).
      gsap.utils.toArray<HTMLElement>('[data-tilt]').forEach((el) => {
        const onTiltMove = (e: PointerEvent) => {
          const rect = el.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width - 0.5;
          const py = (e.clientY - rect.top) / rect.height - 0.5;
          gsap.to(el, { rotateX: py * -8, rotateY: px * 8, y: -4, duration: 0.5, ease: 'power3', overwrite: 'auto' });
        };
        const onTiltLeave = () => {
          gsap.to(el, { rotateX: 0, rotateY: 0, y: 0, duration: 0.5, ease: 'power3', overwrite: 'auto' });
        };
        el.addEventListener('pointermove', onTiltMove);
        el.addEventListener('pointerleave', onTiltLeave);
        cleanupFns.push(() => {
          el.removeEventListener('pointermove', onTiltMove);
          el.removeEventListener('pointerleave', onTiltLeave);
        });
      });
    });

    // Web fonts (Be Vietnam Pro / Caveat / Tabler icons) finish loading after ScrollTrigger's
    // first measurement pass, reflowing every section above the pin and leaving its start/end
    // (and the pin-spacer height reserved for it) stale — which is what let later sections ride
    // up over the still-unfinished card sequence. Re-measure once layout has actually settled.
    const refreshPins = () => ScrollTrigger.refresh();
    document.fonts?.ready?.then(refreshPins);
    window.addEventListener('load', refreshPins);
    const timeouts = [setTimeout(refreshPins, 400), setTimeout(refreshPins, 1200)];
    cleanupFns.push(() => {
      window.removeEventListener('load', refreshPins);
      timeouts.forEach(clearTimeout);
    });

    return () => {
      ctx.revert();
      cleanupFns.forEach((fn) => fn());
    };
  }, []);
}
