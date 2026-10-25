export default function Press() {
  return (
    <section className="py-14">
      <div className="max-w-320 mx-auto px-8 text-center mb-8">
        <h3 className="font-head text-xl font-bold text-muted">
          What the press is saying{' '}
          <span className="text-xs font-normal">(fictional, for illustration)</span>
        </h3>
      </div>
      <div className="max-w-275 mx-auto px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          <div className="flex items-center gap-2 whitespace-nowrap text-muted font-head font-bold">
            <i className="ri-newspaper-line text-purple"></i>VietTech Weekly — "A refreshingly
            honest approach to blockchain loyalty"
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap text-muted font-head font-bold">
            <i className="ri-newspaper-line text-purple"></i>SaaS Review VN — "The MCP server every
            CaaS platform will copy"
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap text-muted font-head font-bold">
            <i className="ri-newspaper-line text-purple"></i>Retail Asia Digest — "Merchant-isolated
            ledgers, finally done right"
          </div>
        </div>
      </div>
    </section>
  );
}
