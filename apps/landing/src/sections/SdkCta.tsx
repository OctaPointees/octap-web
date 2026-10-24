export default function SdkCta() {
  return (
    <>
  <section className="py-14">
    <div className="max-w-[1000px] mx-auto px-8 rounded-[10px] border border-[var(--purple)]/15 flex flex-col md:flex-row items-center justify-between gap-6 p-10">
      <div>
        <h3 className="font-head text-xl font-bold mb-1">Ready to wire this into your stack?</h3>
        <p className="text-sm text-[#6b5a7d]">TypeScript SDK, sandbox, and an MCP server your agents can query safely.</p>
      </div>
      <a href="#developers" className="btn-pill btn-outline text-sm px-6 py-3 inline-flex items-center gap-1.5 flex-shrink-0">Explore the developer SDK <i className="ri-arrow-right-line"></i></a>
    </div>
  </section>

    </>
  );
}
