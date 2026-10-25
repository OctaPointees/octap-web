import { useState } from 'react';

export default function LeadGen() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <section id="lead-gen" className="scroll-mt-20 py-10">
      <div className="max-w-320 mx-auto px-8">
        <div className="grid lg:grid-cols-2 rounded-box overflow-hidden shadow-float">
          <div className="grad-brand text-white p-12 relative overflow-hidden flex flex-col justify-center">
            <svg
              className="absolute -left-6 -top-10 opacity-20"
              width="220"
              height="220"
              viewBox="0 0 220 220"
              fill="none"
            >
              <path
                d="M70 40C40 55 25 85 25 115c0 25 18 40 38 40 18 0 32-13 32-31 0-17-12-29-27-29-3 0-6 .4-8 1 2-20 16-35 33-43L70 40zm90 0c-30 15-45 45-45 75 0 25 18 40 38 40 18 0 32-13 32-31 0-17-12-29-27-29-3 0-6 .4-8 1 2-20 16-35 33-43L160 40z"
                fill="currentColor"
              />
            </svg>
            <div className="relative">
              <h2 className="font-head text-3xl font-extrabold mb-4">
                Talk to us about loyalty points for your business
              </h2>
              <p className="text-white/85 leading-relaxed">
                Customer loyalty, employee recognition, or sales incentives — OctaP's points
                infrastructure adapts to what your business needs. Use the demo form to preview your
                enquiry.
              </p>
            </div>
          </div>
          <form
            className="bg-white p-6 md:p-12"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
            }}
            onChange={() => setSubmitted(false)}
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                autoComplete="name"
                aria-label="Full name"
                required
                placeholder="Full name *"
                className="rounded-md border border-purple/15 px-4 py-3 text-sm outline-none focus:border-purple sm:col-span-1"
              />
              <input
                type="tel"
                name="phone"
                autoComplete="tel"
                aria-label="Phone number"
                required
                placeholder="Phone number *"
                className="rounded-md border border-purple/15 px-4 py-3 text-sm outline-none focus:border-purple sm:col-span-1"
              />
              <input
                type="email"
                name="email"
                autoComplete="email"
                aria-label="Company email"
                required
                placeholder="Company email *"
                className="rounded-md border border-purple/15 px-4 py-3 text-sm outline-none focus:border-purple sm:col-span-2"
              />
              <select
                name="purpose"
                aria-label="What would you like to use points for?"
                required
                defaultValue=""
                className="rounded-md border border-purple/15 px-4 py-3 text-sm outline-none focus:border-purple sm:col-span-2 text-muted"
              >
                <option value="" disabled>
                  What would you like to use points for?
                </option>
                <option value="loyalty">Customer loyalty</option>
                <option value="recognition">Employee recognition</option>
                <option value="incentives">Sales incentives</option>
                <option value="other">Something else</option>
              </select>
              <textarea
                name="message"
                aria-label="Briefly describe what you need"
                placeholder="Briefly describe what you need"
                rows={3}
                className="rounded-md border border-purple/15 px-4 py-3 text-sm outline-none focus:border-purple sm:col-span-2"
              ></textarea>
            </div>
            <label className="flex items-start gap-2 mt-4 text-xs text-muted leading-relaxed">
              <input type="checkbox" name="consent" required className="mt-0.5" />I agree to be
              contacted by OctaP. This is a demo form for a capstone project — no data is actually
              submitted.
            </label>
            <button type="submit" className="btn-pill btn-primary text-sm w-full mt-5 py-3.5">
              Preview request
            </button>
            <p role="status" className="mt-3 text-sm text-brand">
              {submitted ? 'Your demo request is ready. No information was sent or saved.' : ''}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
