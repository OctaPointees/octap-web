const FAQ_ITEMS = [
  {
    question: 'What exactly is OctaP?',
    answer:
      'A Credit-as-a-Service platform that lets businesses run their own loyalty points and vouchers on the Sui blockchain, without building blockchain infrastructure themselves.',
  },
  {
    question: 'Do shoppers need a crypto wallet?',
    answer: 'No. Customers sign in with Google, email, or phone. Enoki zkLogin and sponsored transactions keep wallets and gas out of sight.',
  },
  {
    question: 'Can points be cashed out to money?',
    answer: 'No. Points are promotional credit, never converted to fiat currency.',
  },
  {
    question: 'Can points move between different shops?',
    answer: "Only within the same merchant's shops. Points never cross between unrelated merchants and can't be transferred person-to-person.",
  },
  {
    question: 'How is fraud prevented?',
    answer: "Every point issued or redeemed is written to the merchant's ledger record on Sui, so it can be checked rather than taken on trust.",
  },
  {
    question: 'How do developers integrate?',
    answer: 'Through the TypeScript SDK, scoped API keys, webhooks, and real-time logs, with a sandbox for testing before going live.',
  },
  {
    question: 'What is MCP?',
    answer:
      'The Model Context Protocol lets AI agents query balances and campaign data within strict RBAC permissions; any mutation they propose needs explicit human approval.',
  },
  {
    question: 'Is this a production system?',
    answer: 'This is a capstone project. The flows and APIs are designed the way a production CaaS platform would work, but the data on this page is illustrative.',
  },
];

export default function Faq() {
  return (
    <section id="faq" className="scroll-mt-16 py-24">
      <div className="max-w-[820px] mx-auto px-8">
        <h2 className="text-4xl font-extrabold mb-10 tracking-tight text-white" data-reveal>
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <details key={item.question} className="group glass rounded-2xl px-6 py-4" open={i === 0} data-reveal-alt>
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-sm list-none text-white">
                {item.question}
                <i className="ti ti-chevron-down group-open:rotate-180 transition-transform" />
              </summary>
              <p className="mt-3 text-sm text-[#c8bcdb] leading-relaxed">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
