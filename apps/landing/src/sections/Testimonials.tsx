export default function Testimonials() {
  return (
    <section className="py-20">
      <div className="max-w-320 mx-auto px-8">
        <h2 className="font-head text-4xl font-extrabold tracking-tight text-center mb-3">
          What our partners say
        </h2>
        <p className="text-center text-muted mb-12">
          Fictional quotes for illustration, voiced by our example partners.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="step-card shadow-float-sm p-7">
            <div className="flex gap-1 text-amber mb-4">
              <i className="ri-star-fill"></i>
              <i className="ri-star-fill"></i>
              <i className="ri-star-fill"></i>
              <i className="ri-star-fill"></i>
              <i className="ri-star-fill"></i>
            </div>
            <p className="text-sm leading-relaxed mb-6">
              "Switching our loyalty program to OctaP took an afternoon, not a quarter. Our members
              can finally see exactly where their points come from."
            </p>
            <div className="font-head font-bold text-sm">Mai Linh</div>
            <div className="text-xs text-muted">Operations Lead · Lotus Mart</div>
          </div>
          <div className="step-card shadow-float-sm p-7 md:-translate-y-4">
            <div className="flex gap-1 text-amber mb-4">
              <i className="ri-star-fill"></i>
              <i className="ri-star-fill"></i>
              <i className="ri-star-fill"></i>
              <i className="ri-star-fill"></i>
              <i className="ri-star-fill"></i>
            </div>
            <p className="text-sm leading-relaxed mb-6">
              "The MCP server means our support agents can check a customer's balance without ever
              touching a spreadsheet."
            </p>
            <div className="font-head font-bold text-sm">Đức Anh</div>
            <div className="text-xs text-muted">Founder · Phố Cà Phê</div>
          </div>
          <div className="step-card shadow-float-sm p-7">
            <div className="flex gap-1 text-amber mb-4">
              <i className="ri-star-fill"></i>
              <i className="ri-star-fill"></i>
              <i className="ri-star-fill"></i>
              <i className="ri-star-fill"></i>
              <i className="ri-star-fill"></i>
            </div>
            <p className="text-sm leading-relaxed mb-6">
              "We went from a loyalty program nobody trusted to one customers actually ask about."
            </p>
            <div className="font-head font-bold text-sm">Thanh Hà</div>
            <div className="text-xs text-muted">Marketing Director · Sài Gòn Books</div>
          </div>
        </div>
      </div>
    </section>
  );
}
