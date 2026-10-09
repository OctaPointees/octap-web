// Fixed, page-wide mystic background: a faint grid, five depth-parallax color blobs (driven by
// useLandingAnimations via [data-parallax]), and a cursor-glow that tracks the raw pointer
// position so empty gaps between cards react too, not just hovered elements.
export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      <div className="absolute -top-20 -left-10 size-[560px]" data-parallax="22">
        <div
          className="size-full rounded-full blur-3xl opacity-40 drift-slow"
          style={{ background: 'radial-gradient(circle,#ff5fc4,transparent 70%)' }}
        />
      </div>
      <div className="absolute top-[900px] -right-20 size-[520px]" data-parallax="-16">
        <div
          className="size-full rounded-full blur-3xl opacity-30 drift-slower"
          style={{ background: 'radial-gradient(circle,#38dbe0,transparent 70%)' }}
        />
      </div>
      <div className="absolute top-[2200px] left-1/4 size-[600px]" data-parallax="28">
        <div
          className="size-full rounded-full blur-3xl opacity-25 drift-slow"
          style={{ background: 'radial-gradient(circle,#8b5cf6,transparent 70%)' }}
        />
      </div>
      <div className="absolute top-[4200px] -left-10 size-[520px]" data-parallax="-20">
        <div
          className="size-full rounded-full blur-3xl opacity-30 drift-slower"
          style={{ background: 'radial-gradient(circle,#ff5fc4,transparent 70%)' }}
        />
      </div>
      <div className="absolute top-[5600px] right-0 size-[480px]" data-parallax="18">
        <div
          className="size-full rounded-full blur-3xl opacity-25 drift-slow"
          style={{ background: 'radial-gradient(circle,#38dbe0,transparent 70%)' }}
        />
      </div>
      <div
        className="absolute size-[640px] rounded-full blur-3xl"
        data-gsap="page-cursor-glow"
        style={{
          left: 0,
          top: 0,
          marginLeft: -320,
          marginTop: -320,
          background: 'radial-gradient(circle,rgba(255,95,196,0.22),rgba(139,92,246,0.14) 45%,transparent 72%)',
          opacity: 0,
        }}
      />
    </div>
  );
}
