export default function PromoStrip() {
  return (
    <section className="w-full grad-brand text-white">
      <div className="flex flex-wrap items-center justify-center md:justify-between gap-4 px-8 py-4 max-w-320 mx-auto">
        <span className="font-head font-bold text-sm md:text-base">
          Point requests target <span className="text-amber">under 2s</span> · Balance queries
          target <span className="text-amber">under 500ms</span>
        </span>
        <a
          href="#features"
          className="btn-pill px-5 py-2 text-xs font-bold"
          style={{ background: '#fff', color: 'var(--purple)' }}
        >
          Learn more
        </a>
      </div>
    </section>
  );
}
